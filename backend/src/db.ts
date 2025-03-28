// src/db.ts
import { MongoClient, Db } from 'mongodb'

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)
let db: Db

export async function connectToDB() {
    if (!db) {
        await client.connect()
        db = client.db('ufc-data')
    }
    return db
}
