import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;

/** Connects once and reuses the same client/pool for the life of the process. */
export async function connectMongo(uri: string): Promise<Db> {
  client = new MongoClient(uri);
  await client.connect();
  return client.db();
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
}
