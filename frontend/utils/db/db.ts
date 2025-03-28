import { MongoClient } from 'mongodb'

const uri = 'mongodb://localhost:27017'
const DB_NAME = 'ufc-data'

let client: MongoClient | null = null

async function connect() {
    if (!client) {
        client = new MongoClient(uri)
        await client.connect()
    }
    return client.db(DB_NAME)
}

// --------- EVENTS ---------

export async function fetchAllEvents() {
    const db = await connect()
    const result = await db.collection('events').find().sort({ date: 1 }).toArray()

    return result.map(({ _id, ...rest }) => rest)
}

export async function fetchEventBySlug(slug: string) {
    const db = await connect()
    return db.collection('events').findOne({ slug })
}

// --------- FIGHTERS ---------

export async function fetchAllFighters() {
    const db = await connect()
    return db.collection('fighters').find().sort({ name: 1 }).toArray()
}

export async function fetchFighterBySlug(slug: string) {
    const db = await connect()
    return db.collection('fighters').findOne({ slug })
}

// --------- NEWS (на будущее) ---------

export async function fetchAllNews() {
    const db = await connect()
    return db.collection('news').find().sort({ date: -1 }).toArray()
}
