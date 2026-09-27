import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PlaceMap } from "@/features/place";
import { CurrentUserError } from "@server/modules/auth";
import { getSpacePlace } from "@server/modules/place";

export default async function PlaceDetailPage({ params, searchParams }: PageProps<"/spaces/[spaceId]/places/[spacePlaceId]">) {
  const [{ spaceId, spacePlaceId }, query] = await Promise.all([params, searchParams]);
  let item;
  try {
    item = await getSpacePlace(spaceId, spacePlaceId);
  } catch (error) {
    if (error instanceof CurrentUserError) redirect("/");
    throw error;
  }
  if (!item) notFound();

  return <main className="mx-auto min-h-svh w-full max-w-[430px] bg-surface px-6 py-8">
    <Link href={`/spaces/${spaceId}`} className="inline-flex min-h-11 items-center text-sm font-bold text-brand">공간으로 돌아가기</Link>
    {query.added === "1" ? <p role="status" className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm text-brand-strong">{item.place.name}을 이 공간에 추가했어요.</p> : null}
    {query.added === "0" ? <p role="status" className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm text-brand-strong">이미 이 공간에 있는 장소예요.</p> : null}
    <div className="mt-8"><PlaceMap name={item.place.name} latitude={item.place.latitude} longitude={item.place.longitude} /></div>
    <p className="mt-6 text-xs font-bold text-brand">Kakao Maps 장소</p>
    <h1 className="mt-1 text-2xl font-black text-ink">{item.place.name}</h1>
    <p className="mt-3 text-sm text-muted">{item.place.category}</p>
    <p className="mt-2 text-sm text-muted">{item.place.address}</p>
    {item.place.externalUrl ? <a href={item.place.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-brand">카카오맵에서 보기</a> : null}
    <div className="mt-8 rounded-2xl border border-line p-5">
      <h2 className="text-sm font-bold text-ink">추천 {item._count.recommendations}명</h2>
    </div>
  </main>;
}
