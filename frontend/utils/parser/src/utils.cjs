// src/utils.cjs

const axios = require('axios');
const cheerio = require('cheerio');
const { USER_AGENTS } = require('./config.cjs');

/**
 * Вспомогательная функция: Sleep/delay на заданное количество миллисекунд.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Вспомогательная функция: загружает HTML по URL с помощью axios и возвращает Cheerio root.
 * @param {string} url
 * @param {number} [retries=3]
 * @returns {Promise<CheerioStatic>} - объект Cheerio
 */
async function fetchHTML(url, retries = 3) {
    while (retries > 0) {
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)] },
                timeout: 10000
            });
            return cheerio.load(response.data);
        } catch (err) {
            console.warn(`⚠️ Error fetching ${url}: ${err.message}`);
            retries--;
            await sleep(1000);
        }
    }
    throw new Error(`Failed to fetch HTML after multiple attempts: ${url}`);
}

/**
 * Вспомогательная функция: Транслитерирует кириллицу в латиницу и приводит к URL-friendly формату (slug).
 * @param {string} str
 * @returns {string}
 */
function slugify(str) {
    const map = {
        'а': 'a','б': 'b','в': 'v','г': 'g','д': 'd','е': 'e','ё': 'yo',
        'ж': 'zh','з': 'z','и': 'i','й': 'y','к': 'k','л': 'l','м': 'm',
        'н': 'n','о': 'o','п': 'p','р': 'r','с': 's','т': 't','у': 'u',
        'ф': 'f','х': 'kh','ц': 'ts','ч': 'ch','ш': 'sh','щ': 'sch','ы': 'y',
        'э': 'e','ю': 'yu','я': 'ya','ь': '','ъ': '','і': 'i','ї': 'yi','є': 'e','ґ': 'g'
    };
    let result = str.toLowerCase();
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');  // remove diacritics
    result = result.replace(/[\u0400-\u04FF]/g, char => map[char] || '');
    result = result.replace(/[^a-z0-9]+/g, '-');
    result = result.replace(/^-+|-+$/g, '');
    return result;
}

/**
 * Преобразует дату "DD.MM.YY" или "DD.MM.YYYY" в "YYYY-MM-DD".
 * @param {string} dateStr
 * @returns {string | null}
 */
function convertDate(dateStr) {
    const parts = dateStr.trim().split('.');
    if (parts.length !== 3) return null;
    let [d, m, y] = parts;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
}

/**
 * Выбирает дату из строки (например, "title 12.05.2023") если найдена в формате DD.MM.YY или DD.MM.YYYY.
 * @param {string} title
 * @returns {string | null}
 */
function extractDateFromTitle(title) {
    const match = title.match(/(\d{2})[./](\d{2})[./](\d{2,4})/);
    if (!match) return null;
    let [_, dd, mm, yy] = match;
    if (yy.length === 2) yy = `20${yy}`;
    return `${yy}-${mm}-${dd}`;
}

module.exports = {
    sleep,
    fetchHTML,
    slugify,
    convertDate,
    extractDateFromTitle
};
