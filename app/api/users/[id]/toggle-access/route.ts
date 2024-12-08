import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/")[3]; // Extract id from URL

  if (!id) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("MPRS");

    const user = await db.collection("users").findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isApproved: !user.isApproved } }
    );

    return NextResponse.json({
      success: true,
      message: `User access ${user.isApproved ? "revoked" : "granted"}`,
      modifiedCount: result.modifiedCount,
      newApprovalStatus: !user.isApproved,
    });
  } catch (error) {
    console.error("Error toggling user access:", error); // eslint-disable-line no-console
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
