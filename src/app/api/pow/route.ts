import { createChallenge } from "@/lib/server/pow";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(createChallenge(), {
    headers: { "Cache-Control": "no-store" },
  });
}
