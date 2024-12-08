import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  const { content } = await request.json();

  try {
    await axios.post(process.env.DISCORD_WEBHOOK_URL!, { content });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error posting to Discord webhook:", error); // eslint-disable-line no-console
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
