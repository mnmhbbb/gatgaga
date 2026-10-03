# 같가가 문서 시작점

- 최종 업데이트: 2026-10-03

새 작업에서 이어갈 때는 먼저 [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)로 **제품 코드의 현재 구현·다음 작업·열린 결정**을 확인한다. 이 문서는 현행 문서의 목차이며, 진행 상태를 중복 기록하지 않는다.

## 지금 읽을 문서

현행 제품·디자인·개발 결정은 아래 문서를 기준으로 사용한다.

| 순서 | 문서 | 역할 |
| --- | --- | --- |
| 1 | [`product/prd-v1.0.md`](product/prd-v1.0.md) | 무엇을 왜 만들고 어디까지 만들지 |
| 2 | [`product/user-flow-v1.0.md`](product/user-flow-v1.0.md) | 사용자가 기능을 밟는 순서와 기술 착수 게이트 |
| 3 | [`design/screen-spec-v1.0.md`](design/screen-spec-v1.0.md) | 화면별 정보·행동·상태와 Figma 기준 |
| 4 | [`development/technical-design-v1.0.md`](development/technical-design-v1.0.md) | FSD·서버·DB·지도·배포 구조 |
| 5 | [`adr/0001-prototype-and-product-boundary.md`](adr/0001-prototype-and-product-boundary.md) | 프로토타입과 제품 저장소의 경계 결정 |
| 6 | [`adr/0002-authentication-with-better-auth.md`](adr/0002-authentication-with-better-auth.md) | Better Auth·Kakao 인증 결정과 설정 시점 |
| 7 | [`adr/0003-invitation-link-lifecycle.md`](adr/0003-invitation-link-lifecycle.md) | 초대 링크의 재복사·재발급과 저장 방식 결정 |
| 8 | [`development/erd-v0.1.md`](development/erd-v0.1.md) | P0 관계·제약·동시성의 데이터 기준 |
| 9 | [`adr/0004-manual-place-identity.md`](adr/0004-manual-place-identity.md) | 직접 등록 장소의 식별자·재시도와 공간 격리 |
| 10 | [`qa/README.md`](qa/README.md) | 기능별 사용자 검증 절차·시나리오·승인 기록 |

새로운 결정은 먼저 담당 문서에 반영한다. 내용이 충돌하면 `PRD → 사용자 플로우 → 화면 명세 → ADR·기술 설계 → ERD` 순서로 제품 의도를 판단하고, 구현 제약으로 제품 동작이 달라져야 하면 PRD부터 함께 수정한다. 구현 완료 여부는 문서의 목표·프로토타입 상태가 아니라 실제 제품 코드와 검증 결과를 기준으로 확인한다.

## 진행 상태 관리

- 프로젝트 전체의 현재 단계, 다음 작업, 막힌 결정은 `PROJECT_CONTEXT.md` 한곳에 요약한다. 개별 문서에는 해당 영역의 검증 사실을 남길 수 있다.
- PRD·플로우·화면 명세는 제품 목표와 수용 기준이다. 화면 명세의 프로토타입 상태를 실제 제품 구현 완료로 해석하지 않는다.
- 기술 설계·ERD는 구현과 검증이 끝난 부분과 도입 전 계획을 구분한다. ADR은 당시 결정과 근거를 보존한다.
- 기능이 바뀌면 영향을 받는 문서를 같은 작업에서 갱신하고, 관련 없는 문서의 날짜만 일괄 변경하지 않는다.
- 기능 커밋 후 사용자가 QA 시나리오를 검증하고 승인하면 다음 기능으로 진행한다. 현재 승인 대기 문서는 `PROJECT_CONTEXT.md`에서 찾고, 상세 결과는 해당 `qa/` 문서에 남긴다.

## 핸드오프

새 대화에서는 이 저장소에서 "프로젝트 이어서 진행해줘"라고 요청하면 된다. "세션 정리해줘"라고 요청하면 작업 상태와 검증 결과를 확인해 [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)에 완료/미완료와 다음 한 단계를 남긴다. 진행 중인 변경은 `git status`로 별도 확인하며, 정리 요청만으로 커밋하지 않는다.

## 과거 문서

이전 Product Brief, PRD v0.1, IA, 와이어프레임과 프로토타입 메모는 로컬에 형제 폴더가 있다면 `../../gatgaga-prototype/docs/archive`에서 확인할 수 있다. 선택적 결정 배경 자료이며 현행 디자인이나 제품 구현의 기준으로 사용하지 않는다.
