import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("search") || "";
    
    const vehicleApiUrl = process.env.VEHICLE_API_URL;
    if (!vehicleApiUrl) {
      throw new Error("Vehicle API URL not configured");
    }

    const response = await fetch(vehicleApiUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch vehicles");
    }

    const vehicles = await response.json();
    
    // Filter vehicles based on search query
    const filteredVehicles = vehicles.filter((vehicle: any) =>
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return NextResponse.json(filteredVehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}
