# 같가가 프로젝트 핸드오프

- 최종 업데이트: 2026-09-09
- 현재 단계: Better Auth·Kakao OAuth 로그인과 서버 세션 기반 화면 분기 완료
- 다음 작업: 로그인한 사용자의 Space·Owner Membership 원자 생성
- 저장소: `/Users/mhbaek/dev/nextjs/gatgaga`

## 한 줄 정의

> 같가가는 여러 사람이 하나의 공간에 장소를 함께 모으고, 장소마다 추천과 이야기를 이어가는 서비스다.

`같가가`는 `같이 가요, 가요`에서 출발한 줄임말이다. 첫 검증은 2~5명의 지인이 Private Space에서 방문 후보 장소를 함께 수집하는 상황에 집중한다.

## 현재 핵심 결정

- 첫 출시는 Private Alpha다.
- 클라이언트는 모바일 우선 PWA다.
- 장소 목록이 Space의 기본 화면이고 지도는 같은 데이터의 전환 보기다.
- 장소 저장, 추천, 작성자 소유 장소 글과 평면 댓글을 제공한다.
- 글과 댓글은 작성자만 수정·삭제한다.
- 장소 제거와 사용자 콘텐츠 삭제는 soft delete한다.
- 지도와 장소 검색은 Kakao Maps를 사용한다.
- 현재 위치 검색은 구현하지 않는다. 지역과 장소명을 함께 검색하고 결과 주소로 위치를 판단한다.
- Next.js App Router, TypeScript, FSD, Prisma, PostgreSQL, Neon과 Vercel을 사용한다.
- Better Auth·Kakao 로그인을 사용하고 인증·제품 테이블은 같은 PostgreSQL에 둔다. Membership·Invitation·객체 권한은 직접 구현한다.
- Prisma 7.10.0과 Better Auth 1.7.3을 정확히 고정했다. 로컬 DB는 Docker PostgreSQL 18.4를 사용한다.
- Better Auth core와 제품 ERD를 합친 첫 migration, 부분 unique·CHECK 제약과 rollback smoke test가 통과했다.
- Better Auth Runtime은 Prisma adapter와 Kakao provider를 사용하며 `/api/auth/[...all]`에 연결했다.
- Kakao 로그인·로그아웃 버튼은 FSD `features/auth`에 두고 같은 origin의 Better Auth route를 호출한다.
- 서버에서 Better Auth 세션을 조회해 비로그인 상태에는 로그인 화면, 로그인 상태에는 `내 공간`을 렌더링한다.
- Kakao OAuth callback, HttpOnly session cookie, User·Account·Session 저장과 로그아웃·재로그인을 실제 계정으로 검증했다.
- 현재 `gatgaga`가 실제 제품 저장소이고 사용성 프로토타입은 `../gatgaga-prototype`에 보존한다.

## 참고 프로토타입

아래 흐름은 형제 폴더 `../gatgaga-prototype`에서 확인한다.

- `/`: 데이터가 있는 Private Space
- `/start`: 내 공간에서 Private Space를 만들고 첫 장소를 추가하는 흐름
- 실제 Kakao 키워드 검색, 지도와 Marker가 동작한다.
- 장소 추가, 목록↔지도, 추천, 장소 글·댓글, 작성자 수정·삭제, 장소 제거·실행 취소를 조작할 수 있다.
- 데이터는 아직 메모리 상태이며 인증·DB·서버 권한은 구현되지 않았다.
- toast는 일반 성공 3초, 실행 취소가 있는 제거 성공 5초 후 자동 종료하도록 코드와 화면 명세에 반영했다.

## 현재 기준 문서

1. [`product/prd-v1.0.md`](product/prd-v1.0.md)
2. [`product/user-flow-v1.0.md`](product/user-flow-v1.0.md)
3. [`design/screen-spec-v1.0.md`](design/screen-spec-v1.0.md)
4. [`development/technical-design-v1.0.md`](development/technical-design-v1.0.md)
5. [`adr/0002-authentication-with-better-auth.md`](adr/0002-authentication-with-better-auth.md)
6. [`development/erd-v0.1.md`](development/erd-v0.1.md)

이전 문서는 `../../gatgaga-prototype/docs/archive`에 있으며 결정 이력 확인용이다.

## 다음 순서

1. 서버 세션과 `User.disabledAt`을 검사하는 인증 사용자 guard를 만든다.
2. 로그인한 User의 Space·Owner Membership 동시 생성 transaction을 구현한다.
3. 공간 생성 입력 검증과 성공·실패 통합 테스트를 추가한다.
4. 초대 복귀·수락 세로 기능을 구현한다.
5. Alpha 배포 전 별도 실제 계정으로 가입·초대·권한 흐름을 교차 검증한다.

완료한 데이터 기반:

- `compose.yaml`: PostgreSQL 18.4와 영속 volume
- `prisma/schema.prisma`: Better Auth core 4개 + 제품 8개 모델
- `prisma/migrations/20260906065619_init`: 첫 migration과 DB 무결성 제약
- `prisma/tests/constraints-smoke.sql`: 실제 PostgreSQL 제약 회귀 검증

## 작업 목적

이 프로젝트는 사용자 가치 검증과 함께 `백엔드까지 가능한 프론트엔드 개발자`로 역량을 넓히는 학습 프로젝트다. AI 결과를 그대로 수용하지 않고 공식 문서, 타입, 테스트, DB 제약과 운영 지표로 검증한다.
