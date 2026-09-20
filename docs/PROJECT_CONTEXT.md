# 같가가 프로젝트 핸드오프

- 최종 업데이트: 2026-09-20
- 현재 단계: 초대 링크 발급·재복사·폐기·재발급과 로그인 복귀·멱등 수락 완료
- 다음 한 단계: Place·SpacePlace·최초 Recommendation 원자 저장 세로 기능 구현
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

- 현재 제품에는 로그인·내 공간·공간 생성·Private Space 접근과 초대 참여까지 연결됐다. 장소·지도·추천·글·댓글은 아직 제품에 구현되지 않았다.
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
- `lint`, `check-types`, `fsd`, 단위 테스트와 Next.js production Webpack build가 통과했다.
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

1. **다음 구현** — Kakao 장소 후보를 `Place`로 upsert하고 `SpacePlace`와 추가자의 최초 `PlaceRecommendation`을 한 transaction에서 저장한다. 같은 공간의 같은 장소는 기존 상세로, 제거된 연결은 자동 복구 대신 `RESTORE_REQUIRED`로 분기한다.
2. Alpha 배포 전 별도 실제 계정으로 가입·초대·권한 흐름을 교차 검증한다. 초대 master key와 Production cookie 설정도 배포 환경에서 확인한다.

완료한 데이터 기반:

- `compose.yaml`: PostgreSQL 18.4와 영속 volume
- `prisma/schema.prisma`: Better Auth core 4개 + 제품 8개 모델
- `prisma/migrations/`: 첫 migration·Better Auth Account 정합화 migration과 DB 무결성 제약
- `prisma/tests/constraints-smoke.sql`: 실제 PostgreSQL 제약 회귀 검증
- `prisma/tests/create-space-transaction-smoke.sql`: Space·Owner 원자 생성과 rollback 검증
- `prisma/tests/invitation-transaction-smoke.sql`: 반복 수락의 단일 Membership과 초대 재발급 무결성 검증

## 작업 목적

이 프로젝트는 사용자 가치 검증과 함께 `백엔드까지 가능한 프론트엔드 개발자`로 역량을 넓히는 학습 프로젝트다. AI 결과를 그대로 수용하지 않고 공식 문서, 타입, 테스트, DB 제약과 운영 지표로 검증한다.
