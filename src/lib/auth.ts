import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET;
if (!secretKey) throw new Error("JWT_SECRET is not set in env");

const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  expiresAt: Date;
};

export async function getUserIdFromCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) return null;

  const payload = await decrypt(sessionToken);
  if (!payload) return null;

  return {
    id: payload.userId,
    expiresAt: payload.expiresAt,
  };
}

// Create a signed JWT token
export async function createSessionToken(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const token = await encrypt({ userId, expiresAt });
  return { token, expiresAt };
}

// Encrypt session payload into JWT
async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // token expires in 7 days
    .sign(encodedKey);
}

// Decrypt and verify session token
export async function decrypt(sessionToken: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(sessionToken, encodedKey, {
      algorithms: ["HS256"],
    });

    // Optional: convert payload.expiresAt back to a Date object if needed
    return {
      userId: payload.userId as string,
      expiresAt: new Date(payload.expiresAt as string),
    };
  } catch (error) {
    // console.error("Invalid or expired session token");
    return null;
  }
}
