import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid sale ID format" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("MPRS");

    const result = await db.collection("sales").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Sale deleted successfully" }, { status: 200 });
  } catch (_error) {
    // Log error to error monitoring service
    return NextResponse.json({ error: "Failed to delete sale" }, { status: 500 });
  }
}
