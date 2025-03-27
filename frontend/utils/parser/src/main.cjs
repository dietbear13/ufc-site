// src/main.cjs

const fs = require('fs');
const path = require('path');

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
 * Главная функция, которая занимается сбором данных:
 * 1) Загружает (или создает) списки tournaments/fighters
 * 2) Парсит новые/обновляет существующие
 * 3) Связывает сущности
 * 4) Сохраняет в JSON
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
        let count = 0;

        for (const link of eventLinks) {
            count++;
            try {
                const { slug, data } = await parseEvent(link);
                const eventDate = new Date(data.date + 'T00:00:00');
                const today = new Date();
                const isFuture = eventDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate());

                if (!isFuture && existingEventMap.has(slug)) {
                    // Уже в базе и прошедшее
                    continue;
                }
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

        // Оставляем все прошедшие из старых
        const pastEvents = existingEvents.filter(ev => {
            const evDate = new Date(ev.date + 'T00:00:00');
            return evDate < new Date(new Date().toISOString().split('T')[0]);
        });
        pastEvents.forEach(ev => newEvents.push(ev));
        // Сортируем
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
                const { slug, data } = await parseFighter(url);
                if (existingFighterMap.has(slug)) {
                    data.id = existingFighterMap.get(slug).id;
                } else {
                    const maxFId = existingFighters.reduce((max, ft) => Math.max(max, ft.id || 0), 0);
                    data.id = maxFId + 1;
                }
                newFighters.push(data);
            } catch (err) {
                console.warn(`❌ Error parsing fighter (${url}): ${
                    err instanceof Error ? err.message : err
                }`);
            }
            if (idx % 50 === 0) {
                console.log(`[${idx}/${fighterLinks.length}] ...`);
            }
            await sleep(DELAY_MS_FIGHTERS);
        }
        console.log(`✅ Finished parsing fighters. Total parsed: ${newFighters.length}`);
    }

    // ----------- Сводим данные вместе -----------
    const finalEvents = (runEvents || doBoth) ? newEvents : existingEvents;
    const finalFighters = (runFighters || doBoth) ? newFighters : existingFighters;

    // ----------- Связки -----------
    // 1) Привязываем слаги бойцов к карточкам турниров
    linkFightersInEvents(finalFighters, finalEvents);

    // 2) Привязываем слаги турниров и оппонентов в истории боёв
    linkEventsAndOpponentsInHistory(finalFighters, finalEvents);

    // 3) Обновляем результаты боёв в турнирах на основе истории бойцов
    updateEventFightResults(finalFighters, finalEvents);

    // ----------- Сохранение -----------
    if (runEvents || doBoth) {
        fs.writeFileSync(
            path.join('assets/mock', 'events.json'),
            JSON.stringify(finalEvents, null, 2),
            'utf8'
        );
        console.log(`💾 Saved events.json with ${finalEvents.length} events`);
    }
    if (runFighters || doBoth) {
        fs.writeFileSync(
            path.join('assets/mock', 'fighters.json'),
            JSON.stringify(finalFighters, null, 2),
            'utf8'
        );
        console.log(`💾 Saved fighters.json with ${finalFighters.length} fighters`);
    }
}

module.exports = {
    main
};
