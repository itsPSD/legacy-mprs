import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/")[3]; // Extract id from URL

  if (!id) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("MPRS");
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User role updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error changing user role:", error); // eslint-disable-line no-console
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}