"use server";

import { revalidatePath } from "next/cache";

import { CurrentUserError } from "@server/modules/auth";
import { createSpace, SpaceValidationError } from "@server/modules/space";

import type { CreateSpaceFormState } from "../model/create-space-form-state";

export async function createSpaceAction(
  _previousState: CreateSpaceFormState,
  formData: FormData,
): Promise<CreateSpaceFormState> {
  try {
    const space = await createSpace(formData.get("name"));

    revalidatePath("/");

    return {
      status: "success",
      spaceId: space.id,
    };
  } catch (error) {
    if (error instanceof SpaceValidationError) {
      return { status: "error", message: error.userMessage };
    }

    if (error instanceof CurrentUserError) {
      return {
        status: "error",
        message:
          error.code === "UNAUTHENTICATED"
            ? "로그인이 만료됐어요. 다시 로그인해 주세요."
            : "이 계정으로는 공간을 만들 수 없어요.",
      };
    }

    console.error("공간 생성 중 예상하지 못한 오류가 발생했습니다.", error);

    return {
      status: "error",
      message: "공간을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
