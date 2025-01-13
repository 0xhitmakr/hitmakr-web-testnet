// app/api/auth/verify/route.js
import { cookies } from "next/headers";
import {
  verifySignature,
  getAddressFromMessage,
  getChainIdFromMessage,
} from "@reown/appkit-siwe";
import { NextResponse } from "next/server";
import Session from "@/lib/siwe/session";
import jwt from "jsonwebtoken";
import { tap } from "@/lib/siwe/utils";

const projectId = process.env.REOWN_PROJECT_ID;

export async function POST(request) {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return NextResponse.json(
        { error: "Missing message or signature" },
        { status: 400 }
      );
    }

    const session = await Session.fromRequest(request);

    const address = getAddressFromMessage(message);
    let chainId = getChainIdFromMessage(message);

    if (chainId.includes(":")) {
      chainId = chainId.split(":")[1];
    }
    chainId = Number(chainId);

    if (!projectId) {
      throw new Error("REOWN_PROJECT_ID is not set");
    }

    // const storedNonce = cookies().get('siwe_nonce')

    const isValid = await verifySignature({
      address,
      message,
      signature,
      chainId,
      nonce: session.nonce, // storedNonce.value, // if from cookies
      projectId: projectId,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    cookies().delete("siwe_nonce");
    session.nonce = undefined;
    session.address = address;
    session.chainId = chainId;
    session.isAuthenticated = true;

    const token = jwt.sign({ address, chainId }, process.env.JWT_SECRET, {
      expiresIn: "20d",
    });

    return tap(
      new NextResponse(
        JSON.stringify({
          token,
          ok: true,
          success: true,
          user: {
            address,
            chainId,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      ),
      (res) => session.persist(res)
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
