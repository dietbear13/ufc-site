import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
// @ts-ignore: gray-matter has no default export in types
import matter from 'gray-matter';
import Fuse from 'fuse.js';
import axios from 'axios'

/** Data interfaces for events, fights, and fighters */
interface EventFight {
    fighter1: string;
    fighter1_slug?: string;
    fighter2: string;
    fighter2_slug?: string;
    weight: string;
    time: string;
    rounds: string;
    result?: string;
}
interface EventData {
    id: number;
    slug: string;
    name: string;
    date: string;
    location: string;
    time: string;
    poster: string;
    main_card: EventFight[];
    prelims_card: EventFight[];
}
interface FighterFight {
    date: string;
    event: string;
    event_slug?: string;
    opponent: string;
    opponent_slug?: string;
    result: string;      // 'win','lose','draw' or '' if cancelled
    status?: string;     // e.g. 'отменён' for cancelled fights
    method: string;
    round: string;
    time: string;
    division?: string;
    importance?: string;
}
interface FighterData {
    id: number;
    slug: string;
    name: string;
    nickname?: string;
    country?: string;
    division?: string;
    age?: number;
    height?: number;
    weight?: number;
    reach?: number;
    leg_reach?: number;
    stance?: string;
    style?: string;
    wins: number;
    losses: number;
    draws: number;
    record: string;
    rank?: string;
    image: string;
    bio?: string;
    win_methods?: { method: string; count: number; percentage: string; }[];
    loss_methods?: { method: string; count: number; percentage: string; }[];
    fight_time_avg?: string;
    fight_time_ufc_avg?: string;
    first_round_finishes?: number;
    significant_strikes_per_minute?: string | number;
    significant_strike_accuracy?: string | number;
    significant_strikes_absorbed?: string | number;
    significant_strike_defense?: string | number;
    takedown_average?: string | number;
    takedown_accuracy?: string | number;
    takedown_defense?: string | number;
    submission_attempts_per_15_min?: string | number;
    fights_history?: FighterFight[];
}

// Configuration constants
const BASE_URL = 'https://gidstats.com';
const EVENTS_URL = `${BASE_URL}/ru/events/`;
const FIGHTERS_LIST_URL = `${BASE_URL}/ru/fighters/`;
const MAX_FIGHTER_PAGES = 10;
const DELAY_MS_EVENTS = 1000;
const DELAY_MS_FIGHTERS = 500;
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (X11; Linux x86_64)'
];
const DEFAULT_FIGHTER_IMAGE = '/assets/images/fighter_default.png';
const DEFAULT_EVENT_POSTER = '/assets/images/ufc_logo.jpg';

/** Helper: Sleep/delay for a given number of milliseconds. */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Helper: Fetch HTML content from a URL and return a Cheerio root. */
async function fetchHTML(url: string, retries: number = 3): Promise<cheerio.Root> {
    while (retries > 0) {
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] },
                timeout: 10000
            });
            return cheerio.load(response.data);
        } catch (err: any) {
            console.warn(`⚠️ Error fetching ${url}: ${err.message}`);
            retries--;
            await sleep(1000);
        }
    }
    throw new Error(`Failed to fetch HTML after multiple attempts: ${url}`);
}

/** Helper: Transliterate Cyrillic and slugify a string to URL-friendly format. */
function slugify(str: string): string {
    const map: Record<string, string> = {
        'а': 'a',  'б': 'b',  'в': 'v',  'г': 'g',  'д': 'd', 'е': 'e',  'ё': 'yo',
        'ж': 'zh', 'з': 'z',  'и': 'i',  'й': 'y',  'к': 'k', 'л': 'l',  'м': 'm',
        'н': 'n',  'о': 'o',  'п': 'p',  'р': 'r',  'с': 's',  'т': 't', 'у': 'u',
        'ф': 'f',  'х': 'kh','ц': 'ts','ч': 'ch','ш': 'sh','щ': 'sch','ы': 'y',
        'э': 'e',  'ю': 'yu','я': 'ya','ь': '','ъ': '','і': 'i','ї': 'yi','є': 'e','ґ': 'g'
    };
    let result = str.toLowerCase();
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');  // remove diacritics
    result = result.replace(/[\u0400-\u04FF]/g, char => map[char] || '');  // transliterate Cyrillic
    result = result.replace(/[^a-z0-9]+/g, '-');  // replace non-alphanumeric with hyphen
    result = result.replace(/^-+|-+$/g, '');      // trim leading/trailing hyphens
    return result;
}

/** Helper: Convert date string "DD.MM.YY" or "DD.MM.YYYY" to "YYYY-MM-DD". */
function convertDate(dateStr: string): string | null {
    const parts = dateStr.trim().split('.');
    if (parts.length !== 3) return null;
    let [d, m, y] = parts;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
}

/** Helper: Extract date from a string (e.g., title) if in format DD.MM.YY or DD.MM.YYYY. */
function extractDateFromTitle(title: string): string | null {
    const match = title.match(/(\d{2})[./](\d{2})[./](\d{2,4})/);
    if (!match) return null;
    let [_, dd, mm, yy] = match;
    if (yy.length === 2) yy = `20${yy}`;
    return `${yy}-${mm}-${dd}`;
}

/** Fetch all event page links by iterating through the events listing pages. */
async function getEventLinks(): Promise<string[]> {
    const links = new Set<string>();
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const pageUrl = (page === 1) ? EVENTS_URL : `${EVENTS_URL}page-${page}.html`;
        try {
            const $ = await fetchHTML(pageUrl);
            let foundOnPage = 0;
            $('a.events-list__link, a.events__link').each((_, el) => {
                const href = $(el).attr('href');
                if (href && href.includes('/ru/events/')) {
                    const fullUrl = href.startsWith('http') ? href : (BASE_URL + href);
                    links.add(fullUrl);
                    foundOnPage++;
                }
            });
            // If fewer than 10 events found on this page, assume it's the last page.
            if (foundOnPage < 10) {
                hasMore = false;
            } else {
                page++;
                await sleep(DELAY_MS_EVENTS);
            }
        } catch (err: any) {
            console.warn(`⚠️ Error loading events page ${pageUrl}: ${err.message}`);
            hasMore = false;
        }
    }
    return Array.from(links);
}

/** Parse the fight card section (main or prelims) from an event page by section ID. */
function parseFightCardSection($: cheerio.Root, sectionId: string): EventFight[] {
    const card: EventFight[] = [];
    $(`#${sectionId} li.other-fights-list__item`).each((_, li) => {
        const fighterNames = $(li).find('.name').map((_, nameEl) => $(nameEl).text().trim()).get();
        const clockElem = $(li).find('.center-block__clock');
        const fightTime = clockElem.contents().first().text().trim();
        let rounds = clockElem.find('span').text().trim();
        if (rounds) {
            // Normalize "•", "×", etc. to 'x' for rounds format (e.g., "3x5" rounds).
            rounds = rounds.replace('•', '').trim().replace(/[х×]/g, 'x');
        }
        const weight = $(li).find('.weight').text().trim();
        // Note: Preview link (if any) is not used in JSON output.
        if (fighterNames.length === 2) {
            card.push({
                fighter1: fighterNames[0],
                fighter2: fighterNames[1],
                weight: weight,
                time: fightTime,
                rounds: rounds
            });
        }
    });
    return card;
}

/** Parse an individual event page to extract event details and fight card. */
async function parseEvent(url: string): Promise<{ slug: string, data: EventData }> {
    const $ = await fetchHTML(url);
    // Event title (name)
    let title = $('h1.tournament-top__title, .events__title').first().text().trim();
    if (!title) {
        title = $('title').text().trim();
    }
    // Event date, time, location
    const rawDate = $('.tournament-date .date').text().trim();
    const date = convertDate(rawDate) || extractDateFromTitle(title);
    const time = $('.tournament-date .time').text().trim();
    const place = $('.tournament-date .address').text().trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid event date for "${title}" (raw="${rawDate}")`);
    }
    // Parse main and prelim fight cards
    const mainCard = parseFightCardSection($, 'content1');
    const prelimCard = parseFightCardSection($, 'content2');
    // Slugify the event title for a clean slug
    const eventSlug = slugify(title);
    // Prepare event data object
    const eventData: EventData = {
        id: 0,  // will be set later
        slug: eventSlug,
        name: title,
        date: date,
        time: time,
        location: place,
        poster: DEFAULT_EVENT_POSTER,
        main_card: mainCard,
        prelims_card: prelimCard
    };
    return { slug: eventSlug, data: eventData };
}

/** Parse distribution of win/loss methods from a fighter page. */
function parseWinLossMethods($: cheerio.Root) {
    const winMethods: { method: string; count: number; percentage: string; }[] = [];
    const loseMethods: { method: string; count: number; percentage: string; }[] = [];
    // Wins breakdown
    $('ul.wins-list li').each((_, el) => {
        const methodText = $(el).find('p.wins-list__text').text().trim();
        const detailText = $(el).find('p.wins-list__text--down').text().trim();
        if (!methodText) return;
        let count = 0, percentage = '';
        const countMatch = detailText.match(/(\d+)/);
        if (countMatch) count = parseInt(countMatch[1], 10) || 0;
        const pctMatch = detailText.match(/\((\d+%)/);
        if (pctMatch) {
            percentage = pctMatch[1] + ')';
        } else {
            const plainPct = detailText.match(/(\d+)%/);
            if (plainPct) percentage = plainPct[1] + '%';
        }
        winMethods.push({ method: methodText, count, percentage });
    });
    // If any "Unknown methods of win: X" is listed
    const unknownWinsText = $('p.inner-wrapper__footer')
        .filter((_, e) => $(e).text().includes('Неизвестных видов побед'))
        .text();
    if (unknownWinsText) {
        const m = unknownWinsText.match(/(\d+)/);
        if (m) {
            const count = parseInt(m[1], 10) || 0;
            winMethods.push({ method: 'Unknown', count, percentage: '' });
        }
    }
    // Losses breakdown
    $('ul.lose-list li').each((_, el) => {
        const methodText = $(el).find('p.lose-list__text').text().trim();
        const detailText = $(el).find('p.lose-list__text--down').text().trim();
        if (!methodText) return;
        let count = 0, percentage = '';
        const countMatch = detailText.match(/(\d+)/);
        if (countMatch) count = parseInt(countMatch[1], 10) || 0;
        const pctMatch = detailText.match(/\((\d+%)/);
        if (pctMatch) {
            percentage = pctMatch[1] + ')';
        } else {
            const plainPct = detailText.match(/(\d+)%/);
            if (plainPct) percentage = plainPct[1] + '%';
        }
        loseMethods.push({ method: methodText, count, percentage });
    });
    return { winMethods, loseMethods };
}

/** Parse basic fighter info from a fighter profile page (name, record, attributes). */
function parseFighterData($: cheerio.Root) {
    const info: Partial<FighterData> = {};
    // Name (h1 is main name, h2.name-english might contain English name on Russian site)
    const h1 = $('h1#name').text().trim();
    const h2en = $('h2.name-english').text().trim();
    let name_en = '', name_ru = '';
    if (h2en && h2en.toLowerCase() !== h1.toLowerCase()) {
        name_en = h2en;
        name_ru = h1;
    } else {
        name_en = h1 || 'Unnamed';
        name_ru = '';
    }
    info.name = name_en;
    // Record (W-L-D)
    const { wins, losses, draws } = parseRecord($);
    info.wins = wins;
    info.losses = losses;
    info.draws = draws;
    info.record = `${wins}-${losses}-${draws}`;
    // Physical attributes and other details from the data list
    $('ul.data-list > li').each((_, el) => {
        const raw = $(el).text().trim().toLowerCase();
        const valueText = $(el).find('.value').text().trim();
        if (raw.includes('возраст') || raw.includes('age')) {
            const ageNum = parseInt(valueText, 10);
            if (ageNum) info.age = ageNum;
        } else if (raw.includes('рост') || raw.includes('height')) {
            const ht = parseInt(valueText, 10);
            if (ht) info.height = ht;
        } else if (raw.includes('вес') || raw.includes('weight')) {
            const wt = parseInt(valueText, 10);
            if (wt) info.weight = wt;
        } else if (raw.includes('размах рук') || raw.includes('reach')) {
            const rc = parseInt(valueText, 10);
            if (rc) info.reach = rc;
        } else if (raw.includes('размах ног') || raw.includes('leg reach')) {
            const lrc = parseInt(valueText, 10);
            if (lrc) info.leg_reach = lrc;
        } else if (raw.includes('место рождения') || raw.includes('born')) {
            const place = $(el).find('.new-style').text().trim();
            if (place) {
                const parts = place.split(',').map(s => s.trim());
                info.country = (parts.length > 1) ? parts[parts.length - 1] : place;
            }
        } else if (raw.includes('стойка') || raw.includes('stance')) {
            if (valueText) info.stance = valueText;
        } else if (raw.includes('стиль') || raw.includes('style')) {
            if (valueText) info.style = valueText;
        }
    });
    // Ranking/Division info (if any)
    const ratingText = $('.rating-fighter-box').text().trim();
    if (ratingText) {
        info.rank = ratingText;
        // Extract division name from rank text if present (e.g., "#5 Lightweight" or "Чемпион легкий вес")
        const divMatch = ratingText.match(/(Strawweight|Flyweight|Bantamweight|Featherweight|Lightweight|Welterweight|Middleweight|Light Heavyweight|Heavyweight)/i);
        if (divMatch) {
            info.division = divMatch[0];
        }
        if (/champion/i.test(ratingText) || /чемпион/i.test(ratingText)) {
            // If text indicates champion, set rank explicitly and ensure division captured
            info.rank = 'Champion';
        }
    }
    return info;
}

/** Parse the W-L-D record from fighter profile (top stats). */
function parseRecord($: cheerio.Root) {
    const winText = $('span.win').first().text().trim();
    const loseText = $('span.lose').first().text().trim();
    const drawText = $('span.draw').first().text().trim();
    let wins = 0, losses = 0, draws = 0;
    if (winText && loseText && drawText) {
        const w = parseInt(winText, 10), l = parseInt(loseText, 10), d = parseInt(drawText, 10);
        wins = w || 0;
        losses = l || 0;
        draws = d || 0;
    } else {
        // Fallback: sometimes record might be part of text like "10-2-0"
        const text = $('div.fighter-info__record, .fighter-record').text();
        const match = text.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/);
        if (match) {
            wins = parseInt(match[1], 10) || 0;
            losses = parseInt(match[2], 10) || 0;
            draws = parseInt(match[3], 10) || 0;
        }
    }
    return { wins, losses, draws };
}

/** Parse main statistics (fight time, finishes, etc.) from fighter profile. */
function parseMainStats($: cheerio.Root) {
    const stats: any = {};
    $('li.stats-list__item').each((_, el) => {
        const leftNum = $(el).find('.left-block .number').text().trim();
        const leftText = $(el).find('.left-block .text').text().trim().toLowerCase();
        const rightNum = $(el).find('.right-block .number').text().trim();
        const rightText = $(el).find('.right-block .text').text().trim().toLowerCase();
        if (leftText.includes('среднее время боя') && !leftText.includes('ufc')) {
            stats.fight_time_avg = leftNum;
        } else if (leftText.includes('среднее время боя') && leftText.includes('ufc')) {
            stats.fight_time_ufc_avg = leftNum;
        } else if (leftText.includes('тейкдаунов за бой')) {
            stats.takedown_average = parseFloat(leftNum) || 0;
        } else if (leftText.includes('сабмишенов') && leftText.includes('15')) {
            stats.submission_attempts_per_15_min = parseFloat(leftNum) || 0;
        } else if (leftText.includes('защита от тейкдаун')) {
            stats.takedown_defense = leftNum;
        }
        if (rightText.includes('финиши в первом раунде')) {
            stats.first_round_finishes = parseInt(rightNum, 10) || 0;
        }
    });
    return stats;
}

/** Parse additional UFC stats (strikes, accuracy, defense, etc.) into stats object. */
function parseUFCStats($: cheerio.Root, stats: any) {
    $('li.stats-list__item').each((_, el) => {
        const leftBlock = $(el).find('.left-block');
        const rightBlock = $(el).find('.right-block');
        const leftNum = leftBlock.find('.number').text().trim();
        const leftTxt = leftBlock.find('.text').text().trim().toLowerCase();
        const rightNum = rightBlock.find('.number').text().trim();
        const rightTxt = rightBlock.find('.text').text().trim().toLowerCase();
        const parseNumberOrPercent = (str: string) => {
            const x = parseFloat(str.replace('%', ''));
            if (!isNaN(x)) {
                return str.includes('%') ? str : x;
            }
            return str;
        };
        // Takedown average and accuracy
        if (leftTxt.includes('тейкдаунов за бой')) {
            stats.takedown_average = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('тейкдаунов за бой')) {
            stats.takedown_average = parseNumberOrPercent(rightNum);
        }
        if (leftTxt.includes('точность') && leftTxt.includes('тейкдаун')) {
            stats.takedown_accuracy = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('точность') && rightTxt.includes('тейкдаун')) {
            stats.takedown_accuracy = parseNumberOrPercent(rightNum);
        }
        if (leftTxt.includes('защита от тейкдаун')) {
            stats.takedown_defense = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('защита от тейкдаун')) {
            stats.takedown_defense = parseNumberOrPercent(rightNum);
        }
        // Striking stats
        if (leftTxt.includes('акцентированных ударов в минуту') && leftTxt.includes('наносит')) {
            stats.significant_strikes_per_minute = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('акцентированных ударов в минуту') && rightTxt.includes('наносит')) {
            stats.significant_strikes_per_minute = parseNumberOrPercent(rightNum);
        }
        if (leftTxt.includes('акцентированных ударов в минуту') && leftTxt.includes('пропускает')) {
            stats.significant_strikes_absorbed = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('акцентированных ударов в минуту') && rightTxt.includes('пропускает')) {
            stats.significant_strikes_absorbed = parseNumberOrPercent(rightNum);
        }
        if (leftTxt.includes('точность акцентированных ударов')) {
            stats.significant_strike_accuracy = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('точность акцентированных ударов')) {
            stats.significant_strike_accuracy = parseNumberOrPercent(rightNum);
        }
        if (leftTxt.includes('защита от акцентированного удара')) {
            stats.significant_strike_defense = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('защита от акцентированного удара')) {
            stats.significant_strike_defense = parseNumberOrPercent(rightNum);
        }
        // Submission attempts per 15 minutes
        if (leftTxt.includes('сабмишенов') && leftTxt.includes('15')) {
            stats.submission_attempts_per_15_min = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('сабмишенов') && rightTxt.includes('15')) {
            stats.submission_attempts_per_15_min = parseNumberOrPercent(rightNum);
        }
    });
}

/** Parse fight history for a fighter, handling both table and list formats on the site. */
function parseFightsHistory($: cheerio.Root): FighterFight[] {
    const history: FighterFight[] = [];
    // Format 1: table (for older fights or on desktop site)
    const $table = $('table.fight-history, table.fighter-history').first();
    if ($table.length) {
        const headers: string[] = [];
        $table.find('thead th').each((_, th) => {
            headers.push($(th).text().trim().toLowerCase());
        });
        $table.find('tbody tr').each((_, tr) => {
            const rowData: any = {};
            const tds = $(tr).find('td');
            if (headers.length && tds.length === headers.length) {
                tds.each((i, td) => {
                    rowData[headers[i]] = $(td).text().trim();
                });
            } else {
                // Fallback by position if headers not clearly matched
                rowData.date = tds.eq(0).text().trim();
                rowData.opponent = tds.eq(1).text().trim();
                rowData.result = tds.eq(2).text().trim();
                rowData.method = tds.eq(3).text().trim();
                rowData.tournament = tds.eq(4).text().trim();
                rowData.round = tds.eq(5).text().trim();
                rowData.time = tds.eq(6).text().trim();
            }
            history.push(rowData);
        });
    }
    // Format 2: list (for recent fights on modern site)
    if (!history.length && $('ul.history-list').length) {
        $('ul.history-list li.history-list__item').each((_, li) => {
            const $li = $(li);
            const fight: any = {};
            if ($li.hasClass('history-list__item--win')) {
                fight.result = 'win';
            } else if ($li.hasClass('history-list__item--lose')) {
                fight.result = 'lose';
            } else if ($li.hasClass('history-list__item--draw')) {
                fight.result = 'draw';
            } else if ($li.hasClass('history-list__item--cancelled')) {
                fight.result = '';
                fight.status = 'отменён';
            }
            const dateLine = $li.find('.top-wrapper .date').text().trim();
            const dateMatch = dateLine.match(/(\d{2}\.\d{2}\.\d{4})/);
            if (dateMatch) fight.date = dateMatch[1];
            if (/отмен[её]н/i.test(dateLine)) {
                fight.status = 'отменён';
            }
            // Opponent name and optional link
            const oppEl = $li.find('.top-wrapper .info-block .pair a').first();
            if (oppEl.length) {
                fight.opponent = oppEl.text().trim();
                const oppHref = oppEl.attr('href');
                if (oppHref) {
                    fight.opponent_link = BASE_URL + oppHref;
                }
            } else {
                const rawOpp = $li.find('.top-wrapper .info-block .pair').text().trim();
                const oppMatch = rawOpp.match(/vs\s+(.*)/i);
                if (oppMatch) fight.opponent = oppMatch[1].trim();
            }
            // Basic fight details
            fight.round = $li.find('.top-wrapper .round span').text().trim() || '';
            fight.time = $li.find('.top-wrapper .time span').text().trim() || '';
            fight.method = $li.find('.top-wrapper .method span').text().trim() || '';
            // Additional info from bottom details (event, division, importance)
            $li.find('.bottom-wrapper .info-list__item').each((_, item) => {
                const topText = $(item).find('.top-text').text().trim().toLowerCase();
                const bottomText = $(item).find('.bottom-text').text().trim();
                if (topText.includes('турнир') || topText.includes('event')) {
                    fight.tournament = bottomText;
                } else if (topText.includes('формат боя')) {
                    fight.format = bottomText;
                } else if (topText.includes('дивизион')) {
                    fight.division = bottomText;
                } else if (topText.includes('важность боя')) {
                    fight.importance = bottomText;
                } else if (topText.includes('вес бойца')) {
                    fight.fighter_weight = bottomText;
                } else if (topText.includes('способ победы')) {
                    fight.method = bottomText;
                }
            });
            history.push(fight);
        });
    }
    return history;
}

/** Parse an individual fighter page and return structured fighter data. */
async function parseFighter(url: string): Promise<{ slug: string, data: FighterData }> {
    const $ = await fetchHTML(url);
    const basicInfo = parseFighterData($);
    const { winMethods, loseMethods } = parseWinLossMethods($);
    if (winMethods.length) basicInfo.win_methods = winMethods;
    if (loseMethods.length) basicInfo.loss_methods = loseMethods;
    const mainStats = parseMainStats($);
    Object.assign(basicInfo, mainStats);
    parseUFCStats($, basicInfo);
    const fightsHistoryRaw = parseFightsHistory($);
    // Build FighterData object from parsed pieces
    const fighterData: FighterData = {
        id: 0,  // to be set later
        slug: '',
        name: basicInfo.name || 'Unnamed',
        nickname: undefined,
        country: basicInfo.country,
        division: basicInfo.division,
        age: basicInfo.age,
        height: basicInfo.height,
        weight: basicInfo.weight,
        reach: basicInfo.reach,
        leg_reach: basicInfo.leg_reach,
        stance: basicInfo.stance,
        style: basicInfo.style,
        wins: basicInfo.wins || 0,
        losses: basicInfo.losses || 0,
        draws: basicInfo.draws || 0,
        record: basicInfo.record || `${basicInfo.wins}-${basicInfo.losses}-${basicInfo.draws}`,
        rank: basicInfo.rank,
        image: DEFAULT_FIGHTER_IMAGE,
        bio: undefined,
        win_methods: basicInfo.win_methods,
        loss_methods: basicInfo.loss_methods,
        fight_time_avg: basicInfo.fight_time_avg,
        fight_time_ufc_avg: basicInfo.fight_time_ufc_avg,
        first_round_finishes: basicInfo.first_round_finishes,
        significant_strikes_per_minute: basicInfo.significant_strikes_per_minute,
        significant_strike_accuracy: basicInfo.significant_strike_accuracy,
        significant_strikes_absorbed: basicInfo.significant_strikes_absorbed,
        significant_strike_defense: basicInfo.significant_strike_defense,
        takedown_average: basicInfo.takedown_average,
        takedown_accuracy: basicInfo.takedown_accuracy,
        takedown_defense: basicInfo.takedown_defense,
        submission_attempts_per_15_min: basicInfo.submission_attempts_per_15_min,
        fights_history: []
    };
    // Derive slug from URL or fighter name
    const urlMatch = url.match(/\/fighters\/([^/]+)\.html/i);
    fighterData.slug = urlMatch ? urlMatch[1] : slugify(fighterData.name);
    // Nickname (if any) might be indicated on page
    const nicknameText = $('h3.nickname, .fighter-info__nickname').text().trim();
    if (nicknameText) {
        fighterData.nickname = nicknameText.replace(/["']/g, "");
    }
    // Biography text (if present on page)
    const bioParagraphs: string[] = [];
    $('.fighter-info__bio, .fighter-profile__text p').each((_, p) => {
        const text = $(p).text().trim();
        if (text) bioParagraphs.push(text);
    });
    if (bioParagraphs.length) {
        fighterData.bio = bioParagraphs.join('\n\n');
    }
    // Convert raw fight history entries to FighterFight objects
    if (fightsHistoryRaw.length) {
        fighterData.fights_history = fightsHistoryRaw.map(item => {
            const fight: FighterFight = {
                date: item.date || '',
                event: item.tournament || '',
                opponent: item.opponent || '',
                result: item.result || '',
                method: item.method || '',
                round: item.round || '',
                time: item.time || ''
            };
            if (item.status) fight.status = item.status;
            if (item.division) fight.division = item.division;
            if (item.importance) fight.importance = item.importance;
            return fight;
        });
    }
    return { slug: fighterData.slug, data: fighterData };
}

/** Gather all fighter profile links by crawling the fighters list pages. */
async function getAllFighterLinks(): Promise<string[]> {
    const links = new Set<string>();
    for (let i = 1; i <= MAX_FIGHTER_PAGES; i++) {
        const pageUrl = (i === 1) ? FIGHTERS_LIST_URL : `${FIGHTERS_LIST_URL}page-${i}.html`;
        let $: cheerio.Root;
        try {
            $ = await fetchHTML(pageUrl);
        } catch (err: any) {
            console.warn(`Skipping fighter list page ${i}: ${err.message}`);
            break;
        }
        const beforeCount = links.size;
        $('a[href^="/ru/fighters/"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.endsWith('.html') && !href.includes('page-')) {
                links.add(BASE_URL + href);
            }
        });
        if (links.size === beforeCount) {
            // No new links found on this page -> end of list
            break;
        }
        await sleep(DELAY_MS_FIGHTERS);
    }
    return Array.from(links);
}

/** Main function to run the scraper in CLI mode, with support for flags. */
async function main() {
    const args = process.argv.slice(2);
    const runFighters = args.includes('--fighters');
    const runEvents = args.includes('--tournaments');
    const doBoth = !runFighters && !runEvents;  // if no specific flag, do both

    // Load existing data (if any) to preserve past events and for linking
    let existingEvents: EventData[] = [];
    let existingFighters: FighterData[] = [];
    try {
        const eventsJson = fs.readFileSync(path.join('assets/mock', 'events.json'), 'utf8');
        existingEvents = JSON.parse(eventsJson);
    } catch {}
    try {
        const fightersJson = fs.readFileSync(path.join('assets/mock', 'fighters.json'), 'utf8');
        existingFighters = JSON.parse(fightersJson);
    } catch {}

    const existingEventMap = new Map<string, EventData>();
    existingEvents.forEach(ev => existingEventMap.set(ev.slug, ev));
    const existingFighterMap = new Map<string, FighterData>();
    existingFighters.forEach(ft => existingFighterMap.set(ft.slug, ft));

    const newEvents: EventData[] = [];
    const newFighters: FighterData[] = [];

    // Scrape events if requested (or if doing both)
    if (runEvents || doBoth) {
        console.log('📅 Fetching event list...');
        const eventLinks = await getEventLinks();
        console.log(`🔗 Found ${eventLinks.length} events.`);
        let count = 0;
        for (const link of eventLinks) {
            count++;
            try {
                const { slug, data } = await parseEvent(link);
                const eventDate = new Date(data.date + 'T00:00:00');
                const today = new Date();
                const isFuture = eventDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
                if (!isFuture && existingEventMap.has(slug)) {
                    // Skip re-parsing past events that already exist
                    continue;
                }
                // Preserve existing ID if this event was already in the data
                if (existingEventMap.has(slug)) {
                    data.id = existingEventMap.get(slug)!.id;
                } else {
                    const maxId = existingEvents.reduce((max, ev) => Math.max(max, ev.id || 0), 0);
                    data.id = maxId + 1;
                }
                newEvents.push(data);
                console.log(`[+] Parsed event: ${data.name}`);
            } catch (err: any) {
                console.warn(`❌ Error parsing event (${link}): ${err.message}`);
            }
            await sleep(DELAY_MS_EVENTS);
        }
        // Retain all past events from existing data
        const pastEvents = existingEvents.filter(ev => {
            const evDate = new Date(ev.date + 'T00:00:00');
            return evDate < new Date(new Date().toISOString().split('T')[0]);
        });
        pastEvents.forEach(ev => newEvents.push(ev));
        // Sort combined events chronologically by date
        newEvents.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Scrape fighters if requested (or doing both)
    if (runFighters || doBoth) {
        console.log('🥊 Fetching fighter list...');
        const fighterLinks = await getAllFighterLinks();
        console.log(`🔗 Found ${fighterLinks.length} fighters.`);
        let idx = 0;
        for (const url of fighterLinks) {
            idx++;
            try {
                const { slug, data } = await parseFighter(url);
                if (existingFighterMap.has(slug)) {
                    data.id = existingFighterMap.get(slug)!.id;
                } else {
                    const maxFId = existingFighters.reduce((max, ft) => Math.max(max, ft.id || 0), 0);
                    data.id = maxFId + 1;
                }
                newFighters.push(data);
            } catch (err: any) {
                console.warn(`❌ Error parsing fighter (${url}): ${err instanceof Error ? err.message : err}`);
            }
            if (idx % 50 === 0) {
                console.log(`[${idx}/${fighterLinks.length}] ...`);
            }
            await sleep(DELAY_MS_FIGHTERS);
        }
        console.log(`✅ Finished parsing fighters. Total parsed: ${newFighters.length}`);
    }

    // Prepare final arrays and linking
    const finalEvents: EventData[] = (runEvents || doBoth) ? newEvents : existingEvents;
    const finalFighters: FighterData[] = (runFighters || doBoth) ? newFighters : existingFighters;

    // Create quick lookup maps and Fuse fuzzy search for names to slugs
    const fighterNameToSlug = new Map<string, string>();
    finalFighters.forEach(f => fighterNameToSlug.set(f.name, f.slug));
    const eventNameToSlug = new Map<string, string>();
    finalEvents.forEach(ev => eventNameToSlug.set(ev.name, ev.slug));
    const fighterFuse = new Fuse(finalFighters, { keys: ['name', 'nickname'], threshold: 0.3 });
    const eventFuse = new Fuse(finalEvents, { keys: ['name'], threshold: 0.3 });

    // Link fighter slugs in event fight cards
    for (const event of finalEvents) {
        for (const fight of event.main_card) {
            const f1 = fight.fighter1, f2 = fight.fighter2;
            let slug1 = fighterNameToSlug.get(f1);
            let slug2 = fighterNameToSlug.get(f2);
            if (!slug1) {
                const res = fighterFuse.search(f1);
                if (res.length) slug1 = res[0].item.slug;
            }
            if (!slug2) {
                const res = fighterFuse.search(f2);
                if (res.length) slug2 = res[0].item.slug;
            }
            if (slug1) fight.fighter1_slug = slug1;
            if (slug2) fight.fighter2_slug = slug2;
            if (!fight.result) fight.result = 'TBD';  // set default result if not present
        }
        for (const fight of event.prelims_card) {
            const f1 = fight.fighter1, f2 = fight.fighter2;
            let slug1 = fighterNameToSlug.get(f1);
            let slug2 = fighterNameToSlug.get(f2);
            if (!slug1) {
                const res = fighterFuse.search(f1);
                if (res.length) slug1 = res[0].item.slug;
            }
            if (!slug2) {
                const res = fighterFuse.search(f2);
                if (res.length) slug2 = res[0].item.slug;
            }
            if (slug1) fight.fighter1_slug = slug1;
            if (slug2) fight.fighter2_slug = slug2;
            if (!fight.result) fight.result = 'TBD';
        }
    }

    // Link event and opponent slugs in fighters' fight histories
    for (const fighter of finalFighters) {
        fighter.fights_history?.forEach(fight => {
            const evName = fight.event;
            const oppName = fight.opponent;
            if (!fight.event_slug && evName) {
                let evSlug = eventNameToSlug.get(evName);
                if (!evSlug) {
                    const res = eventFuse.search(evName);
                    if (res.length) evSlug = res[0].item.slug;
                }
                if (evSlug) fight.event_slug = evSlug;
            }
            if (!fight.opponent_slug && oppName) {
                let oppSlug = fighterNameToSlug.get(oppName);
                if (!oppSlug) {
                    const res = fighterFuse.search(oppName);
                    if (res.length) oppSlug = res[0].item.slug;
                }
                if (oppSlug) fight.opponent_slug = oppSlug;
            }
        });
    }

    // Update event fight results for past events if we have outcome data from fighters
    for (const event of finalEvents) {
        const evDate = new Date(event.date + 'T00:00:00');
        if (evDate < new Date()) {
            for (const fight of [...event.main_card, ...event.prelims_card]) {
                if (fight.result && fight.result !== 'TBD') continue;
                const f1Slug = fight.fighter1_slug;
                const f2Slug = fight.fighter2_slug;
                if (f1Slug && f2Slug) {
                    const fighterData = finalFighters.find(f => f.slug === f1Slug);
                    const historyFight = fighterData?.fights_history?.find(h =>
                        h.event_slug === event.slug && (h.opponent_slug === f2Slug || h.opponent === fight.fighter2)
                    );
                    if (historyFight) {
                        if (historyFight.status === 'отменён') {
                            fight.result = 'Отменён';
                        } else if (historyFight.result === 'win') {
                            // fighter1 was the winner
                            const methodShort = summarizeMethod(historyFight.method, historyFight.round);
                            fight.result = `${fight.fighter1} победа (${methodShort})`;
                        } else if (historyFight.result === 'lose') {
                            // fighter1 lost, so fighter2 was the winner
                            const methodShort = summarizeMethod(historyFight.method, historyFight.round);
                            fight.result = `${fight.fighter2} победа (${methodShort})`;
                        } else if (historyFight.result === 'draw') {
                            fight.result = 'Ничья';
                        }
                    }
                }
            }
        }
    }

    /** Helper: produce a short method string (e.g. "KO, R2", "UD") from full method and round. */
    function summarizeMethod(method: string, round: string): string {
        let shortMethod = method;
        const lower = method.toLowerCase();
        if (lower.includes('решением') || lower.includes('decision')) {
            if (lower.includes('единоглас') || lower.includes('unanimous')) shortMethod = 'UD';
            else if (lower.includes('раздель') || lower.includes('split')) shortMethod = 'SD';
            else if (lower.includes('большин') || lower.includes('majority')) shortMethod = 'MD';
            else shortMethod = 'Decision';
            // For decisions, omit round info (it went full distance)
            return shortMethod;
        }
        if (lower.includes('нокаут') || lower.includes('ko') || lower.includes('tko')) {
            shortMethod = 'KO';
        } else if (lower.includes('сабмиш') || lower.includes('submission')) {
            shortMethod = 'SUB';
        } else if (lower.includes('дисквал') || lower.includes('dq')) {
            shortMethod = 'DQ';
        } else if (lower.includes('ничья') || lower.includes('draw')) {
            return 'Draw';
        } else if (lower.includes('отмен') || lower.includes('cancel')) {
            return 'Отменён';
        }
        const roundStr = round ? `R${round}` : '';
        return roundStr ? `${shortMethod}, ${roundStr}` : shortMethod;
    }

    // Save results to JSON files in assets/mock
    if (runEvents || doBoth) {
        fs.writeFileSync(path.join('assets/mock', 'events.json'), JSON.stringify(finalEvents, null, 2), 'utf8');
        console.log(`💾 Saved events.json with ${finalEvents.length} events`);
    }
    if (runFighters || doBoth) {
        fs.writeFileSync(path.join('assets/mock', 'fighters.json'), JSON.stringify(finalFighters, null, 2), 'utf8');
        console.log(`💾 Saved fighters.json with ${finalFighters.length} fighters`);
    }
}

// Execute main when running this script directly
if (require.main === module) {
    main().catch(err => {
        console.error('Error in scraper:', err);
        process.exit(1);
    });
}
