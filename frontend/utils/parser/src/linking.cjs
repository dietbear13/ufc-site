// src/linking.cjs

const Fuse = require('fuse.js');

/**
 * Привязывает slug бойца к объекту боя в турнирах (main_card/prelims_card).
 * Использует Fuse.js для неточного поиска по имени, если slug не найден напрямую.
 * @param {Array} finalFighters
 * @param {Array} finalEvents
 */
function linkFightersInEvents(finalFighters, finalEvents) {
    // Создаем Map и Fuse для быстрого доступа
    const fighterNameToSlug = new Map();
    finalFighters.forEach(f => fighterNameToSlug.set(f.name, f.slug));
    const fighterFuse = new Fuse(finalFighters, { keys: ['name', 'nickname'], threshold: 0.3 });

    // Проходим по всем турнирам и матчам
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
            if (!fight.result) fight.result = 'TBD';
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
}

/**
 * Связывает slug турнира и оппонента в истории боёв каждого бойца.
 * @param {Array} finalFighters
 * @param {Array} finalEvents
 */
function linkEventsAndOpponentsInHistory(finalFighters, finalEvents) {
    const eventNameToSlug = new Map();
    finalEvents.forEach(ev => eventNameToSlug.set(ev.name, ev.slug));

    const fighterNameToSlug = new Map();
    finalFighters.forEach(f => fighterNameToSlug.set(f.name, f.slug));

    const fighterFuse = new Fuse(finalFighters, { keys: ['name', 'nickname'], threshold: 0.3 });
    const eventFuse = new Fuse(finalEvents, { keys: ['name'], threshold: 0.3 });

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
}

/**
 * Добавляет результат боя в карточку турнира на основе истории бойцов.
 * Если турнир прошел, но в карточках result='TBD', пытаемся найти результат в истории.
 * @param {Array} finalFighters
 * @param {Array} finalEvents
 */
function updateEventFightResults(finalFighters, finalEvents) {

    function summarizeMethod(method, round) {
        let shortMethod = method;
        const lower = method.toLowerCase();
        if (lower.includes('решением') || lower.includes('decision')) {
            if (lower.includes('единоглас') || lower.includes('unanimous')) shortMethod = 'UD';
            else if (lower.includes('раздель') || lower.includes('split')) shortMethod = 'SD';
            else if (lower.includes('большин') || lower.includes('majority')) shortMethod = 'MD';
            else shortMethod = 'Decision';
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

    const now = new Date();
    for (const event of finalEvents) {
        const evDate = new Date(event.date + 'T00:00:00');
        if (evDate < now) {
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
                            const methodShort = summarizeMethod(historyFight.method, historyFight.round);
                            fight.result = `${fight.fighter1} победа (${methodShort})`;
                        } else if (historyFight.result === 'lose') {
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
}

module.exports = {
    linkFightersInEvents,
    linkEventsAndOpponentsInHistory,
    updateEventFightResults
};
