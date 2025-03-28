// src/main.cjs

const fs = require('fs');
const path = require('path');
const { insertBatch, closeDB } = require('./db.cjs');

const { getEventLinks, parseEvent } = require('./events.cjs');
const { getAllFighterLinks, parseFighter } = require('./fighters.cjs');
const {
    linkFightersInEvents,
    linkEventsAndOpponentsInHistory,
    updateEventFightResults
} = require('./linking.cjs');

const {
    DELAY_MS_EVENTS,
    DELAY_MS_FIGHTERS
} = require('./config.cjs');

const { sleep } = require('./utils.cjs');

/**
 * Сохраняет массив данных пакетами в указанную коллекцию MongoDB
 * @param {Array} items
 * @param {string} collectionName
 */
async function saveInBatches(items, collectionName) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        await insertBatch(collectionName, chunk);
    }
}

/**
 * Главная функция, которая занимается сбором данных:
 * 1) Загружает (или создает) списки tournaments/fighters
 * 2) Парсит новые/обновляет существующие
 * 3) Связывает сущности
 * 4) Сохраняет в MongoDB пакетами
 * @param {string[]} args - аргументы командной строки
 */
async function main(args = []) {
    const runFighters = args.includes('--fighters');
    const runEvents = args.includes('--tournaments');
    const doBoth = !runFighters && !runEvents;

    let existingEvents = [];
    let existingFighters = [];

    try {
        const eventsJson = fs.readFileSync(path.join('assets/mock', 'events.json'), 'utf8');
        existingEvents = JSON.parse(eventsJson);
    } catch {}
    try {
        const fightersJson = fs.readFileSync(path.join('assets/mock', 'fighters.json'), 'utf8');
        existingFighters = JSON.parse(fightersJson);
    } catch {}

    const existingEventMap = new Map();
    existingEvents.forEach(ev => existingEventMap.set(ev.slug, ev));
    const existingFighterMap = new Map();
    existingFighters.forEach(ft => existingFighterMap.set(ft.slug, ft));

    const newEvents = [];
    const newFighters = [];

    // ----------- Парсинг ТУРНИРОВ -----------
    if (runEvents || doBoth) {
        console.log('📅 Fetching event list...');
        const eventLinks = await getEventLinks();
        console.log(`🔗 Found ${eventLinks.length} events.`);

        for (const link of eventLinks) {
            try {
                const parsed = await parseEvent(link);
                if (!parsed) continue;

                const { slug, data } = parsed;
                const eventDate = new Date(data.date + 'T00:00:00');
                const today = new Date();
                const isFuture = eventDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate());

                if (!isFuture && existingEventMap.has(slug)) continue;

                if (existingEventMap.has(slug)) {
                    data.id = existingEventMap.get(slug).id;
                } else {
                    const maxId = existingEvents.reduce((max, ev) => Math.max(max, ev.id || 0), 0);
                    data.id = maxId + 1;
                }
                newEvents.push(data);
                console.log(`[+] Parsed event: ${data.name}`);
            } catch (err) {
                console.warn(`❌ Error parsing event (${link}): ${err.message}`);
            }
            await sleep(DELAY_MS_EVENTS);
        }

        // Добавляем старые прошедшие турниры
        const pastEvents = existingEvents.filter(ev => {
            const evDate = new Date(ev.date + 'T00:00:00');
            return evDate < new Date();
        });
        pastEvents.forEach(ev => newEvents.push(ev));

        // Сортируем по дате
        newEvents.sort((a, b) => a.date.localeCompare(b.date));
    }

    // ----------- Парсинг БОЙЦОВ -----------
    if (runFighters || doBoth) {
        console.log('🥊 Fetching fighter list...');
        const fighterLinks = await getAllFighterLinks();
        console.log(`🔗 Found ${fighterLinks.length} fighters.`);
        let idx = 0;

        for (const url of fighterLinks) {
            idx++;
            try {
                const parsed = await parseFighter(url);
                if (!parsed) continue;

                const { slug, data } = parsed;
                if (existingFighterMap.has(slug)) {
                    data.id = existingFighterMap.get(slug).id;
                } else {
                    const maxId = existingFighters.reduce((max, ft) => Math.max(max, ft.id || 0), 0);
                    data.id = maxId + 1;
                }
                newFighters.push(data);
            } catch (err) {
                console.warn(`❌ Error parsing fighter (${url}): ${err instanceof Error ? err.message : err}`);
            }
            if (idx % 50 === 0) {
                console.log(`[${idx}/${fighterLinks.length}] ...`);
            }
            await sleep(DELAY_MS_FIGHTERS);
        }
        console.log(`✅ Finished parsing fighters. Total parsed: ${newFighters.length}`);
    }

    // ----------- Связки -----------
    const finalEvents = (runEvents || doBoth) ? newEvents : existingEvents;
    const finalFighters = (runFighters || doBoth) ? newFighters : existingFighters;

    linkFightersInEvents(finalFighters, finalEvents);
    linkEventsAndOpponentsInHistory(finalFighters, finalEvents);
    updateEventFightResults(finalFighters, finalEvents);

    // ----------- Сохранение в MongoDB -----------
    if (runEvents || doBoth) {
        const validEvents = newEvents.filter(Boolean);
        await saveInBatches(validEvents, 'events');
    }

    if (runFighters || doBoth) {
        const validFighters = newFighters.filter(Boolean);
        await saveInBatches(validFighters, 'fighters');
    }

    await closeDB();
}

module.exports = {
    main
};
