import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Invalid/Missing environment variable: 'MONGODB_URI'");
}

const uri = process.env.MONGODB_URI;


const uriWithDb = uri.includes("?") 
  ? uri.replace(/\/([^/?]+)(?=\?)/, "/MPRS")  // Replace existing database name
  : uri.endsWith("/")
    ? `${uri}MPRS`
    : `${uri}/MPRS`;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Suppress no-var for this specific line
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    try {
      client = new MongoClient(uriWithDb);
      global._mongoClientPromise = client.connect();
    } catch (error) {
      console.error("MongoDB connection error:", error); // eslint-disable-line no-console
      throw error;
    }
  }
  clientPromise = global._mongoClientPromise as Promise<MongoClient>;
} else {
  try {
    client = new MongoClient(uriWithDb);
    clientPromise = client.connect();
  } catch (error) {
    console.error("MongoDB connection error:", error); // eslint-disable-line no-console
    throw error;
  }
}

// Export the function to connect to the database
export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uriWithDb);
    clientPromise = client.connect();
  }
  const db = (await clientPromise).db();
  return { db, client: await clientPromise };
}

export default clientPromise;
