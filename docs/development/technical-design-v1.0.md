# 같가가 기술 설계 v1.0

- 최종 업데이트: 2026-09-06
- 상태: **데이터 기반 구현 완료 — 인증 세로 기능 착수**
- 제품 기준: `../product/prd-v1.0.md`
- 사용자 흐름: `../product/user-flow-v1.0.md`
- 화면 기준: `../design/screen-spec-v1.0.md`
- ERD 기준: `./erd-v0.1.md`
- 문서 역할: 애플리케이션·데이터·배포 구조의 단일 기준(SSOT)

## 1. 목표와 제약

### 목표

- 4년 차 프론트엔드 개발자가 백엔드와 인프라 경계까지 직접 설명하고 검증할 수 있는 구조를 만든다.
- Private Alpha를 빠르게 출시하면서 Public, 이미지와 운영 기능으로 확장 가능한 데이터 의미를 보존한다.
- AI가 생성한 코드는 타입, 테스트, DB 제약, 관측 결과와 공식 문서로 검증한다.

### 제약

- 사이드 프로젝트 가용 시간 안에서 운영 가능한 모듈러 모놀리스로 시작한다.
- 마이크로서비스, Kubernetes, OAuth·비밀번호·세션 암호 로직의 직접 구현과 범용 권한 엔진은 만들지 않는다.
- 모바일 우선 PWA가 첫 클라이언트다. React Native 전용 추상화는 현재 만들지 않는다.

## 2. 기술 스택

| 영역 | 선택 | 상태 |
| --- | --- | --- |
| Runtime | Node.js 24.18.1 (`.nvmrc`) | 확정 |
| 웹 | Next.js App Router | 확정 |
| 언어 | TypeScript strict | 확정 |
| 프론트 구조 | FSD | 확정 |
| 서버 구조 | 동일 저장소의 모듈러 모놀리스 | 확정 |
| ORM | Prisma 7.10.0 + PostgreSQL driver adapter | 구현 |
| DB | PostgreSQL 18.4(local), 운영 Neon | local 구현 |
| 배포 | Vercel | 확정 |
| 지도·장소 검색 | Kakao Maps JavaScript SDK | 확정 |
| 인증 | Better Auth 1.7.3 + Kakao OAuth | E2E 완료 |
| 이미지 | S3 private bucket + Presigned URL | P1 |
| 테스트 Mock | 필요 시 MSW | 도입 시점 미정 |
| 오류·분석 | 도구 미정 | 구현 전 결정 |

## 3. 저장소와 애플리케이션 경계

현재 UI 프로토타입은 `gatgaga-prototype` 폴더에 읽기 전용 참고 자료로 보존한다. 실제 제품은 새 `gatgaga` 저장소에서 시작하고, 확정된 문서와 디자인 토큰 및 검증된 UI 패턴만 선별해 이식한다. Mock reducer, 임시 시나리오 라우트와 프로토타입 전용 데이터는 이식하지 않는다.

```text
app/                  Next.js 라우트와 프레임워크 진입점
src/
  app/                전역 Provider와 초기화
  views/              페이지 수준 화면 조합
  widgets/            독립 UI 블록
  features/           사용자 행동 단위
  entities/           클라이언트 도메인 모델과 UI
  shared/             공통 UI·라이브러리·환경 경계
server/
  modules/
    auth/
    space/
    membership/
    place/
    post/
  db/
  shared/
prisma/
  schema.prisma
  migrations/
```

### FSD 규칙

- 루트 `app/`은 라우팅과 Server/Client 경계만 담당한다.
- 상위 레이어는 하위 레이어만 참조한다.
- 각 slice는 필요한 Public API를 `index.ts`로 노출한다.
- 외부 Provider DTO를 UI와 도메인 타입으로 직접 흘리지 않는다.
- 백엔드 정책과 Prisma 모델을 `src/entities`에 섞지 않는다.
- Steiger로 레이어 위반을 검사한다.

### 디자인 토큰

- 확정 팔레트는 Eucalyptus Sage다: `brand #4D6F61`, `brand-soft #E8EEE9`, `canvas #F8F9F7`, `ink #25312C`.
- 컴포넌트는 hex literal 대신 Tailwind의 `bg-brand`, `text-ink`, `border-brand-border` 같은 의미 기반 토큰만 사용한다.
- CSS 이외에서 색상이 필요한 manifest와 viewport는 `src/shared/config/design-tokens.ts`를 사용한다.
- PWA 아이콘처럼 빌드 시 CSS 변수를 읽을 수 없는 정적 자산은 팔레트 변경 점검 대상에 포함한다.
- 토큰 이름은 색상 이름이 아니라 역할을 나타낸다. 색상 교체 시 컴포넌트 API와 도메인 코드는 변경하지 않는다.

### 서버 규칙

- Route Handler와 Server Action은 입력·출력과 인증 컨텍스트를 전달하는 얇은 경계다.
- 권한, 트랜잭션과 유스케이스는 `server/modules`에 둔다.
- DB 레코드를 그대로 브라우저에 반환하지 않고 명시적 DTO로 변환한다.
- 서버 정책은 UI에서 버튼을 숨긴 것과 무관하게 항상 다시 검사한다.

### 클라이언트 상태 관리

- 로그인 여부와 권한 판정은 Better Auth 서버 세션을 기준으로 한다. 인증 상태를 Zustand에 복제하지 않는다.
- Client Component에서 서버 데이터를 조회할 때는 TanStack Query를 사용한다. `useEffect`에서 API를 직접 호출해 `loading`, `error`, `data`를 따로 관리하지 않는다.
- query key와 `queryOptions`는 해당 도메인 Entity의 `api` 세그먼트가 소유하고 public API로 노출한다. Feature, Widget, View는 공개된 query options를 소비한다.
- 첫 화면에 서버 데이터가 필요하면 Server Component에서 prefetch하고 `HydrationBoundary`로 전달한다. 이후 재조회와 mutation은 같은 Query Cache를 사용한다.
- mutation 성공 후에는 영향받는 query key를 정확히 invalidate하거나, 응답으로 안전하게 갱신할 수 있을 때만 `setQueryData`를 사용한다.
- QueryClient의 `staleTime`, `gcTime`, `retry`, 오류 로깅 기본값은 `shared/api` 한 곳에서 관리한다. 개별 query가 제품 요구 없이 전역 정책을 덮어쓰지 않는다.
- Zustand는 modal, toast, 지도 선택 상태처럼 여러 Client Component가 공유하는 UI 상태에만 사용한다. 서버 응답과 Query Cache를 Zustand에 중복 저장하지 않는다.
- Zustand 소비부는 필요한 state와 action만 selector로 구독한다. 한 번에 store 전체를 구독하지 않는다.
- TanStack Query와 Zustand Provider·테스트 wrapper는 첫 실제 사용 기능과 함께 추가한다. 사용처 없이 의존성만 먼저 설치하지 않는다.

## 4. Kakao Maps 설계와 선택 근거

### 현재 구현

```text
브라우저
  ├─ Kakao Maps JavaScript SDK 로드
  ├─ services.Places.keywordSearch(query)
  ├─ Kakao 검색 결과를 PlaceCandidate로 mapping
  └─ Kakao Map과 Marker 렌더링
```

- JavaScript 키가 있으면 실제 Kakao Places와 Map을 사용한다.
- 키가 없으면 UI 개발을 위한 Mock 검색·지도 미리보기로 전환한다.
- 환경 변수는 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`를 사용한다.
- Kakao Developers에는 로컬과 배포 도메인을 JavaScript SDK 도메인으로 등록한다.
- JavaScript 키는 브라우저에 노출되는 식별자이므로 비밀값으로 취급하지 않지만, 허용 도메인과 쿼터를 제한한다.
- 향후 REST API Admin/Secret 키는 서버 환경 변수에만 보관한다.

### 장소 검색 요청이 Next.js Network 요청처럼 보이지 않는 이유

현재 검색은 우리 `/api/...` Route Handler를 호출하지 않는다. 브라우저에서 로드한 Kakao SDK의 `Places.keywordSearch`가 Kakao로 직접 요청하고 callback으로 결과를 돌려준다.

Chrome DevTools에서 확인할 때:

1. Network 필터 문자열을 비운다. 현재 확인 화면에는 `main` 필터가 남아 있어 SDK 본체만 보였다.
2. `All`에서 검색하고 필요하면 `Fetch/XHR`, `JS`, `Other`를 함께 본다.
3. 검색 직전에 Network 기록을 지운 뒤 검색 버튼을 누른다.
4. SDK 내부 요청은 구현 방식에 따라 일반 애플리케이션 fetch와 다른 Type으로 표시될 수 있다.

응답 데이터는 `search-place-candidates.ts`에서 Kakao callback으로 받고 `PlaceCandidate`로 변환한 뒤 React state에 저장한다. 따라서 서버 터미널에는 별도 API 로그가 남지 않는다.

### 카카오를 선택한 이유

1. 현재 프로토타입에서 실제 키워드 검색, 지도와 Marker가 정상 동작해 기술 위험을 이미 낮췄다.
2. 한 JavaScript SDK의 `services` library로 지도와 장소 키워드 검색을 함께 구성할 수 있다.
3. 한글 장소 검색 결과에 장소명, 카테고리, 주소, 좌표와 Kakao 장소 URL이 포함된다.
4. 검색 결과가 최대 15개라 모바일 후보 탐색에 충분하다.
5. Provider Adapter를 유지하므로 Kakao DTO가 제품 도메인을 오염시키지 않는다.

### NAVER를 선택하지 않은 이유

NAVER도 동적 지도와 Marker를 구현할 수 있고 작은 서비스는 무료 구간 안에 있을 가능성이 높다. 다만 동일한 사용자 경험을 만들려면 구성이 더 복잡하다.

- 지도 렌더링은 NAVER Cloud Maps를 사용한다.
- 장소 키워드 검색은 별도 NAVER API HUB Local Search를 사용한다.
- Local Search는 Client Secret 보호를 위해 Next.js 서버를 경유해야 한다.
- 공식 Local Search 결과는 요청당 최대 5개다.
- Kakao JS Places처럼 위치·반경·거리순 옵션을 한 흐름에서 쓰기 어렵다.

2026-09-05 확인 기준:

- NAVER Dynamic Map은 대표 계정 기준 월 6,000,000건 무료, 초과 시 건당 0.1원으로 안내된다.
- NAVER API HUB Local Search는 일 25,000회 한도와 요청당 최대 5개 결과를 안내한다.
- 비용 자체보다 통합 복잡도와 검색 UX가 Kakao 유지 결정의 주된 이유다.

공식 참고:

- Kakao Maps Web API: <https://apis.map.kakao.com/web/documentation/>
- NAVER Cloud Maps 요금: <https://www.ncloud.com/charge/price/ko>
- NAVER API HUB Local Search: <https://api.ncloud-docs.com/docs/naver-api-hub-search-local>

### 현재 위치 검색

Private Alpha에는 구현하지 않는다.

- 현재 코드의 `keywordSearch(query)`에는 위치 좌표를 전달하지 않는다.
- 결과 주소는 Kakao가 각 장소 정보로 반환한 값이며 사용자 현재 위치를 사용한 것이 아니다.
- 사용자는 `지역 + 장소명`으로 검색 범위를 좁힌다.
- Browser Geolocation 권한, 정확도, 거부·시간 초과 처리는 사용자 요구가 확인될 때 별도 기술 스파이크로 다룬다.
- 현재 위치와 위치 이력을 서버에 저장하지 않는다.

### Provider 경계

```ts
type PlaceSource = "KAKAO" | "USER";

type PlaceCandidate = {
  providerPlaceId?: string;
  source: PlaceSource;
  name: string;
  category: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  phone?: string;
  externalUrl?: string;
};
```

- `KakaoPlaceResult → PlaceCandidate` 변환은 Provider Adapter 안에서만 수행한다.
- 저장 시 Kakao 결과 원문 전체가 아니라 제품에 필요한 필드와 출처를 보존한다.
- Provider 전환은 검색 Adapter와 지도 Renderer 교체 문제로 한정한다.

## 5. 데이터 모델

### 관계

```text
User
└─ SpaceMembership ─ Space
                      ├─ SpaceInvitation
                      └─ SpacePlace ─ Place
                           ├─ PlaceRecommendation ─ User
                           └─ Post ─ Comment
```

P1에서 `Post ─ Media`, Public 운영에서 `Report`, `Ban` 또는 Membership 상태를 추가한다.

`Space.visibility`는 P0부터 확장 지점으로 유지한다. P0 생성 요청은 서버에서 `PRIVATE`만 허용하고, P1에서 `PUBLIC`을 활성화한다. 읽기 권한은 한 곳의 정책 함수에서 `PRIVATE → 활성 멤버`, `PUBLIC → 누구나`로 분기하며, 쓰기는 두 경우 모두 활성 멤버에게만 허용한다. `UNLISTED`는 P2 결정 전까지 enum과 UI에 미리 추가하지 않는다.

### 핵심 엔티티

| 엔티티 | 핵심 의미 |
| --- | --- |
| User | Better Auth가 같은 PostgreSQL에 관리하는 내부 사용자와 Kakao 프로필 snapshot |
| Account | Kakao 등 로그인 수단과 User의 외부 identity 연결 |
| Session | DB 기반 사용자 세션과 만료 정보 |
| Verification | Better Auth가 사용하는 단기 검증 데이터 |
| Space | 이름, visibility와 생성 감사 정보 |
| SpaceMembership | User-Space 관계, Owner/Member, 상태 |
| SpaceInvitation | 해시된 토큰, 활성·폐기 상태, 생성자 |
| Place | Provider 또는 직접 등록 장소의 사실 정보 |
| SpacePlace | Space에 저장된 Place와 제거 상태 |
| PlaceRecommendation | 멤버의 장소 추천 사실과 시각 |
| Post | 작성자 소유 텍스트 콘텐츠와 soft delete 상태 |
| Comment | Post의 작성자 소유 평면 댓글과 soft delete 상태 |

### 주요 유일 제약

- `Account(providerId, accountId)` unique
- `SpaceMembership(spaceId, userId)` unique
- `SpacePlace(spaceId, placeId)` unique
- `PlaceRecommendation(spacePlaceId, userId)` unique
- Kakao Place: `(sourceType, providerPlaceId)` unique
- 활성 초대: Space당 하나만 허용하도록 트랜잭션 또는 부분 인덱스로 보장

직접 등록 Place는 `providerPlaceId` 없이 장소명과 좌표 및 등록자를 보존한다. 원본 Space는 soft delete 뒤에도 남는 SpacePlace 관계로 확인하며, Private Alpha에서는 다른 Space의 검색 후보로 자동 재사용하지 않는다.

### 삭제 상태

- 사용자 삭제와 운영 숨김, 실제 물리 삭제를 구분한다.
- `SpacePlace.deletedAt`이 있으면 연결 추천·글·댓글을 함께 조회에서 제외한다.
- Post나 Comment는 작성자만 삭제하므로 `deletedAt`만 보존한다.
- 댓글이 남은 Post는 원문 대신 삭제 상태를 반환한다.
- 보존 기간과 물리 삭제 작업은 개발 전에 결정한다.

## 6. 동시성과 트랜잭션

### 장소 추가

하나의 트랜잭션에서 다음을 수행한다.

1. Kakao Place를 `(sourceType, providerPlaceId)`로 upsert한다.
2. SpacePlace를 `(spaceId, placeId)`로 upsert한다.
3. 추가자의 PlaceRecommendation을 upsert한다.
4. 이미 활성 상태면 기존 장소 ID를 멱등 성공으로 반환한다.
5. soft delete 상태면 자동 복구하지 않고 `RESTORE_REQUIRED`를 반환한다.

### 장소 제거

1. 제거 확인 응답에 최신 추천·글·댓글 수와 `SpacePlace.impactVersion`을 포함한다.
2. DB에서 최신 Membership과 대상 Space를 검사한다.
3. 최초 등록자인 경우 다른 멤버의 활성 추천·글·댓글이 없는지 다시 계산한다. 최초 등록자의 자동 추천은 제외한다.
4. Owner라면 최신 영향 수와 `observedVersion`을 비교한다.
5. `deletedAt IS NULL AND impactVersion = observedVersion` 조건으로 갱신하고 0행이면 `IMPACT_CHANGED`를 반환한다.
6. 같으면 SpacePlace를 soft delete하고 제거자와 시각을 남긴다.

추천·Post·Comment의 생성·수정·삭제는 같은 transaction에서 활성 SpacePlace의 `impactVersion`을 먼저 증가시킨다. 따라서 제거 확인과 실행 사이에 기여가 바뀌면 조용히 유실하지 않는다.

### 콘텐츠 수정

- Post와 Comment는 `authorId === session.userId`일 때만 변경한다.
- MVP에는 공동 편집과 사용자 노출 버전 충돌 UI가 없다.
- `revision` optimistic check로 같은 계정의 여러 탭·기기 덮어쓰기를 막는다.
- 충돌 시 자동 병합이나 Jira식 비교 화면을 만들지 않고 최신 내용을 다시 불러오는 일반 오류로 처리한다.

## 7. 서버 API 경계 초안

실제 전송 수단은 Server Action 또는 Route Handler 중 화면과 캐시 요구에 맞게 정한다. 아래 유스케이스 이름과 정책은 유지한다.

| 유스케이스 | 입력 | 핵심 보장 |
| --- | --- | --- |
| `createSpace` | name | Space와 Owner Membership 원자 생성 |
| `acceptInvitation` | token | 해시 비교, 폐기 확인, Membership 멱등 생성 |
| `addPlaceToSpace` | spaceId, PlaceCandidate | Provider/Space 중복 방지, 최초 추천 생성 |
| `recommendPlace` | spacePlaceId | 사용자별 추천 하나 |
| `createPlacePost` | spacePlaceId, body | 활성 Member, 1,000자 제한 |
| `updatePost` | postId, body | 작성자 권한 |
| `deletePost` | postId | 작성자 권한, soft delete |
| `createComment` | postId, body | 활성 Member와 같은 Space 확인 |
| `removeSpacePlace` | id, observedImpact, observedVersion | 최신 권한·영향 확인, soft delete |
| `undoRemoveSpacePlace` | id | 제거자 본인, DB 시각 기준 5초 안에 복구 |
| `restoreSpacePlace` | id | Owner 확인, 시간 제한 없이 기존 맥락 복구 |

오류는 최소한 `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `PROVIDER_ERROR`, `RATE_LIMITED`로 구분한다. Private 리소스의 비인가 접근은 존재 여부 노출을 피하도록 응답을 통일한다.

## 8. 인증과 권한

- Better Auth를 애플리케이션에서 운영하고 Kakao를 외부 OAuth IdP로 사용한다.
- Better Auth의 User·Account·Session·Verification과 제품 테이블을 같은 PostgreSQL·Prisma migration history로 관리한다.
- `Account(providerId, accountId)`가 Kakao identity와 내부 User를 연결하므로 별도 사용자 동기화 테이블을 만들지 않는다.
- P0는 PostgreSQL 세션을 사용하고 Redis와 cookie cache는 도입하지 않는다.
- Provider token은 암호화하고 implicit account linking은 비활성화한다.
- `User.disabledAt`, Session, SpaceMembership과 객체 권한은 모든 Private 요청에서 서버가 확인한다.
- Cookie의 CSRF, trusted origin, Secure, HttpOnly와 SameSite 정책을 E2E로 확인한다.
- 모든 입력은 서버에서 schema validation한다.
- ID만 받아 update/delete하지 않고 Space 경계와 소유권을 함께 조건으로 건다.

세부 결정과 Kakao 설정 순서는 [`../adr/0002-authentication-with-better-auth.md`](../adr/0002-authentication-with-better-auth.md)를 따른다. Kakao 키·활성화는 인증 구현 첫 작업에서 실제 계정 2개로 검증한다.

## 9. PostgreSQL·Prisma·Vercel

### 서비스별 역할

```text
사용자 브라우저
  └─ Vercel — Next.js, Better Auth, Route Handler와 Server Action 실행
       ├─ Kakao Login — 외부 OAuth IdP
       ├─ Neon PostgreSQL — 인증·Space·장소·글·댓글 등 구조화 데이터
       └─ S3 — 게시글 이미지 원본·변환본(P1에서 도입)

사용자 브라우저
  └─ Kakao Maps — 지도 타일과 장소 검색
```

- `운영 Neon`은 **Production 환경에서 사용하는 관리형 PostgreSQL이 Neon**이라는 뜻이다.
- DB를 S3에 저장하지 않는다. 관계형 데이터는 Neon PostgreSQL에 저장한다.
- S3는 P1에서 사진을 도입할 때 이미지 파일만 저장한다. DB에는 S3 Object Key와 메타데이터를 저장한다.
- Next.js 애플리케이션은 Vercel에 배포하고 Vercel Functions가 Neon과 연결된다.
- 로컬 개발에서는 Docker PostgreSQL을 사용해 DB와 SQL을 직접 학습한다.

### 환경

| 환경 | 애플리케이션 | DB | 목적 |
| --- | --- | --- | --- |
| local | Next.js dev | Docker PostgreSQL | 쿼리·마이그레이션 학습과 개발 |
| preview | Vercel Preview | Neon preview/dev DB | PR 단위 검증 |
| production | Vercel Production | Neon production DB | 실제 Alpha |

### 연결

- 애플리케이션 요청은 Neon pooled connection을 사용한다.
- Prisma migration은 direct connection을 사용한다.
- 애플리케이션과 DB 리전을 가깝게 둔다.
- 개발·Preview·Production 데이터베이스와 비밀값을 분리한다.
- Production migration은 배포 중 임의 실행하지 않고 명시적 단계로 관리한다.

### 환경 변수 후보

```text
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=
DATABASE_URL=
DIRECT_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
```

실제 값은 커밋하지 않는다. Vercel 환경 변수에는 Preview와 Production 범위를 분리한다.

## 10. 테스트·관측·비용

### 테스트

- Unit: Mapper, 권한 함수, validation, 영향 수 계산
- Integration: Prisma + PostgreSQL로 초대, 중복 장소, 권한, soft delete
- E2E: 로그인→초대→장소 추가→추천→글·댓글→제거·복구
- UI: 로딩·빈 상태·오류·toast timer와 keyboard interaction
- 접근성: 이름, focus, dialog, live region과 44px touch target

### MSW 도입 기준

현재 Kakao 검색 자체를 MSW로 감싸지 않는다. 실제 SDK와 Mock fallback이 이미 분리되어 있다. 아래 시점에 MSW를 도입한다.

- Route Handler 또는 서버 API 계약이 생긴다.
- UI에서 성공·지연·오류·권한 상태를 반복 재현해야 한다.
- Storybook 또는 독립 컴포넌트 테스트가 필요해진다.

MSW handler는 서버 DTO 계약을 따라야 하며 별도 가짜 도메인 모델을 만들지 않는다.

### 관측

- 사용자 오류와 서버 로그를 연결할 request ID
- 인증 실패, 권한 거부, DB 오류, Kakao 오류, Rate limit 구분
- 핵심 이벤트: 초대 수락, 장소 검색·선택·추가, 중복 진입, 추천, 글, 댓글, 제거, 복구
- 민감한 초대 토큰, 인증 정보와 사용자 작성 원문은 로그에서 제거

### 비용 통제

- Vercel, Neon과 Kakao 사용량 알림을 설정한다.
- 외부 호출 실패·쿼터 초과를 계측한다.
- P1 이미지 도입 전 파일 수·원본 크기·변환 크기·보존 정책과 S3 Budget을 확정한다.

## 11. 구현 순서

1. **완료** — Docker PostgreSQL 18.4·Prisma 7.10.0 기반과 버전 고정
2. **완료** — Better Auth 1.7.3 core schema와 제품 ERD 병합, 첫 migration·제약 smoke test
3. **완료** — Kakao Login 설정·동의 항목과 Better Auth 세션 연결
4. **다음** — Space·Owner Membership 원자 생성
5. Place·SpacePlace·Recommendation 데이터 연결
6. Post·Comment와 작성자 권한·revision
7. 장소 제거·실행 취소·복구 동시성 테스트
8. E2E·관측·Vercel Preview
9. 지인 Private Alpha 배포

## 12. 구현 전 열린 결정

- Server Action과 Route Handler의 기능별 사용 기준
- Zod 등 runtime validation 도구
- Neon pooled·direct 연결 문자열과 Preview DB 운영 방식
- 직접 등록 주소 검색 UX와 Kakao Geocoder 사용 범위
- Post·Comment·SpacePlace 보존 기간과 물리 삭제 작업
- 오류 추적과 제품 분석 도구
- Vercel·Neon 리전, Preview DB 전략과 예산 알림 한도

버전·가격·서비스 정책은 변경될 수 있으므로 실제 구현과 배포 직전에 공식 문서를 다시 확인한다.
