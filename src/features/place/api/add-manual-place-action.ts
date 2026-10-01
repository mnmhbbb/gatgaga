"use server";

import { CurrentUserError } from "@server/modules/auth";
import { addManualPlace, PlaceInputError } from "@server/modules/place";

export async function addManualPlaceAction(spaceId: string, candidate: unknown) {
  try {
    return await addManualPlace(spaceId, candidate);
  } catch (error) {
    if (error instanceof PlaceInputError) {
      return { status: "VALIDATION_ERROR" as const, message: error.message };
    }
    if (error instanceof CurrentUserError) return { status: error.code };
    console.error("장소 직접 등록 중 예상하지 못한 오류가 발생했습니다.", error);
    return { status: "ERROR" as const };
  }
}
