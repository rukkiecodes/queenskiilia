import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["student", "business", "other"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, role } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    role?: unknown;
  };

  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 320) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const cleanName =
    typeof name === "string" && name.trim().length > 0
      ? name.trim().slice(0, 120)
      : null;
  const cleanRole =
    typeof role === "string" && VALID_ROLES.has(role) ? role : "other";

  try {
    const result = await pool.query(
      `INSERT INTO waitlist (name, email, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [cleanName, cleanEmail, cleanRole]
    );

    const alreadyJoined = result.rowCount === 0;
    return NextResponse.json({ ok: true, alreadyJoined }, { status: 200 });
  } catch (err) {
    console.error("waitlist insert failed:", err);
    return NextResponse.json(
      { error: "We couldn't save your spot. Please try again shortly." },
      { status: 500 }
    );
  }
}
