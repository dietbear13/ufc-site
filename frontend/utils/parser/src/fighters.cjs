// src/fighters.cjs

const fs = require('fs');
const path = require('path');
const { BASE_URL, FIGHTERS_LIST_URL, DEFAULT_FIGHTER_IMAGE, MAX_FIGHTER_PAGES, DELAY_MS_FIGHTERS } = require('./config.cjs');
const { sleep, fetchHTML, slugify } = require('./utils.cjs');

/**
 * Парсинг распределения методов побед и поражений на странице бойца
 * @param {*} $
 * @returns {{ winMethods: any[], loseMethods: any[] }}
 */
function parseWinLossMethods($) {
    const winMethods = [];
    const loseMethods = [];

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

    // "Неизвестных видов побед" — если есть
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

/**
 * Извлекаем рекорд W-L-D со страницы бойца (верхняя статистика).
 * @param {*} $
 * @returns {{ wins: number, losses: number, draws: number }}
 */
function parseRecord($) {
    const winText = $('span.win').first().text().trim();
    const loseText = $('span.lose').first().text().trim();
    const drawText = $('span.draw').first().text().trim();
    let wins = 0, losses = 0, draws = 0;

    if (winText && loseText && drawText) {
        const w = parseInt(winText, 10);
        const l = parseInt(loseText, 10);
        const d = parseInt(drawText, 10);
        wins = w || 0;
        losses = l || 0;
        draws = d || 0;
    } else {
        // Fallback — иногда в виде "10-2-0"
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

/**
 * Парсим информацию о бойце: имя, рекорд, рост, вес и т.п.
 * @param {*} $
 * @returns {object} - Частичный объект с данными о бойце
 */
function parseFighterData($) {
    const info = {};
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

    const { wins, losses, draws } = parseRecord($);
    info.wins = wins;
    info.losses = losses;
    info.draws = draws;
    info.record = `${wins}-${losses}-${draws}`;

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

    // Рейтинг, дивизион
    const ratingText = $('.rating-fighter-box').text().trim();
    if (ratingText) {
        info.rank = ratingText;
        const divMatch = ratingText.match(/(Strawweight|Flyweight|Bantamweight|Featherweight|Lightweight|Welterweight|Middleweight|Light Heavyweight|Heavyweight)/i);
        if (divMatch) {
            info.division = divMatch[0];
        }
        if (/champion/i.test(ratingText) || /чемпион/i.test(ratingText)) {
            info.rank = 'Champion';
        }
    }
    return info;
}

/**
 * Парсим основные статистики бойца (среднее время боя, сабмишены и т.п.).
 * @param {*} $
 * @returns {object}
 */
function parseMainStats($) {
    const stats = {};
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

/**
 * Добавляем некоторые дополнительные UFC-статистики (точность, защита, ударная активность и т.п.).
 * @param {*} $
 * @param {object} stats - объект, куда добавляем поля
 */
function parseUFCStats($, stats) {
    $('li.stats-list__item').each((_, el) => {
        const leftBlock = $(el).find('.left-block');
        const rightBlock = $(el).find('.right-block');
        const leftNum = leftBlock.find('.number').text().trim();
        const leftTxt = leftBlock.find('.text').text().trim().toLowerCase();
        const rightNum = rightBlock.find('.number').text().trim();
        const rightTxt = rightBlock.find('.text').text().trim().toLowerCase();

        const parseNumberOrPercent = (str) => {
            const x = parseFloat(str.replace('%', ''));
            if (!isNaN(x)) {
                return str.includes('%') ? str : x;
            }
            return str;
        };

        // Takedown
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

        // Striking
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

        // Submission attempts per 15
        if (leftTxt.includes('сабмишенов') && leftTxt.includes('15')) {
            stats.submission_attempts_per_15_min = parseNumberOrPercent(leftNum);
        }
        if (rightTxt.includes('сабмишенов') && rightTxt.includes('15')) {
            stats.submission_attempts_per_15_min = parseNumberOrPercent(rightNum);
        }
    });
}

/**
 * Парсит историю боёв (таблица или список) на странице бойца.
 * @param {*} $
 * @returns {Array}
 */
function parseFightsHistory($) {
    const history = [];
    const $table = $('table.fight-history, table.fighter-history').first();

    if ($table.length) {
        const headers = [];
        $table.find('thead th').each((_, th) => {
            headers.push($(th).text().trim().toLowerCase());
        });
        $table.find('tbody tr').each((_, tr) => {
            const rowData = {};
            const tds = $(tr).find('td');
            if (headers.length && tds.length === headers.length) {
                tds.each((i, td) => {
                    rowData[headers[i]] = $(td).text().trim();
                });
            } else {
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

    if (!history.length && $('ul.history-list').length) {
        $('ul.history-list li.history-list__item').each((_, li) => {
            const $li = $(li);
            const fight = {};
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
            fight.round = $li.find('.top-wrapper .round span').text().trim() || '';
            fight.time = $li.find('.top-wrapper .time span').text().trim() || '';
            fight.method = $li.find('.top-wrapper .method span').text().trim() || '';

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

/**
 * Парсим страницу бойца и возвращаем структурированные данные.
 * @param {string} url
 * @returns {Promise<{slug: string, data: any}>}
 */
async function parseFighter(url) {
    const $ = await fetchHTML(url);
    const basicInfo = parseFighterData($);
    const { winMethods, loseMethods } = parseWinLossMethods($);

    if (winMethods.length) basicInfo.win_methods = winMethods;
    if (loseMethods.length) basicInfo.loss_methods = loseMethods;

    const mainStats = parseMainStats($);
    Object.assign(basicInfo, mainStats);
    parseUFCStats($, basicInfo);

    const fightsHistoryRaw = parseFightsHistory($);

    const fighterData = {
        id: 0,
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

    const urlMatch = url.match(/\/fighters\/([^/]+)\.html/i);
    fighterData.slug = urlMatch ? urlMatch[1] : slugify(fighterData.name);

    const nicknameText = $('h3.nickname, .fighter-info__nickname').text().trim();
    if (nicknameText) {
        fighterData.nickname = nicknameText.replace(/["']/g, "");
    }

    const bioParagraphs = [];
    $('.fighter-info__bio, .fighter-profile__text p').each((_, p) => {
        const text = $(p).text().trim();
        if (text) bioParagraphs.push(text);
    });
    if (bioParagraphs.length) {
        fighterData.bio = bioParagraphs.join('\n\n');
    }

    if (fightsHistoryRaw.length) {
        fighterData.fights_history = fightsHistoryRaw.map(item => {
            const fight = {
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

/**
 * Собираем все ссылки на профили бойцов итеративным подходом:
 * 1) Загружаем первую страницу (базовый URL),
 * 2) Находим номер "последней" страницы из блока <a> "Последняя",
 * 3) Начинаем цикл со 2-й страницы и идём до lastPageNumber,
 *    формируя URL вида /ru/fighters/page-{i}.html
 *
 * Никакой логики "если нет ссылки 'следующая', заканчиваем" — мы
 * просто проходим от 2 до lastPageNumber.
 */
async function getAllFighterLinks() {
    const links = new Set();
    let lastPageNumber = 0;

    console.log(`Парсинг первой страницы: ${FIGHTERS_LIST_URL}`);
    let $;
    try {
        $ = await fetchHTML(FIGHTERS_LIST_URL);
    } catch (err) {
        console.warn(`Ошибка загрузки первой страницы: ${err.message}`);
        return Array.from(links);
    }

    // Собираем ссылки с первой страницы
    let foundOnFirstPage = 0;
    $('a[href^="/ru/fighters/"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href.endsWith('.html') && !href.includes('page-')) {
            links.add(BASE_URL + href);
            foundOnFirstPage++;
        }
    });
    console.log(`Найдено ссылок на первой странице: ${foundOnFirstPage}`);

    // Извлекаем ссылку "Последняя" из блока пагинации
    const lastLink = $('div.pages a')
        .filter((_, el) => $(el).text().trim().toLowerCase() === 'последняя')
        .attr('href');

    if (lastLink) {
        const match = lastLink.match(/page-(\d+)\.html/);
        if (match) {
            lastPageNumber = parseInt(match[1], 10);
        }
    }
    if (!lastPageNumber) {
        console.warn('Не удалось определить номер последней страницы — используем MAX_FIGHTER_PAGES');
        lastPageNumber = MAX_FIGHTER_PAGES;
    }
    console.log(`Номер последней страницы: ${lastPageNumber}`);

    // Основной цикл: от 2-й до последней страницы
    for (let i = 2; i <= lastPageNumber; i++) {
        const pageUrl = `${FIGHTERS_LIST_URL}page-${i}.html`;
        console.log(`Парсинг страницы: ${pageUrl}`);

        try {
            $ = await fetchHTML(pageUrl);
        } catch (err) {
            console.warn(`Ошибка загрузки страницы ${i}: ${err.message}`);
            continue;
        }

        // Сохраняем размер Set до добавления ссылок
        const beforeCount = links.size;

        let foundOnThisPage = 0;
        $('a[href^="/ru/fighters/"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href.endsWith('.html') && !href.includes('page-')) {
                links.add(BASE_URL + href);
                foundOnThisPage++;
            }
        });
        console.log(`Найдено ссылок на странице ${i}: ${foundOnThisPage}`);

        // Проверка: если на текущей странице не добавилось новых ссылок, завершаем цикл
        if (links.size === beforeCount) {
            console.log(`Нет прироста ссылок на странице ${i}, завершаем обход.`);
            break;
        }
        await sleep(DELAY_MS_FIGHTERS);
    }

    return Array.from(links);
}

module.exports = {
    parseWinLossMethods,
    parseRecord,
    parseFighterData,
    parseMainStats,
    parseUFCStats,
    parseFightsHistory,
    parseFighter,
    getAllFighterLinks
};
