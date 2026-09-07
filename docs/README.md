# 같가가 문서 시작점

- 최종 업데이트: 2026-09-07
- 현재 단계: **Better Auth Runtime 완료 → Kakao 실제 계정 OAuth 검증**

## 지금 읽을 문서

현행 제품·디자인·개발 결정은 아래 문서를 기준으로 사용한다.

| 순서 | 문서 | 역할 |
| --- | --- | --- |
| 1 | [`product/prd-v1.0.md`](product/prd-v1.0.md) | 무엇을 왜 만들고 어디까지 만들지 |
| 2 | [`product/user-flow-v1.0.md`](product/user-flow-v1.0.md) | 사용자가 기능을 밟는 순서와 기술 착수 게이트 |
| 3 | [`design/screen-spec-v1.0.md`](design/screen-spec-v1.0.md) | 화면별 정보·행동·상태와 Figma 기준 |
| 4 | [`development/technical-design-v1.0.md`](development/technical-design-v1.0.md) | FSD·서버·DB·지도·배포 구조 |
| 5 | [`adr/0002-authentication-with-better-auth.md`](adr/0002-authentication-with-better-auth.md) | Better Auth·Kakao 인증 결정과 설정 시점 |
| 6 | [`development/erd-v0.1.md`](development/erd-v0.1.md) | P0 관계·제약·동시성의 데이터 기준 |

새로운 결정은 먼저 담당 문서에 반영한다. 내용이 충돌하면 `PRD → 사용자 플로우 → 화면 명세 → ADR·기술 설계 → ERD` 순서로 제품 의도를 판단하고, 구현 제약으로 제품 동작이 달라져야 하면 PRD부터 함께 수정한다.

## 현재 작업 순서

```text
PRD v1.0 기준선 완료
→ 사용자 플로우·화면 명세 기준선 완료
→ Figma·Next.js 프로토타입으로 핵심 흐름 검토
→ PRD·사용자 플로우·화면 명세 v1.0 확정
→ 실제 제품 저장소 초기화와 기술 설계 승인
→ Better Auth·Kakao ADR와 ERD 확정
→ Docker PostgreSQL·Prisma·첫 migration 완료
→ Better Auth Runtime·Next.js auth route 구현 완료
→ Kakao 설정·실제 계정 인증과 DB 저장 검증
→ Alpha 전 지인 1명 사용성 파일럿
```

현재 `gatgaga` 폴더가 실제 제품 저장소다. 사용성 검증용 UI 프로토타입은 형제 폴더 `../gatgaga-prototype`에 읽기 전용으로 보존하고, 확정된 토큰과 UI 패턴만 선별 이식한다.

## 핸드오프

다른 PC나 새 작업에서 이어갈 때는 [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)와 위 현행 문서를 전달한다.

## 과거 문서

이전 Product Brief, PRD v0.1, IA, 와이어프레임과 프로토타입 메모는 형제 폴더 `../../gatgaga-prototype/docs/archive`에 보존한다. 결정 배경을 확인할 때만 사용하며 현행 디자인이나 구현의 기준으로 사용하지 않는다.
