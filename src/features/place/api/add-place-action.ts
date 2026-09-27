"use server";

import { CurrentUserError } from "@server/modules/auth";
import { addPlaceToSpace, PlaceInputError } from "@server/modules/place";

export async function addPlaceAction(spaceId: string, candidate: unknown) {
  try {
    return await addPlaceToSpace(spaceId, candidate);
  } catch (error) {
    if (error instanceof PlaceInputError) {
      return { status: "VALIDATION_ERROR" as const, message: error.message };
    }

    if (error instanceof CurrentUserError) {
      return { status: error.code };
    }

    console.error("장소 추가 중 예상하지 못한 오류가 발생했습니다.", error);
    return { status: "ERROR" as const };
  }
}
