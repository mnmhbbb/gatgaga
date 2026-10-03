# 같가가 프로젝트 핸드오프

- 최종 업데이트: 2026-10-03
- 현재 단계: 직접 등록 구현·자동 검증 완료, 직접 등록 및 추가 추천 사용자 QA·승인 대기
- 다음 한 단계: 사용자가 아래 QA 문서로 실제 검증 → 실패 수정·재검증 → 명시적 승인
- 현재 검증 문서: [직접 등록](qa/manual-place.md), [멤버 추천·접근 권한](qa/place-recommendation.md)
- 대상 코드: `121f01f` (직접 등록), 이전 추천 기능 `5fec985` 포함
- 사용자 승인: **대기**. 커밋 메시지 확인·수정 요청은 기능 승인으로 간주하지 않는다. 다음 기능 구현은 승인 후 시작한다.
- 저장소: 이 문서가 들어 있는 `gatgaga` 제품 저장소

## 한 줄 정의

> 같가가는 여러 사람이 하나의 공간에 장소를 함께 모으고, 장소마다 추천과 이야기를 이어가는 서비스다.

`같가가`는 `같이 가요, 가요`에서 출발한 줄임말이다. 첫 검증은 2~5명의 지인이 Private Space에서 방문 후보 장소를 함께 수집하는 상황에 집중한다.

## 제품 방향과 기술 결정

아래는 P0 제품 목표를 포함하며, 모두 구현됐다는 뜻은 아니다. 실제 완료 범위는 다음 절을 따른다.

- 첫 출시는 Private Alpha다.
- 클라이언트는 모바일 우선 PWA다.
- 장소 목록이 Space의 기본 화면이고 지도는 같은 데이터의 전환 보기다.
- 장소 저장, 추천, 작성자 소유 장소 글과 평면 댓글을 제공한다.
- 글과 댓글은 작성자만 수정·삭제한다.
- 장소 제거와 사용자 콘텐츠 삭제는 soft delete한다.
- 지도와 장소 검색은 제품 구현 시 Kakao Maps를 사용한다.
- 현재 위치 검색은 구현하지 않는다. 지역과 장소명을 함께 검색하고 결과 주소로 위치를 판단한다.
- Next.js App Router, TypeScript, FSD, Prisma, PostgreSQL, Neon과 Vercel을 사용한다.
- Better Auth·Kakao 로그인을 사용하고 인증·제품 테이블은 같은 PostgreSQL에 둔다. 제품의 Membership·Invitation·객체 권한은 직접 구현한다.
- 초대 링크는 자동 만료하지 않는다. Owner는 같은 활성 링크를 언제든 다시 복사할 수 있고, 명시적으로 재발급하면 이전 링크가 무효가 된다. 유효한 링크 보유자는 참여 전 공간 이름만 볼 수 있고, 콘텐츠·멤버 목록은 Membership 전까지 비공개다.

## 실제 제품 구현과 검증

- 현재 제품에는 로그인·내 공간·공간 생성·Private Space 접근·초대 참여와 Kakao 장소 검색·확인·저장·목록·상세, 멤버의 추가 추천과 직접 등록이 연결됐다. 장소 상세는 위치 지도, 출처, 추천한 멤버와 사용자별 추천 상태를 표시한다. 공간 지도 전환·글·댓글·제거·복구는 아직 구현되지 않았다.
- Prisma 7.10.0과 Better Auth 1.7.3을 정확히 고정했다. 로컬 DB는 Docker PostgreSQL 18.4를 사용한다.
- Better Auth core와 제품 ERD를 합친 첫 migration, 부분 unique·CHECK 제약과 rollback smoke test가 통과했다.
- Better Auth Runtime은 Prisma adapter와 Kakao provider를 사용하며 `/api/auth/[...all]`에 연결했다.
- Kakao 로그인·로그아웃 버튼은 FSD `features/auth`에 두고 같은 origin의 Better Auth route를 호출한다.
- 서버에서 Better Auth 세션을 조회해 비로그인 상태에는 로그인 화면, 로그인 상태에는 `내 공간`을 렌더링한다.
- Kakao OAuth callback, HttpOnly session cookie, User·Account·Session 저장과 로그아웃·재로그인을 실제 계정으로 검증했다.
- 서버 세션과 DB User를 대조하는 `requireCurrentUser` guard를 구현했다.
- 공간 이름을 trim 후 1~40자로 검증하고 Space와 OWNER Membership을 transaction으로 생성한다.
- 내 공간 목록, 공간 생성 화면과 Private Space 멤버 접근 검사를 연결했다.
- Owner가 요청할 때 활성 초대를 지연 발급하고, 같은 링크 재복사·폐기·재발급을 Space 행 잠금과 expected invitation ID로 보호한다.
- 초대 토큰은 `/invite#token` fragment로 전달해 주소에서 즉시 제거하고, 10분짜리 서명된 HttpOnly intent cookie로 로그인 전후 흐름을 잇는다.
- 활성 초대만 공간 이름을 보여주며, 기존 Member·Owner는 쓰기 없이 공간으로 이동한다. 취소된 Membership은 과거 Owner 권한을 복구하지 않고 Member로 멱등 재활성화한다.
- 초대 토큰은 invitation ID·space ID와 서버 master key로 재생성하고 DB에는 기존 SHA-256 hash만 저장한다. 링크 토큰과 intent 서명 키는 HKDF로 분리한다.
- Prisma schema 변경 없이 전체 제약, 공간 생성, 초대 반복 수락·재발급 PostgreSQL smoke test가 통과했다.
- 기존 부분 unique 인덱스로 Kakao Place를 upsert하고 새 SpacePlace와 추가자의 최초 추천을 한 transaction에 저장한다. 같은 공간의 활성 연결은 기존 상세로 이동하고 제거된 연결은 복구 필요로 분기한다.
- 장소 추가의 반복 요청·제거 상태·rollback PostgreSQL smoke test가 통과했다. schema·migration은 변경하지 않았다.
- 추가 추천은 활성 Membership과 SpacePlace를 확인하고 중복 요청을 멱등 처리한다. 새 추천과 `impactVersion` 증가는 같은 transaction에서 처리하며 schema·migration은 변경하지 않았다.
- 추가 추천의 사용자별 중복·제거 상태·rollback PostgreSQL smoke test가 통과했다. 실제 두 계정의 추천·권한 교차 검증은 아직 확인하지 않았다.
- 직접 등록은 검색어를 장소명에 미리 채우고 주소·지역 검색 및 0건 시 근처 장소 후보를 제공한다. 지도 핀 확인 후 USER Place·SpacePlace·최초 추천을 원자 저장하고 목록·상세에서 직접 등록 출처를 표시한다. 이름·좌표 자동 병합과 현재 위치 요청은 하지 않는다.
- 동일 폼의 등록 UUID를 Place PK로 사용해 재시도를 멱등 처리한다. 타 공간·등록자·출처 ID 재사용은 거부한다. 새로 연 폼은 별도 등록이며 schema·migration 변경은 없다. ADR-0004에 범위를 기록했다.
- 직접 등록 PostgreSQL 테스트에서 동시 요청·비멤버·취소 Membership·비활성 User·타 공간/등록자/출처 ID·제거 상태·추천 실패 rollback이 통과했다. 기존 장소 추가·추천·제약 smoke test도 통과했다.
- Node.js 24.18.1에서 `lint`, `check-types`, `fsd`, `pnpm test` 17개와 production Webpack build가 통과했다. `pnpm test`의 DB 테스트 1개는 기본 skip이며 `db:test-manual-place`로 별도 통과했다. FSD의 파일 감시 한도는 `CHOKIDAR_USEPOLLING=1`로 우회했다.
- 장소 추가 성공은 상세 이동 URL에서 읽어 도착한 화면에 3초 toast로 표시한다. 직접 등록의 실제 Kakao 검색·지도·360px 화면·성공 toast 브라우저 검증은 컴퓨터 제어 권한이 없어 미실행이다.
- 두 실제 계정의 추천 수·선택 상태·권한, 추천 성공 피드백 및 다른 탭 복귀 시 데이터 갱신은 미검증이다. TanStack Query는 설치하지 않았고 자동 재조회도 없다. 두 탭 검증 후 필요한 화면의 재조회 방식을 판단한다.
- 로컬 PostgreSQL에서 테스트 계정 하나의 Membership을 참여 취소한 상태는 유지했다. 해당 계정의 기존 상세 404는 사용자가 확인했으며 이 DB 상태는 Git에 포함되지 않는다.
- 사용성 프로토타입은 별도 형제 폴더에 보존하며 제품 구현 완료의 근거로 사용하지 않는다.

## 참고 프로토타입

로컬에 형제 폴더가 있다면 이 문서 기준 `../../gatgaga-prototype`에서 아래 흐름을 참고할 수 있다. 다른 PC에는 없을 수 있다.

- `/`: 데이터가 있는 Private Space
- `/start`: 내 공간에서 Private Space를 만들고 첫 장소를 추가하는 흐름
- 실제 Kakao 키워드 검색, 지도와 Marker가 동작한다.
- 장소 추가, 목록↔지도, 추천, 장소 글·댓글, 작성자 수정·삭제, 장소 제거·실행 취소를 조작할 수 있다.
- 데이터는 아직 메모리 상태이며 인증·DB·서버 권한은 구현되지 않았다.
- toast는 일반 성공 3초, 실행 취소가 있는 제거 성공 5초 후 자동 종료하도록 코드와 화면 명세에 반영했다.

## 현재 기준 문서

현행 문서 목록과 읽기 순서는 [`README.md`](README.md)를 따른다. 로컬의 별도 프로토타입 문서는 결정 배경 확인용이다.

## 다음 한 단계와 열린 결정

1. **다음 확인** — 사용자가 [QA 절차](qa/README.md)에 따라 직접 등록과 두 계정의 추천·권한을 검증한다. 각 문서에 실행 환경·코드 리비전·케이스 결과·결함을 남긴다. 기본 검증 외 지원 검증은 준비가 안 되면 미실행 사유를 기록하고, 보류 여부는 사용자가 판단한다. 2026-10-03 `pnpm test` 재실행은 17개 통과·DB 1개 기본 skip이며 브라우저 승인을 대신하지 않는다.
2. **승인 전 처리** — 실패 수정 후 관련 케이스를 재검증한다. 추천 성공 toast의 명세 차이, 탭 복귀 시 갱신 필요성, 지도 타일 실패와 브라우저 뒤로가기는 QA 문서에서 확인한다. 실제 결과와 사용자 결정 없이 완료로 처리하지 않는다.
3. **승인 후 다음 구현** — 확정된 구현 순서에 따라 공간 목록·지도 전환을 구현한다. 이후에도 기능 커밋에 QA 문서를 포함하고 사용자 승인 후 다음 기능으로 진행한다. 공간 나가기는 PRD의 P1 범위를 유지한다.
4. Alpha 배포 전 별도 실제 계정으로 가입·초대·권한 흐름을 교차 검증한다. 초대 master key와 Production cookie 설정도 배포 환경에서 확인한다.

완료한 데이터 기반:

- `compose.yaml`: PostgreSQL 18.4와 영속 volume
- `prisma/schema.prisma`: Better Auth core 4개 + 제품 8개 모델
- `prisma/migrations/`: 첫 migration·Better Auth Account 정합화 migration과 DB 무결성 제약
- `prisma/tests/constraints-smoke.sql`: 실제 PostgreSQL 제약 회귀 검증
- `prisma/tests/create-space-transaction-smoke.sql`: Space·Owner 원자 생성과 rollback 검증
- `prisma/tests/invitation-transaction-smoke.sql`: 반복 수락의 단일 Membership과 초대 재발급 무결성 검증
- `prisma/tests/add-place-transaction-smoke.sql`: Kakao Place·SpacePlace 중복, 제거 상태와 최초 추천 rollback 검증
- `prisma/tests/recommend-place-transaction-smoke.sql`: 추가 추천의 중복·제거 상태와 impactVersion rollback 검증
- `prisma/tests/manual-place.test.mjs`: 실제 직접 등록 트랜잭션의 동시 재시도·권한·격리·제거·rollback 검증. `pnpm test`에서는 DB 없이 skip하고 `pnpm db:test-manual-place`로 로컬 PostgreSQL에서 실행한다.

## 작업 목적

이 프로젝트는 사용자 가치 검증과 함께 `백엔드까지 가능한 프론트엔드 개발자`로 역량을 넓히는 학습 프로젝트다. AI 결과를 그대로 수용하지 않고 공식 문서, 타입, 테스트, DB 제약과 운영 지표로 검증한다.
