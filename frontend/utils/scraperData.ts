/**
 * ufc-scraper.js
 *
 * Объединённый и отрефакторенный скрипт для парсинга турниров (events) и бойцов (fighters)
 * UFC с сайта GIDStats, сохраняя данные в формате .md (YAML frontmatter) для Jekyll.
 *
 * На базе исходных events-scraper.js и fighters-scraper.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const matter = require('gray-matter');
const crypto = require('crypto');

// ==== Класс-обёртка, объединяющий всю логику парсинга ====
class UFCGidStatsScraper {
    constructor() {
        // Пути для турниров и бойцов
        this.EVENTS_DIR = path.join(__dirname, '../_events');
        this.FIGHTERS_DIR = path.join(__dirname, '../_fighters');

        // Основные настройки
        this.BASE_URL = 'https://gidstats.com';
        this.EVENTS_URL = `${this.BASE_URL}/ru/events/`;
        this.FIGHTERS_LIST_URL = `${this.BASE_URL}/ru/fighters/`;

        // Сколько страниц бойцов обходим
        this.MAX_FIGHTER_PAGES = 500;
        // Задержки между запросами
        this.DELAY_MS_EVENTS = 1000;
        this.DELAY_MS_FIGHTERS = 500;

        // Список User-Agent для случайного выбора (во избежание бана)
        this.USER_AGENTS = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Mozilla/5.0 (X11; Linux x86_64)',
        ];
    }

    // === Вспомогательные методы ===

    // Задержка
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Внутри класса UFCGidStatsScraper
    async runFightersOnly() {
        // Создаём папку _fighters, если её нет
        if (!fs.existsSync(this.FIGHTERS_DIR)) {
            fs.mkdirSync(this.FIGHTERS_DIR, { recursive: true });
        }

        try {
            // Парсим бойцов
            console.log('🥊 Сбор ссылок на бойцов...');
            const fighterLinks = await this.getAllFighterLinks();
            console.log(`🔗 Найдено бойцов: ${fighterLinks.length}`);

            let idx = 0;
            for (const url of fighterLinks) {
                idx++;
                console.log(`\n[${idx}/${fighterLinks.length}] Парсим бойца: ${url}`);
                try {
                    const fighterData = await this.parseFighter(url);
                    this.saveFighterToFile(fighterData);
                } catch (err) {
                    console.warn(`❌ Ошибка при парсинге бойца (${url}): ${err.message}`);
                }
                await this.sleep(this.DELAY_MS_FIGHTERS);
            }
            console.log('✅ Парсинг бойцов завершён.');
        } catch (err) {
            console.error('Ошибка в процессе парсинга бойцов:', err);
        }
    }


    // Генерация MD5-хэша для проверки изменений
    hashContent(data) {
        return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    }

    // Запрос с несколькими попытками
    async fetchHTML(url, retries = 3) {
        while (retries > 0) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)]
                    },
                    timeout: 10000
                });
                return cheerio.load(response.data);
            } catch (err) {
                console.warn(`⚠️ Ошибка при загрузке ${url}: ${err.message}`);
                retries--;
                await this.sleep(1000);
            }
        }
        throw new Error(`Не удалось загрузить HTML после нескольких попыток: ${url}`);
    }

    // Транслитерация + slugify (логика из events-scraper.js)
    slugify(str) {
        const map = {
            'а': 'a',  'б': 'b',  'в': 'v',  'г': 'g',  'д': 'd',
            'е': 'e',  'ё': 'yo', 'ж': 'zh','з': 'z',  'и': 'i',
            'й': 'y',  'к': 'k',  'л': 'l',  'м': 'm',  'н': 'n',
            'о': 'o',  'п': 'p',  'р': 'r',  'с': 's',  'т': 't',
            'у': 'u',  'ф': 'f',  'х': 'kh','ц': 'ts','ч': 'ch',
            'ш': 'sh','щ': 'sch','ы': 'y',  'э': 'e',  'ю': 'yu',
            'я': 'ya','ь': '','ъ': '','і':'i','ї':'yi','є':'e','ґ':'g'
        };
        let result = str.toLowerCase();
        // Убираем возможные диакритики
        result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Транслитерация кириллицы
        result = result.replace(/[\u0400-\u04FF]/g, char => map[char] || '');
        // Заменяем всё, кроме a-z0-9, на дефис
        result = result.replace(/[^a-z0-9]+/g, '-');
        // Убираем ведущие / конечные дефисы
        result = result.replace(/^-+|-+$/g, '');
        return result;
    }

    // Преобразование строки вида "10.12.23" -> "2023-12-10"
    convertDate(dateStr) {
        const parts = dateStr.trim().split('.');
        if (parts.length !== 3) return null;
        let [d, m, y] = parts;
        if (y.length === 2) y = `20${y}`;
        return `${y}-${m}-${d}`;
    }

    // Извлекаем дату из заголовка (если есть формат DD.MM.YY или DD.MM.YYYY)
    extractDateFromTitle(title) {
        const match = title.match(/(\d{2})[./](\d{2})[./](\d{2,4})/);
        if (!match) return null;
        let [_, dd, mm, yy] = match;
        if (yy.length === 2) yy = `20${yy}`;
        return `${yy}-${mm}-${dd}`;
    }

    // === БЛОК: Парсинг турниров (events), логика из events-scraper.js ===

    // Сбор всех ссылок на турниры (с учётом пагинации)
    async getEventLinks() {
        const links = new Set();
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            // На 1-й странице: /ru/events/, на 2-й: page-2.html и т. д.
            const pageUrl = (page === 1)
                ? this.EVENTS_URL
                : `${this.EVENTS_URL}page-${page}.html`;

            try {
                const $ = await this.fetchHTML(pageUrl);
                let found = 0;
                $('a.events-list__link, a.events__link').each((_, el) => {
                    const href = $(el).attr('href');
                    if (href && href.includes('/ru/events/')) {
                        const fullUrl = href.startsWith('http') ? href : (this.BASE_URL + href);
                        links.add(fullUrl);
                        found++;
                    }
                });
                // Если на странице меньше 10 турниров, считаем, что это последняя
                if (found < 10) {
                    hasMore = false;
                } else {
                    page++;
                    await this.sleep(this.DELAY_MS_EVENTS);
                }
            } catch (err) {
                console.warn(`⚠️ Ошибка загрузки страницы турниров: ${pageUrl} – ${err.message}`);
                hasMore = false;
            }
        }
        return Array.from(links);
    }

    // Парсинг раздела fight card (main / prelims)
    parseFightCardSection($, sectionId) {
        const card = [];
        $(`#${sectionId} li.other-fights-list__item`).each((_, li) => {
            const fighterNames = $(li).find('.name').map((_, nameEl) => $(nameEl).text().trim()).get();

            // Извлекаем время боя, кол-во раундов
            const clockElem = $(li).find('.center-block__clock');
            const fightTime = clockElem.contents().first().text().trim();
            let rounds = clockElem.find('span').text().trim();
            if (rounds) {
                // Зачастую бывает "•", "x", "×", заменим на x
                rounds = rounds.replace('•', '').trim().replace(/[х×]/g, 'x');
            }

            // Извлекаем вес/результат
            const weight = $(li).find('.weight').text().trim();
            // Ссылка на прогноз (preview)
            const fightLink = $(li).find('a.other-fights-list__link').attr('href') || '';

            if (fighterNames.length === 2) {
                const fightData = {
                    fighter1: fighterNames[0],
                    fighter2: fighterNames[1],
                    weight: weight,
                    time: fightTime,
                    rounds: rounds
                };
                if (fightLink) {
                    fightData.preview_url = fightLink;
                }
                card.push(fightData);
            }
        });
        return card;
    }

    // Парсинг страницы одного турнира
    async parseEvent(url) {
        const $ = await this.fetchHTML(url);

        // Заголовок
        let title = $('h1.tournament-top__title, .events__title').first().text().trim();
        if (!title) {
            title = $('title').text().trim();
        }
        // Дата
        const rawDate = $('.tournament-date .date').text().trim();
        let date = this.convertDate(rawDate) || this.extractDateFromTitle(title);
        const time = $('.tournament-date .time').text().trim();
        const place = $('.tournament-date .address').text().trim();
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error(`Не найдена корректная дата турнира "${title}" (raw date="${rawDate}")`);
        }

        // Парсим main / prelims
        const mainCard = this.parseFightCardSection($, 'content1');
        const prelimCard = this.parseFightCardSection($, 'content2');

        // SEO-friendly slug
        const eventSlug = this.slugify(title);
        let origEventSlug = url.replace(`${this.BASE_URL}/ru/events/`, '').replace(/\/$/, '');

        // Корректируем preview_url, если нужно убрать домен/ru и т. д.
        [...mainCard, ...prelimCard].forEach(fight => {
            if (!fight.preview_url) return;
            let preview = fight.preview_url;
            preview = preview.replace(/^https?:\/\/[^/]+/, '').replace('/ru', '');
            if (preview.endsWith('.html')) {
                preview = preview.slice(0, -5);
            }
            // Заменяем старый slug на eventSlug
            preview = preview.replace(`/events/${origEventSlug}/`, `/events/${eventSlug}/`);
            // Заменим подчеркивания на дефисы
            preview = preview.replace(/_/g, '-');
            if (!preview.endsWith('/')) preview += '/';
            fight.preview_url = preview;
        });

        // Формируем frontmatter
        const frontmatter = {
            title: title,
            date: date,
            time: time,
            place: place,
            card: {
                main: mainCard,
                prelims: prelimCard
            },
            source_url: `/events/${eventSlug}/`,
            meta: {
                updated: new Date().toISOString()
            }
        };
        return { slug: eventSlug, frontmatter };
    }

    // Сохранение турнира в .md с проверкой хэша
    saveEventToFile(eventData) {
        if (!fs.existsSync(this.EVENTS_DIR)) {
            fs.mkdirSync(this.EVENTS_DIR, { recursive: true });
        }
        const filePath = path.join(this.EVENTS_DIR, `${eventData.slug}.md`);
        const newHash = this.hashContent(eventData.frontmatter);

        if (fs.existsSync(filePath)) {
            const oldData = fs.readFileSync(filePath, 'utf8');
            const oldMatter = matter(oldData);
            const oldHash = oldMatter.data.__hash || '';
            if (oldHash === newHash) {
                console.log(`[✓] Без изменений: ${eventData.slug}`);
                return;
            }
        }
        // Добавляем служебное поле __hash
        const mdContent = matter.stringify('', { ...eventData.frontmatter, __hash: newHash });
        fs.writeFileSync(filePath, mdContent, 'utf8');
        console.log(`[+] Обновлён: ${eventData.slug}`);
    }

    // === БЛОК: Парсинг бойцов, логика из fighters-scraper.js ===

    // Собираем все ссылки на профили бойцов по страницам
    async getAllFighterLinks() {
        const links = new Set();

        for (let i = 1; i <= this.MAX_FIGHTER_PAGES; i++) {
            const pageUrl = (i === 1)
                ? this.FIGHTERS_LIST_URL
                : `${this.FIGHTERS_LIST_URL}page-${i}.html`;

            let $;
            try {
                $ = await this.fetchHTML(pageUrl);
            } catch (err) {
                console.warn(`Пропущена страница бойцов ${i}: ${err.message}`);
                break;
            }

            const beforeCount = links.size;

            // На сайте обычно ссылки вида /ru/fighters/imya_familia.html
            $('a[href^="/ru/fighters/"]').each((_, el) => {
                const href = $(el).attr('href');
                if (href.endsWith('.html') && !href.includes('page-')) {
                    links.add(this.BASE_URL + href);
                }
            });

            // Если ничего нового не найдено — завершим
            if (links.size === beforeCount) {
                break;
            }
            await this.sleep(this.DELAY_MS_FIGHTERS);
        }

        return Array.from(links);
    }

    // Извлечение win/loss/draw
    parseRecord($) {
        const winText = $('span.win').first().text().trim();
        const loseText = $('span.lose').first().text().trim();
        const drawText = $('span.draw').first().text().trim();

        let wins = 0, losses = 0, draws = 0;
        if (winText && loseText && drawText) {
            wins = parseInt(winText, 10) || 0;
            losses = parseInt(loseText, 10) || 0;
            draws = parseInt(drawText, 10) || 0;
        } else {
            // Альтернативно смотреть p.counts
            const raw = $('p.counts').text().trim();
            const match = raw.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/);
            if (match) {
                wins = parseInt(match[1], 10) || 0;
                losses = parseInt(match[2], 10) || 0;
                draws = parseInt(match[3], 10) || 0;
            }
        }
        return { wins, losses, draws };
    }

    // Парсим методы побед/поражений
    parseWinLossMethods($) {
        const winMethods = [];
        const loseMethods = [];

        // Победы
        $('ul.wins-list li').each((_, el) => {
            const methodText = $(el).find('p.wins-list__text').text().trim();
            const detailText = $(el).find('p.wins-list__text--down').text().trim();
            if (!methodText) return;
            let count = 0, percentage = '';

            const countMatch = detailText.match(/(\d+)/);
            if (countMatch) {
                count = parseInt(countMatch[1], 10) || 0;
            }
            const pctMatch = detailText.match(/\((\d+%)/);
            if (pctMatch) {
                percentage = pctMatch[1] + ')';
            } else {
                const plainPct = detailText.match(/(\d+)%/);
                if (plainPct) {
                    percentage = plainPct[1] + '%';
                }
            }
            winMethods.push({ method: methodText, count, percentage });
        });

        // "Неизвестных видов побед: X" — иногда
        const unknownWins = $('p.inner-wrapper__footer')
            .filter((_, e) => $(e).text().includes('Неизвестных видов побед'))
            .text();
        if (unknownWins) {
            const m = unknownWins.match(/(\d+)/);
            if (m) {
                const count = parseInt(m[1], 10) || 0;
                winMethods.push({ method: 'Unknown', count, percentage: '' });
            }
        }

        // Поражения
        $('ul.lose-list li').each((_, el) => {
            const methodText = $(el).find('p.lose-list__text').text().trim();
            const detailText = $(el).find('p.lose-list__text--down').text().trim();
            if (!methodText) return;
            let count = 0, percentage = '';

            const countMatch = detailText.match(/(\d+)/);
            if (countMatch) {
                count = parseInt(countMatch[1], 10) || 0;
            }
            const pctMatch = detailText.match(/\((\d+%)/);
            if (pctMatch) {
                percentage = pctMatch[1] + ')';
            } else {
                const plainPct = detailText.match(/(\d+)%/);
                if (plainPct) {
                    percentage = plainPct[1] + '%';
                }
            }
            loseMethods.push({ method: methodText, count, percentage });
        });

        return { winMethods, loseMethods };
    }

    // Базовая инфа о бойце
    parseFighterData($) {
        const info = {};
        // h1#name — может быть русское или общее имя
        const h1 = $('h1#name').text().trim();
        // Англ. имя
        const h2en = $('h2.name-english').text().trim();

        let name_en = '';
        let name_ru = '';

        if (h2en && h2en.toLowerCase() !== h1.toLowerCase()) {
            name_en = h2en;
            name_ru = h1;
        } else {
            name_en = h1 || 'unnamed';
            name_ru = '';
        }

        info.title = name_en;
        if (name_ru) {
            info.name_ru = name_ru;
        }

        // Рекорд
        const { wins, losses, draws } = this.parseRecord($);
        info.wins = wins;
        info.losses = losses;
        info.draws = draws;

        // Читаем ul.data-list, ищем возраст, рост, вес и т. д.
        $('ul.data-list > li').each((_, el) => {
            const raw = $(el).text().trim().toLowerCase();

            if (raw.includes('возраст')) {
                const val = $(el).find('.value').text().trim();
                const age = parseInt(val, 10);
                if (age) info.age = age;
            } else if (raw.includes('рост')) {
                const val = $(el).find('.value').text().trim();
                const ht = parseInt(val, 10);
                if (ht) info.height = ht;
            } else if (raw.includes('вес')) {
                const val = $(el).find('.value').text().trim();
                const wt = parseInt(val, 10);
                if (wt) info.weight = wt;
            } else if (raw.includes('размах рук')) {
                const val = $(el).find('.value').text().trim();
                const rc = parseInt(val, 10);
                if (rc) info.reach = rc;
            } else if (raw.includes('размах ног')) {
                const val = $(el).find('.value').text().trim();
                const lrc = parseInt(val, 10);
                if (lrc) info.leg_reach = lrc;
            } else if (raw.includes('место рождения')) {
                const place = $(el).find('.new-style').text().trim();
                if (place) {
                    const parts = place.split(',').map(s => s.trim());
                    if (parts.length > 1) {
                        info.country = parts[parts.length - 1];
                    } else {
                        info.country = place;
                    }
                }
            } else if (raw.includes('стойка')) {
                const stanceVal = $(el).find('.value').text().trim();
                if (stanceVal) info.stance = stanceVal;
            } else if (raw.includes('стиль')) {
                const styleVal = $(el).find('.value').text().trim();
                if (styleVal) info.style = styleVal;
            }
        });

        // Рейтинг (если есть)
        const rating = $('.rating-fighter-box').text().trim();
        if (rating) {
            info.rank = rating;
        }

        return info;
    }

    // Обобщённые статистики (время боя, first-round finishes и т. д.)
    parseMainStats($) {
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

    // Парсим UFC-статистику (удары в минуту, защита, точность и т. п.)
    parseUFCStats($, stats) {
        $('li.stats-list__item').each((_, el) => {
            const leftBlock = $(el).find('.left-block');
            const rightBlock = $(el).find('.right-block');
            const leftNum = leftBlock.find('.number').text().trim();
            const leftTxt = leftBlock.find('.text').text().trim().toLowerCase();
            const rightNum = rightBlock.find('.number').text().trim();
            const rightTxt = rightBlock.find('.text').text().trim().toLowerCase();

            const parseNumberOrPercent = str => {
                const x = parseFloat(str.replace('%', ''));
                if (!isNaN(x)) {
                    if (str.includes('%')) return str; // "64%"
                    return x; // 0.5, 2.3 и т.д.
                }
                return str;
            };

            // Здесь по ключевым словам
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
            if (leftTxt.includes('сабмишенов') && leftTxt.includes('15')) {
                stats.submission_attempts_per_15_min = parseNumberOrPercent(leftNum);
            }
            if (rightTxt.includes('сабмишенов') && rightTxt.includes('15')) {
                stats.submission_attempts_per_15_min = parseNumberOrPercent(rightNum);
            }
        });
    }

    // История боёв
    parseFightsHistory($) {
        const history = [];

        // 1) Таблица
        const $table = $('table.fight-history, table.fighter-history').first();
        if ($table.length) {
            const headers = [];
            $table.find('thead th').each((_, th) => {
                headers.push($(th).text().trim().toLowerCase());
            });
            $table.find('tbody tr').each((_, tr) => {
                const row = {};
                const tds = $(tr).find('td');
                if (headers.length && tds.length === headers.length) {
                    tds.each((i, td) => {
                        row[headers[i]] = $(td).text().trim();
                    });
                } else {
                    // Смотрим порядок
                    row.date = tds.eq(0).text().trim();
                    row.opponent = tds.eq(1).text().trim();
                    row.result = tds.eq(2).text().trim();
                    row.method = tds.eq(3).text().trim();
                    row.tournament = tds.eq(4).text().trim();
                    row.round = tds.eq(5).text().trim();
                    row.time = tds.eq(6).text().trim();
                }
                history.push(row);
            });
        }

        // 2) ul.history-list
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

                // Оппонент
                const oppEl = $li.find('.top-wrapper .info-block .pair a').first();
                if (oppEl.length) {
                    fight.opponent = oppEl.text().trim();
                    const oppHref = oppEl.attr('href');
                    if (oppHref) {
                        fight.opponent_link = this.BASE_URL + oppHref;
                    }
                } else {
                    const rawOpp = $li.find('.top-wrapper .info-block .pair').text().trim();
                    const oppMatch = rawOpp.match(/vs\s+(.*)/i);
                    if (oppMatch) {
                        fight.opponent = oppMatch[1].trim();
                    }
                }

                fight.round = $li.find('.top-wrapper .round span').text().trim() || '';
                fight.time = $li.find('.top-wrapper .time span').text().trim() || '';
                fight.method = $li.find('.top-wrapper .method span').text().trim() || '';

                $li.find('.bottom-wrapper .info-list__item').each((_, item) => {
                    const topText = $(item).find('.top-text').text().trim().toLowerCase();
                    const bottomText = $(item).find('.bottom-text').text().trim();
                    if (topText.includes('турнир')) {
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

    // Парсим одного бойца
    async parseFighter(url) {
        const $ = await this.fetchHTML(url);

        // 1) Основные поля
        const fighterData = this.parseFighterData($);
        // 2) Методы побед и поражений
        const { winMethods, loseMethods } = this.parseWinLossMethods($);
        if (winMethods.length) {
            fighterData.win_methods = winMethods;
        }
        if (loseMethods.length) {
            fighterData.loss_methods = loseMethods;
        }
        // 3) Доп. статистика
        const mainStats = this.parseMainStats($);
        Object.assign(fighterData, mainStats);
        this.parseUFCStats($, fighterData);
        // 4) История боёв
        const fightsHistory = this.parseFightsHistory($);
        if (fightsHistory.length) {
            fighterData.fights_history = fightsHistory;
        }
        // 5) Поля source_url + meta
        fighterData.source_url = url;
        fighterData.meta = { updated: new Date().toISOString() };

        // Получаем slug
        let slug = '';
        const urlMatch = url.match(/\/fighters\/([^/]+)\.html/i);
        if (urlMatch) {
            slug = urlMatch[1]; // по образцу fighters-scraper.js
        } else {
            slug = this.slugify(fighterData.title);
        }

        // permalink, layout
        fighterData.permalink = `/fighters/${slug}/`;
        fighterData.layout = 'fighter';

        return { slug, frontmatter: fighterData };
    }

    // Сохранение бойца в .md
    saveFighterToFile(fighter) {
        if (!fs.existsSync(this.FIGHTERS_DIR)) {
            fs.mkdirSync(this.FIGHTERS_DIR, { recursive: true });
        }
        const filePath = path.join(this.FIGHTERS_DIR, `${fighter.slug}.md`);
        const newHash = this.hashContent(fighter.frontmatter);

        if (fs.existsSync(filePath)) {
            const oldData = fs.readFileSync(filePath, 'utf8');
            const oldMatter = matter(oldData);
            const oldHash = oldMatter.data.__hash || '';
            if (oldHash === newHash) {
                console.log(`[✓] Без изменений: ${fighter.slug}`);
                return;
            }
        }
        const mdContent = matter.stringify('', { ...fighter.frontmatter, __hash: newHash });
        fs.writeFileSync(filePath, mdContent, 'utf8');
        console.log(`[+] Обновлён: ${fighter.slug}`);
    }

    // === Основной метод-обёртка для запуска (парсинг турниров, затем бойцов) ===
    async run() {
        // Создадим папки, если не существуют
        if (!fs.existsSync(this.EVENTS_DIR)) {
            fs.mkdirSync(this.EVENTS_DIR, { recursive: true });
        }
        if (!fs.existsSync(this.FIGHTERS_DIR)) {
            fs.mkdirSync(this.FIGHTERS_DIR, { recursive: true });
        }

        try {
            // 1) Парсим турниры
            console.log('📅 Сбор ссылок на турниры...');
            const eventLinks = await this.getEventLinks();
            console.log(`🔗 Найдено турниров: ${eventLinks.length}`);

            let count = 0;
            for (const link of eventLinks) {
                count++;
                console.log(`\n[${count}/${eventLinks.length}] Парсим турнир: ${link}`);
                try {
                    const eventObj = await this.parseEvent(link);
                    this.saveEventToFile(eventObj);
                } catch (err) {
                    console.warn(`❌ Ошибка при парсинге турнира (${link}): ${err.message}`);
                }
                await this.sleep(this.DELAY_MS_EVENTS);
            }
            console.log('✅ Парсинг турниров завершён.\n');

            // 2) Парсим бойцов
            console.log('🥊 Сбор ссылок на бойцов...');
            const fighterLinks = await this.getAllFighterLinks();
            console.log(`🔗 Найдено бойцов: ${fighterLinks.length}`);

            let idx = 0;
            for (const url of fighterLinks) {
                idx++;
                console.log(`\n[${idx}/${fighterLinks.length}] Парсим бойца: ${url}`);
                try {
                    const fighterData = await this.parseFighter(url);
                    this.saveFighterToFile(fighterData);
                } catch (err) {
                    console.warn(`❌ Ошибка при парсинге бойца (${url}): ${err.message}`);
                }
                await this.sleep(this.DELAY_MS_FIGHTERS);
            }
            console.log('✅ Парсинг бойцов завершён.');
        } catch (err) {
            console.error('Ошибка в процессе парсинга:', err);
        }
    }
}

// === Запуск ===
(async () => {
    const scraper = new UFCGidStatsScraper();
    await scraper.runFightersOnly();
})();
