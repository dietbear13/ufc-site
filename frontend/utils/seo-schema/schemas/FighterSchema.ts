import type { FighterData } from '../types/schema.types';

export function buildFighterSchema(data: FighterData, baseUrl: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: data.name,
        alternateName: data.nickname,
        image: data.image ? `${baseUrl}${data.image}` : undefined,
        nationality: data.country,
        height: data.height ? `${data.height} cm` : undefined,
        weight: data.weight ? `${data.weight} kg` : undefined,
        knowsAbout: ['MMA', 'UFC', 'Mixed Martial Arts'],
        description: `${data.name} — профессиональный боец UFC.`,
        mainEntityOfPage: `${baseUrl}/fighters/${data.slug}`,
        url: `${baseUrl}/fighters/${data.slug}`,
        jobTitle: 'Professional MMA Fighter',
        memberOf: {
            '@type': 'SportsOrganization',
            name: 'UFC',
            url: 'https://www.ufc.com/',
        },
    };
}
