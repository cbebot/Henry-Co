import { NextResponse } from "next/server";
import { getLearnSnapshot } from "@/lib/learn/data";

export async function POST() {
  const snapshot = await getLearnSnapshot();
  return NextResponse.json({
    ok: true,
    courses: snapshot.courses.length,
    paths: snapshot.paths.length,
  });
}

export async function GET() {
  return POST();
}
