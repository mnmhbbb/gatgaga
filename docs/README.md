# 같가가 문서 시작점

- 최종 업데이트: 2026-09-06
- 현재 단계: **실제 개발 저장소 초기화 완료 → 기술 ADR 확정**

## 지금 읽을 문서

현행 제품·디자인·개발 결정은 아래 네 문서만 기준으로 사용한다.

| 순서 | 문서 | 역할 |
| --- | --- | --- |
| 1 | [`product/prd-v1.0.md`](product/prd-v1.0.md) | 무엇을 왜 만들고 어디까지 만들지 |
| 2 | [`product/user-flow-v1.0.md`](product/user-flow-v1.0.md) | 사용자가 기능을 밟는 순서와 기술 착수 게이트 |
| 3 | [`design/screen-spec-v1.0.md`](design/screen-spec-v1.0.md) | 화면별 정보·행동·상태와 Figma 기준 |
| 4 | [`development/technical-design-v1.0.md`](development/technical-design-v1.0.md) | FSD·서버·DB·지도·배포 구조 |

새로운 결정은 먼저 네 문서 중 담당 문서에 반영한다. 내용이 충돌하면 `PRD → 사용자 플로우 → 화면 명세 → 기술 설계` 순서로 제품 의도를 판단하고, 구현 제약으로 제품 동작이 달라져야 하면 PRD부터 함께 수정한다.

## 현재 작업 순서

```text
PRD v1.0 기준선 완료
→ 사용자 플로우·화면 명세 기준선 완료
→ Figma·Next.js 프로토타입으로 핵심 흐름 검토
→ PRD·사용자 플로우·화면 명세 v1.0 확정
→ 실제 제품 저장소 초기화와 기술 설계 승인
→ 인증·DB·서버 권한 구현
→ Alpha 전 지인 1명 사용성 파일럿
```

현재 `gatgaga` 폴더는 사용성 검증용 UI 프로토타입이며 실제 제품 코드로 간주하지 않는다. Figma와 문서를 확정한 뒤 프로토타입을 보존하고, 실제 제품 저장소를 새로 초기화해 필요한 UI만 선별 이식한다.

## 핸드오프

다른 PC나 새 작업에서 이어갈 때는 [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)와 위 네 문서를 전달한다.

## 과거 문서

이전 Product Brief, PRD v0.1, IA, 와이어프레임과 프로토타입 메모는 형제 폴더 `../../gatgaga-prototype/docs/archive`에 보존한다. 결정 배경을 확인할 때만 사용하며 현행 디자인이나 구현의 기준으로 사용하지 않는다.
