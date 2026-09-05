# 같가가 프로젝트 핸드오프

- 최종 업데이트: 2026-09-06
- 현재 단계: PRD·사용자 플로우·화면 명세 v1.0 확정
- 다음 작업: 인증 Provider ADR, Docker PostgreSQL·Prisma 데이터 기반 구축
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
- 관리형 인증을 사용하고 Membership·Invitation·권한은 직접 구현한다.
- 현재 저장소는 사용성 검증용 프로토타입으로 보존하고 실제 제품 저장소는 기술 착수 시 새로 초기화한다.

## 현재 프로토타입

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

이전 문서는 `archive/`에 있으며 결정 이력 확인용이다.

## 다음 순서

1. 화면 명세의 Figma 페이지 구조대로 디자인 파일을 정리한다.
2. 핵심 성공 흐름과 장소 제거 예외 흐름을 연결한다.
3. 지인 1명에게 15~20분 사용성 파일럿을 진행한다.
4. 큰 UX 문제만 수정한다.
5. 인증 Provider와 DB 세부안을 결정하고 실제 데이터 개발을 시작한다.

## 작업 목적

이 프로젝트는 사용자 가치 검증과 함께 `백엔드까지 가능한 프론트엔드 개발자`로 역량을 넓히는 학습 프로젝트다. AI 결과를 그대로 수용하지 않고 공식 문서, 타입, 테스트, DB 제약과 운영 지표로 검증한다.
