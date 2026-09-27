import { notFound, redirect } from "next/navigation";

import { PlaceSearch } from "@/features/place";
import { CurrentUserError } from "@server/modules/auth";
import { getCurrentUserSpace } from "@server/modules/space";

export default async function AddPlacePage({ params }: PageProps<"/spaces/[spaceId]/places/new">) {
  const { spaceId } = await params;
  let space;
  try {
    space = await getCurrentUserSpace(spaceId);
  } catch (error) {
    if (error instanceof CurrentUserError) redirect("/");
    throw error;
  }
  if (!space) notFound();

  return <PlaceSearch spaceId={spaceId} />;
}
