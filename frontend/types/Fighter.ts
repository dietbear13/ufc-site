// types/Fighter.ts
export interface Fighter {
    name: string;
    slug: string;
    country: string;
    wins: number;
    losses: number;
    draws: number;
    image?: string;
    rank?: string;
    age?: number;
    height?: number;
    weight?: number;
    reach?: number;
    leg_reach?: number;
    style?: string;
    events?: string[];  // слуги турниров, в которых боец участвовал
    bioHtml?: string;   // биография в HTML (из markdown)
}
