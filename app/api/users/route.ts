import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import logger from "@/lib/logger";

export async function GET() {
  try {
    const client = await clientPromise;
    logger.debug("MongoDB client connected");
    const db = client.db("MPRS");
    const users = await db.collection("users").find({}).toArray();
    logger.debug("Fetched users:", users);
    return NextResponse.json(users);
  } catch (error) {
    logger.error("Error in GET /api/users:", { error });
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
