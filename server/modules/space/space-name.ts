export type SpaceNameResult =
  | { success: true; name: string }
  | { success: false; message: string };

export function validateSpaceName(value: unknown): SpaceNameResult {
  if (typeof value !== "string") {
    return { success: false, message: "공간 이름을 입력해 주세요." };
  }

  const name = value.trim();
  const length = Array.from(name).length;

  if (length === 0) {
    return { success: false, message: "공간 이름을 입력해 주세요." };
  }

  if (length > 40) {
    return { success: false, message: "공간 이름은 40자 이하로 입력해 주세요." };
  }

  return { success: true, name };
}
