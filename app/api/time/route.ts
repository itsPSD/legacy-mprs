import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import logger from "@/lib/logger";

let client: MongoClient | null = null;

async function getMongoClient() {
  if (client) {
    return client;
  }

  const uri = process.env.MONGODB_URI_TIME;
  if (!uri) {
    throw new Error("Invalid/Missing environment variable: \"MONGODB_URI_TIME\"");
  }

  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function GET() {
  try {
    const departmentId = process.env.DEPARTMENT_ID;
    if (!departmentId) {
      throw new Error("Invalid/Missing environment variable: \"DEPARTMENT_ID\"");
    }

    const client = await getMongoClient();
    logger.debug("MongoDB client connected for clocked time");
    const db = client.db("StaffWorker");
    const clockedTimes = await db.collection("clockedtimes")
      .find({ DepartmentID: departmentId })
      .toArray();
    logger.debug("Fetched clocked times:", clockedTimes);
    return NextResponse.json(clockedTimes);
  } catch (error) {
    logger.error("Error in GET /api/clocked-time:", { error });
    return NextResponse.json(
      { error: "Failed to fetch clocked times" },
      { status: 500 }
    );
  }
}
