import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Session from "@/lib/siwe/session";
import { tap } from "@/lib/siwe/utils";

export async function POST(request) {
  try {
    // Retrieve the session
    const session = await Session.fromRequest(request);

    // Clear session data
    session.clear(request);

    // Delete any authentication cookies
    cookies().delete("siwe_nonce", {
      path: "/",
    });
    
    return tap(
      new NextResponse("Successfully signed out", {
        status: 200,
      }),
      (res) => session.clear(res)
    );
  } catch (error) {
    console.error("Signout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sign out" },
      { status: 500 }
    );
  }
}
