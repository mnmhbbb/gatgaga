# ADR-0002: Better Auth와 Kakao 로그인 사용

- 상태: **Accepted**
- 결정일: 2026-09-06
- 관련 문서: [`../product/prd-v1.0.md`](../product/prd-v1.0.md), [`../development/technical-design-v1.0.md`](../development/technical-design-v1.0.md), [`../development/erd-v0.1.md`](../development/erd-v0.1.md)

## 배경

Private Alpha에는 초대 링크를 받은 사용자가 짧은 절차로 로그인하고 원래 초대 흐름으로 돌아와야 한다. 동시에 이 프로젝트는 다음 경험을 직접 다루는 것을 목표로 한다.

- OAuth callback과 세션 경계
- PostgreSQL에 저장되는 인증 데이터와 제품 데이터의 관계
- 서버의 Membership·객체 권한 검사
- Prisma migration과 Vercel·Neon 운영

비밀번호 해싱, OAuth 프로토콜과 세션 암호화를 직접 구현하는 것은 제품 가치와 학습 효율에 맞지 않는다. 반면 인증 SaaS와 별도 제품 DB를 함께 운영하면 사용자 동기화와 장애 경계가 하나 더 생긴다.

## 결정

### 구성

- Next.js 애플리케이션 안에 **Better Auth**를 구성한다.
- P0 로그인 Provider는 **Kakao 하나**만 사용한다.
- Better Auth Prisma adapter를 사용하고 인증 테이블과 제품 테이블을 같은 PostgreSQL에 둔다.
- 로컬은 Docker PostgreSQL, 운영은 Neon PostgreSQL을 사용한다.
- 비밀번호, 이메일 로그인, OTP와 Better Auth Organizations plugin은 P0에 넣지 않는다.
- P1의 Google 로그인은 사용자 요구가 확인된 뒤 명시적 계정 연결 UX와 함께 추가한다.

[Vercel의 Better Auth 인수](https://vercel.com/blog/vercel-acquires-better-auth)는 유지보수 신호로 참고했지만 선택의 단독 근거는 아니다. 같은 PostgreSQL·Prisma 안에서 인증 데이터의 구조와 운영을 직접 학습하면서도 OAuth·세션 보안 구현은 검증된 라이브러리에 맡길 수 있다는 점을 주된 근거로 삼는다.

### 데이터 소유권

```text
auth 모듈(Better Auth 소유)
  User ─ Account
    └── Session
  Verification

제품 모듈(같가가 소유)
  User를 FK로 참조하는 SpaceMembership, SpaceInvitation,
  Place, SpacePlace, PlaceRecommendation, Post, Comment
```

- `User`는 서비스 내부의 유일한 사용자 루트다.
- `Account`가 `Kakao subject → User` 연결을 담당하므로 별도 `ExternalIdentity` 테이블을 만들지 않는다.
- P0에는 별도 제품 User·Profile 테이블을 만들지 않는다. Better Auth `User.id`를 제품 actor ID로 사용한다.
- 운영상 접근을 즉시 차단할 `User.disabledAt`만 Better Auth `additionalFields`로 추가하고 `input: false`, `returned: false`로 설정한다.
- Better Auth CLI가 생성한 schema diff는 그대로 적용하지 않고 ERD와 기존 제품 관계를 함께 검토한다.
- 실제 migration 생성과 적용은 Prisma CLI가 담당한다.

### ID와 계정 연결

- 인증·제품 테이블 ID는 PostgreSQL UUID로 통일한다.
- Better Auth에는 `advanced.database.generateId: "uuid"`를 명시한다.
- Account identity는 `(issuer, accountId)` unique로 식별한다.
- `account.identityStrategy: "provider-id"`를 명시해 Provider namespace를 결정적으로 유지한다.
- P0는 account linking을 비활성화하고 `disableImplicitLinking: true`를 명시해 같은 이메일만 보고 계정을 자동 연결하지 않는다.
- P1에서 Google을 추가할 때 로그인된 사용자가 명시적으로 연결하는 화면과 복구 정책을 먼저 만든다.

### 세션과 토큰

- P0는 PostgreSQL 기반 세션을 사용하고 cookie cache와 Redis secondary storage를 추가하지 않는다.
- Production cookie의 `Secure`, `HttpOnly`, `SameSite=Lax`와 trusted origin을 배포 E2E에서 확인한다.
- Provider token은 `encryptOAuthTokens: true`로 암호화하고 브라우저 응답·애플리케이션 로그에 노출하지 않는다.
- Kakao API를 로그인 외 목적으로 사용하지 않으며 최소 scope만 요청한다.
- 모든 Private 요청은 유효한 세션뿐 아니라 `User.disabledAt IS NULL`과 활성 Membership을 서버에서 다시 검사한다.

### Kakao 사용자 정보

- Better Auth의 Kakao 기본 profile에 필요한 `account_email`, `profile_nickname`, `profile_image`만 사용한다.
- Kakao 앱을 개인 개발자 비즈 앱으로 전환하고 이메일 동의 항목을 필수로 설정한다.
- 이메일이 없는 사용자를 위해 가짜 이메일을 만들지 않는다. 인증 구현 첫 스파이크에서 실제 계정 2개로 이메일 반환·동의 거부를 검증하고, 필수 이메일을 받지 못하면 이유와 재시도 방법을 안내하고 가입을 중단한다.
- 이메일은 연락·표시용 속성이며 제품 권한의 식별자로 사용하지 않는다. 권한은 내부 `User.id`로 판단한다.

### 초대 후 로그인 복귀

```text
/invite/[rawToken]
→ 서버에서 token hash 검증
→ invitationId를 담은 10분짜리 서명된 HttpOnly intent cookie 설정
→ 원본 token이 없는 /invite/continue로 이동
→ Kakao 로그인
→ /invite/continue 복귀
→ 로그인 계정과 공간 확인
→ 사용자가 참여하기 선택
→ Membership 멱등 생성
```

- 원본 초대 토큰을 OAuth callback URL, 로그, 분석 이벤트와 DB에 저장하지 않는다.
- callback URL은 내부 상대 경로 allowlist만 허용해 open redirect를 막는다.
- 로그인 성공만으로 초대를 자동 수락하지 않으며 GET 요청으로 Membership을 만들지 않는다.
- intent cookie가 만료되어도 원본 초대 링크에서 다시 시작할 수 있다.

## Kakao 설정 시점

키와 활성화는 **ERD 단계가 아니라 첫 인증 세로 기능 구현을 시작할 때** 설정한다. 단, 인증 구현의 첫 작업으로 완료해야 하는 출시 차단 스파이크다. 현재는 어떤 값이 필요한지만 고정한다. 이렇게 하면 실제 local·staging·production callback URL을 기준으로 한 번에 검증할 수 있다.

### 구현 시작 시 설정할 것

1. 현재 지도에 사용 중인 Kakao Developers 앱을 같가가 서비스 앱으로 재사용한다.
2. 개인 개발자 비즈 앱 전환과 본인 인증을 완료한다.
3. Kakao Login과 `account_email`, nickname, profile image 동의 항목을 활성화하고 Client Secret을 발급·활성화한다.
4. local callback `http://localhost:3000/api/auth/callback/kakao`와 확정된 production callback을 등록한다.
5. 본인 외 테스트 계정 1개를 더 등록해 이메일 제공·거부·재로그인을 확인한다.
6. 아래 서버 환경 변수를 local과 Vercel 환경별로 저장한다.

```text
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
KAKAO_CLIENT_ID=       # Kakao REST API 키
KAKAO_CLIENT_SECRET=   # 서버 전용 Client Secret
```

지도용 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`는 JavaScript 키라서 로그인용 REST API 키와 다르다. Client Secret에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

임의로 바뀌는 Vercel Preview URL에는 Kakao OAuth E2E를 연결하지 않는다. OAuth 검증이 필요해지면 고정 staging 도메인을 만들고 별도 callback과 DB를 사용한다. 일반 PR Preview에서는 Mock session 또는 인증을 제외한 검증만 수행한다.

## 운영·삭제 정책

- P0에는 셀프서비스 회원 탈퇴 UI를 넣지 않는다.
- 삭제 요청이 오면 `User.disabledAt`을 기록하고 모든 Session을 폐기해 접근부터 차단한다.
- Owner Space의 이전 또는 삭제, 콘텐츠 익명화 여부를 사용자와 확인한 뒤 Account와 User를 정리한다.
- 제품 FK가 남은 상태에서 Better Auth User를 먼저 물리 삭제하지 않는다.
- Public 출시 전에는 개인정보 처리방침, 문의·삭제 요청 경로와 자동 정리 절차를 별도 승인한다.

## 대안과 기각 이유

| 대안 | 기각 이유 |
| --- | --- |
| Supabase Auth + Neon | 가능하지만 인증 DB와 제품 DB의 사용자 동기화·장애·운영 경계가 추가됨 |
| Clerk + Google | 빠른 UI는 장점이나 Kakao 우선 사용자 흐름과 맞지 않고 인증 데이터가 외부 SaaS에 남음 |
| Auth.js | 충분히 검증된 선택이지만 현재 목표에서는 Better Auth의 명시적 DB schema·Prisma adapter를 직접 다루는 경험을 우선함 |
| 직접 OAuth·세션 구현 | 보안 위험과 구현 범위가 제품 학습 목표에 비해 큼 |
| Kakao + Google 동시 출시 | 계정 중복·연결·복구 정책과 브라우저 테스트 조합이 P0 범위를 불필요하게 넓힘 |

## 결과와 재검토 조건

### 얻는 것

- 하나의 PostgreSQL transaction·backup·migration 경계
- 인증과 도메인 FK를 실제 SQL로 설명할 수 있는 구조
- 별도 사용자 동기화 없이 일관된 내부 `User.id`
- Provider 추가가 `Account`와 명시적 연결 정책으로 확장되는 경로

### 감수하는 것

- 인증 SaaS보다 schema migration, 세션 정리와 운영 대응 책임이 커진다.
- Better Auth 버전 변경 시 generated schema와 migration diff를 검토해야 한다.
- Kakao 이메일 동의와 callback 설정을 직접 운영해야 한다.

다음 조건에서 ADR을 다시 연다.

- Kakao 이메일 필수 동의가 실제 Alpha 사용자를 막는다.
- RN 네이티브 로그인이 필요해져 Web OAuth callback만으로 부족하다.
- 세션 조회량이 Neon 비용·지연 목표를 넘어서 cookie cache나 secondary storage가 필요하다.
- Google 등 두 번째 Provider 요구가 확인돼 계정 연결·복구 UX를 설계한다.

## 구현 전 공식 문서

- Better Auth Kakao: <https://better-auth.com/docs/authentication/kakao>
- Better Auth Next.js: <https://better-auth.com/docs/integrations/next>
- Better Auth Prisma adapter: <https://better-auth.com/docs/adapters/prisma>
- Better Auth database: <https://better-auth.com/docs/concepts/database>
- Better Auth security: <https://better-auth.com/docs/reference/security>
- Kakao Login REST API: <https://developers.kakao.com/docs/ko/kakaologin/rest-api>
- Kakao 앱 설정: <https://developers.kakao.com/docs/ko/app-setting/app>

버전·Provider scope·Kakao 정책은 변경될 수 있으므로 설치와 배포 직전에 다시 확인한다.
