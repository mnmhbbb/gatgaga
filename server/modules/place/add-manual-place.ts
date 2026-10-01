import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";
import { validateManualPlaceCandidate } from "./place-candidate";
import { saveManualPlace } from "./save-manual-place";

export async function addManualPlace(spaceId: string, input: unknown) {
  const user = await requireCurrentUser();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(spaceId)) {
    return { status: "NOT_FOUND" as const };
  }
  const candidate = validateManualPlaceCandidate(input);
  return prisma.$transaction((transaction) => saveManualPlace(transaction, user.id, spaceId, candidate));
}
