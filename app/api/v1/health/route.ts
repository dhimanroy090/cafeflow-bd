import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "cafeflow-bd-api",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    features: {
      multiTenancy: true,
      qrOrdering: true,
      pos: true,
    },
  });
}
