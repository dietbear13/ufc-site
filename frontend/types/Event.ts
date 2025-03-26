// types/Event.ts
export interface Event {
    title: string;
    slug: string;
    date: string;    // ISO string или формат YYYY-MM-DD
    place?: string;
    fights?: Array<{
        fighter1: string; fighter1Slug: string;
        fighter2: string; fighter2Slug: string;
        result?: string;
    }>;
    fighters?: string[];   // список slug всех участников
    descriptionHtml?: string; // описание/превью турнира в HTML
}
