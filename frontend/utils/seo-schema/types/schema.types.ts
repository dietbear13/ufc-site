export type SchemaType = 'fighter' | 'event' | 'breadcrumbs';

export interface FighterData {
    name: string;
    nickname?: string;
    image?: string;
    country?: string;
    height?: number;
    weight?: number;
    slug: string;
}

export interface EventData {
    name: string;
    date: string;
    location: string;
    poster?: string;
    slug: string;
    main_card?: { fighter1: string; fighter2: string }[];
}

export interface BreadcrumbItem {
    name: string;
    link: string;
}
