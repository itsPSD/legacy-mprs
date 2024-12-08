import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.discordId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { characterName, cid } = await req.json();

  if (!characterName || !cid) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("MPRS");

    const existingUser = await db
      .collection("users")
      .findOne({ discordId: session.user.discordId });

    if (existingUser) {
      // Validate the input data
      if (
        (existingUser.characterName &&
          existingUser.characterName !== characterName) ||
        (existingUser.cid && existingUser.cid !== cid)
      ) {
        return new Response(
          JSON.stringify({
            error: "Entered details do not match registered information",
          }),
          { status: 400 }
        );
      }

      // Update only empty fields
      const updateFields: { characterName?: string; cid?: string } = {};
      if (!existingUser.characterName) {
        updateFields.characterName = characterName;
      }
      if (!existingUser.cid) {
        updateFields.cid = cid;
      }

      if (Object.keys(updateFields).length > 0) {
        await db.collection("users").updateOne(
          { discordId: session.user.discordId },
          { $set: updateFields }
        );
      }

      return new Response(
        JSON.stringify({ message: "Profile updated successfully" }),
        { status: 200 }
      );
    }

    // Insert new data if user doesn't exist
    await db.collection("users").updateOne(
      { discordId: session.user.discordId },
      { $set: { characterName, cid } },
      { upsert: true }
    );

    return new Response(
      JSON.stringify({ message: "Profile updated successfully" }),
      { status: 200 }
    );
  } catch (_err) {
    // TODO: Add proper error logging for production
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
