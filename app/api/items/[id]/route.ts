import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("MPRS");

    const result = await db.collection("items").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error); // eslint-disable-line no-console
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const { price, stockPrice, category, damageLevel } = await request.json();
    const client = await clientPromise;
    const db = client.db("MPRS");
    const item = await db.collection("items").findOne({ _id: new ObjectId(id) });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (
      typeof price !== "number" ||
      typeof stockPrice !== "number" ||
      price < 0 ||
      stockPrice < 0 ||
      ((item.name !== "Motor Oil" && item.name !== "Advanced Repair Kit") &&
        (typeof category !== "string" ||
          !["Compacts", "Cycles", "EDM", "Emergency", "Motorcycles", "Muscle", 
            "Off-Road", "Sedans", "Service & Utility", "Sports", "Sports Classic", 
            "Super", "SUVs", "Trailers", "Vans"].includes(category))) ||
      ((item.name === "Engine" || item.name === "Body") &&
        (typeof damageLevel !== "string" ||
          !["None", "Minor", "Moderate", "Heavy", "Severe", "Extreme"].includes(damageLevel)))
    ) {
      return NextResponse.json(
        { error: "Invalid input values" },
        { status: 400 }
      );
    }

    const updateData = {
      price,
      stockPrice,
      ...(item.name !== "Motor Oil" && item.name !== "Advanced Repair Kit" ? { category } : {}),
      ...(item.name === "Engine" || item.name === "Body" ? { damageLevel } : {})
    };

    const result = await db.collection("items").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating item:", error); // eslint-disable-line no-console
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
