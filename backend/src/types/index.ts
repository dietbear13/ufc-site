// src/types/index.ts
export interface Fight {
    fighter1: string
    fighter2: string
    fighter1_slug?: string
    fighter2_slug?: string
    weight: string
    time: string
    rounds: string
    result: string
}

export interface Event {
    id: number
    slug: string
    name: string
    date: string
    time: string
    location: string
    poster: string
    main_card: Fight[]
    prelims_card: Fight[]
}

export interface Fighter {
    id: number
    slug: string
    name: string
    record: string
    image: string
    nickname: string
    country: string
    weight: string
    height: string
    reach: string
    style: string
    fights_history?: any[]
}

export interface News {
    id: number
    title: string
    slug: string
    content: string
    date: string
    image?: string
}
