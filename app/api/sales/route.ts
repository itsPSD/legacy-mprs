import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("MPRS");
    const saleData = await request.json();

    if (!saleData) {
      return NextResponse.json({ error: "No sale data provided" }, { status: 400 });
    }

    // Get current time (already in IST)
    const currentTime = new Date();

    // Format date as DD/MM/YYYY
    const date = currentTime.getDate().toString().padStart(2, "0") + "/" +
                (currentTime.getMonth() + 1).toString().padStart(2, "0") + "/" +
                currentTime.getFullYear();

    // Format time as HH:mm
    const time = currentTime.getHours().toString().padStart(2, "0") + ":" +
                currentTime.getMinutes().toString().padStart(2, "0");

    // Add timestamp and display time to sale data
    const saleDataWithTime = {
      customerDetails: {
        cid: saleData.customerDetails.cid,
        name: saleData.customerDetails.name,
        characterName: session.user.characterName || "Unknown",
        discordId: session.user.discordId || "Unknown",
        vehicleName: saleData.customerDetails.vehicleName || "",
        plateNumber: saleData.customerDetails.plateNumber || ""
      },
      vehicleDetails: {
        vehicleCategory: saleData.vehicleDetails.vehicleCategory || "",
        engineDamage: saleData.vehicleDetails.engineDamage || "",
        bodyDamage: saleData.vehicleDetails.bodyDamage || "",
        numberOfDoors: saleData.vehicleDetails.numberOfDoors || 0,
        numberOfWindows: saleData.vehicleDetails.numberOfWindows || 0,
        numberOfTyres: saleData.vehicleDetails.numberOfTyres || 0,
        motorOil: saleData.vehicleDetails.motorOil || false,
        numberOfRepairKits: saleData.vehicleDetails.numberOfRepairKits || 0,
        discount: saleData.vehicleDetails.discount || 0
      },
      soldBy: session.user.characterName || "Unknown",
      items: saleData.items.map((item: any) => ({
        itemId: item.itemId,
        name: item.name,
        category: item.category || "",
        quantity: item.quantity || 1,
        price: item.price || 0,
        stockPrice: item.stockPrice || 0,
        damageLevel: item.damageLevel || null,
        totalPrice: item.totalPrice || 0,
        totalProfit: item.totalProfit || 0
      })),
      totalBill: saleData.totalBill || 0,
      profit: saleData.profit || 0,
      discount: saleData.vehicleDetails.discount || 0,
      date,
      time,
      timestamp: currentTime.toISOString(),
      soldByDiscordId: session.user.discordId || "Unknown"
    };

    // Update items collection stock
    for (const item of saleData.items) {
      await db.collection("items").updateOne(
        { _id: item.itemId },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Insert the sale and get the inserted document
    const result = await db.collection("sales").insertOne(saleDataWithTime);
    
    // Format the response with $oid
    const response = {
      _id: {
        $oid: result.insertedId.toString()
      },
      ...saleDataWithTime
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing sale:', error);
    return NextResponse.json({ error: "Failed to process sale" }, { status: 500 });
  }
}
