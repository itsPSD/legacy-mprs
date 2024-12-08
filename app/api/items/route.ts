import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("MPRS");
  const items = await db.collection("items").find({}).toArray();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const client = await clientPromise;
  const db = client.db("MPRS");
  const { name, price, stockPrice, category, damageLevel } = await request.json();

  if (
    typeof name !== "string" ||
    typeof price !== "number" ||
    typeof stockPrice !== "number" ||
    price < 0 ||
    stockPrice < 0 ||
    !["Engine", "Body", "Door", "Tyres", "Windows", "Motor Oil", "Advanced Repair Kit"].includes(name) ||
    ((name !== "Motor Oil" && name !== "Advanced Repair Kit") &&
      (typeof category !== "string" ||
        !["Compacts", "Cycles", "EDM", "Emergency", "Motorcycles", "Muscle", 
          "Off-Road", "Sedans", "Service & Utility", "Sports", "Sports Classic", 
          "Super", "SUVs", "Trailers", "Vans"].includes(category))) ||
    ((name === "Engine" || name === "Body") &&
      (typeof damageLevel !== "string" ||
        !["None", "Minor", "Moderate", "Heavy", "Severe", "Extreme"].includes(damageLevel)))
  ) {
    return NextResponse.json(
      { error: "Invalid input data" },
      { status: 400 }
    );
  }

  const newItem = {
    name,
    price,
    stockPrice,
    ...(name !== "Motor Oil" && name !== "Advanced Repair Kit" ? { category } : {}),
    ...(name === "Engine" || name === "Body" ? { damageLevel } : {})
  };

  const result = await db
    .collection("items")
    .insertOne(newItem);
  return NextResponse.json(result);
}
