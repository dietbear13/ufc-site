import { useHead } from '#app'

export function useSeoSchemaBuilder(type: 'fighter' | 'event', data: any) {
    const baseUrl = 'https://mma-world.com' // заменить на прод-домен
    const siteName = 'MMA World'

    const schema: any[] = []

    if (type === 'fighter') {
        schema.push({
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
                url: 'https://www.ufc.com/'
            }
        })
    }

    if (type === 'event') {
        schema.push({
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: data.name,
            startDate: data.date,
            eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            location: {
                '@type': 'Place',
                name: data.location,
                address: data.location
            },
            image: `${baseUrl}${data.poster}`,
            url: `${baseUrl}/events/${data.slug}`,
            description: `Турнир UFC: ${data.name}, который пройдет ${data.date} в ${data.location}`,
            organizer: {
                '@type': 'Organization',
                name: 'Ultimate Fighting Championship',
                url: 'https://www.ufc.com'
            },
            performer: data.main_card?.flatMap(fight => [
                { '@type': 'Person', name: fight.fighter1 },
                { '@type': 'Person', name: fight.fighter2 }
            ])
        })
    }

    useHead({
        script: schema.map((s) => ({
            type: 'application/ld+json',
            children: JSON.stringify(s)
        }))
    })
}
