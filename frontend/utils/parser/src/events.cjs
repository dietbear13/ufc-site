// src/events.cjs

const {
    BASE_URL,
    EVENTS_URL,
    DEFAULT_EVENT_POSTER,
    DELAY_MS_EVENTS
} = require('./config.cjs');
const {
    sleep,
    fetchHTML,
    slugify,
    convertDate,
    extractDateFromTitle
} = require('./utils.cjs');

/**
 * Получаем все ссылки на страницы турниров, итерируясь по страницам списка.
 * @returns {Promise<string[]>}
 */
async function getEventLinks() {
    const links = new Set();
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
            if (foundOnPage < 10) {
                hasMore = false;
            } else {
                page++;
                await sleep(DELAY_MS_EVENTS);
            }
        } catch (err) {
            console.warn(`⚠️ Error loading events page ${pageUrl}: ${err.message}`);
            hasMore = false;
        }
    }
    return Array.from(links);
}

/**
 * Разбирает одну секцию боя (main/prelims) по ID.
 * @param {*} $
 * @param {string} sectionId
 * @returns {Array} - Массив боёв
 */
function parseFightCardSection($, sectionId) {
    const card = [];
    $(`#${sectionId} li.other-fights-list__item`).each((_, li) => {
        const fighterNames = $(li).find('.name')
            .map((_, nameEl) => $(nameEl).text().trim()).get();
        const clockElem = $(li).find('.center-block__clock');
        const fightTime = clockElem.contents().first().text().trim();
        let rounds = clockElem.find('span').text().trim();
        if (rounds) {
            rounds = rounds.replace('•', '').trim().replace(/[х×]/g, 'x');
        }
        const weight = $(li).find('.weight').text().trim();

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

/**
 * Парсит отдельную страницу турнира и извлекает подробную информацию.
 * @param {string} url
 * @returns {Promise<{slug: string, data: any}>}
 */
async function parseEvent(url) {
    const $ = await fetchHTML(url);
    let title = $('h1.tournament-top__title, .events__title').first().text().trim();
    if (!title) {
        title = $('title').text().trim();
    }
    const rawDate = $('.tournament-date .date').text().trim();
    const date = convertDate(rawDate) || extractDateFromTitle(title);
    const time = $('.tournament-date .time').text().trim();
    const place = $('.tournament-date .address').text().trim();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`Invalid event date for "${title}" (raw="${rawDate}")`);
    }

    const mainCard = parseFightCardSection($, 'content1');
    const prelimCard = parseFightCardSection($, 'content2');

    const eventSlug = slugify(title);

    const eventData = {
        id: 0,
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

module.exports = {
    getEventLinks,
    parseEvent,
    parseFightCardSection
};
