"use server";

import { revalidatePath } from "next/cache";

import { CurrentUserError } from "@server/modules/auth";
import { recommendPlace } from "@server/modules/place";

export async function recommendPlaceAction(spaceId: string, spacePlaceId: string) {
  try {
    const result = await recommendPlace(spaceId, spacePlaceId);

    if (result.status === "CREATED" || result.status === "ALREADY_RECOMMENDED") {
      revalidatePath(`/spaces/${spaceId}/places/${spacePlaceId}`);
      revalidatePath(`/spaces/${spaceId}`);
    }

    return result;
  } catch (error) {
    if (error instanceof CurrentUserError) {
      return { status: error.code };
    }

    console.error("장소 추천 중 예상하지 못한 오류가 발생했습니다.", error);
    return { status: "ERROR" as const };
  }
}
