// src/config.cjs

/** Configuration constants */
const BASE_URL = 'https://gidstats.com';
const EVENTS_URL = `${BASE_URL}/ru/events/`;
const FIGHTERS_LIST_URL = `${BASE_URL}/ru/fighters/`;
const MAX_FIGHTER_PAGES = 500;
const DELAY_MS_EVENTS = 801;
const DELAY_MS_FIGHTERS = 401;
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (X11; Linux x86_64)'
];
const DEFAULT_FIGHTER_IMAGE = '/assets/images/fighter_default.png';
const DEFAULT_EVENT_POSTER = '/assets/images/ufc_logo.jpg';

module.exports = {
    BASE_URL,
    EVENTS_URL,
    FIGHTERS_LIST_URL,
    MAX_FIGHTER_PAGES,
    DELAY_MS_EVENTS,
    DELAY_MS_FIGHTERS,
    USER_AGENTS,
    DEFAULT_FIGHTER_IMAGE,
    DEFAULT_EVENT_POSTER
};
