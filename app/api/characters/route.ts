import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiUrl = process.env.CHARACTER_API_URL;
    
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch characters" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
