const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const DB_NAME = 'ufc-data';

let client;

async function connectDB() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    return client.db(DB_NAME);
}

async function insertBatch(collectionName, docs) {
    if (!docs.length) return;
    const db = await connectDB();
    const collection = db.collection(collectionName);
    await collection.insertMany(docs);
    console.log(`✅ Вставлено ${docs.length} в коллекцию ${collectionName}`);
}

async function closeDB() {
    if (client) await client.close();
}

module.exports = {
    insertBatch,
    closeDB,
};
