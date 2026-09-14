# 같가가

`같이 가요, 가요`에서 출발한 이름입니다. 여러 사람이 하나의 공간에 장소를 함께 모으고, 장소마다 추천과 이야기를 이어가는 모바일 우선 서비스입니다.

## 기술 기준

- Node.js 24.18.1
- Next.js 16.3.3 Active LTS, App Router와 Turbopack
- React 19.2, TypeScript strict, Tailwind CSS 4
- Feature-Sliced Design와 Steiger
- Prisma 7.10.0, PostgreSQL 18.4(local)·Neon(production)
- Better Auth 1.7.3·Kakao 로그인과 Vercel

## 실행

```bash
nvm use
corepack pnpm install
corepack pnpm db:up
corepack pnpm db:migrate
corepack pnpm dev
```

`db:down`은 컨테이너만 종료하고 로컬 DB volume은 보존합니다.

## 품질 검사

```bash
corepack pnpm verify
corepack pnpm db:validate
corepack pnpm db:test-constraints
```

## 문서

제품·UX·기술 기준은 [`docs/README.md`](./docs/README.md)에서 시작합니다.

환경변수는 `.env.example`을 기준으로 `.env.local`에만 저장합니다. 실제 값은 커밋하지 않습니다.
