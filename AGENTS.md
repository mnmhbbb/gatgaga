<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 저장소 작업 규칙

- 작업을 시작하기 전에 `docs/README.md`에서 현행 문서와 우선순위를 확인하고, 기존 사용자 변경을 임의로 섞거나 되돌리지 않는다.
- 제품 동작이나 수용 기준이 달라지면 코드만 바꾸지 않고 PRD, 사용자 플로우와 화면 명세를 먼저 또는 같은 작업에서 현행화한다.
- 장기간 영향을 주는 기술 선택과 기존 결정의 변경은 `docs/adr/`에 배경, 결정, 대안, 결과와 재검토 조건을 기록한다.
- DB 관계·제약·권한·트랜잭션·배포 구조가 바뀌면 기술 설계, ERD, Prisma schema와 migration의 정합성을 함께 확인한다.
- 하나의 기능 단위가 완료되면 `docs/README.md`와 `docs/PROJECT_CONTEXT.md`의 현재 단계와 다음 작업을 함께 갱신한다. 진행도 문서는 커밋별 일지가 아니라 작업 재개에 필요한 현재 사실만 유지한다.
- `src/`는 FSD 공개 API와 레이어 의존 방향을 지키고, 사용처 없는 레이어·Provider·상태 관리 추상화를 미리 만들지 않는다.
- `app/`의 Route Handler와 Server Action은 얇은 입출력 경계로 유지하고, 서버 권한·유스케이스·트랜잭션은 `server/modules`에 둔다.
- Private 데이터는 UI 노출 여부와 별개로 서버에서 세션, 비활성 사용자, 활성 Membership과 객체 소유권을 다시 검사한다.
- Prisma schema 변경은 migration과 실제 PostgreSQL 제약 검증 없이 완료로 간주하지 않는다.
- 함수와 파일은 하나의 명확한 책임을 갖게 하고, 중복보다 잘못된 추상화를 경계하며 가독성·응집도·낮은 결합도를 우선한다.
- 저장소 고정 Node.js 버전을 적용한 뒤 변경 범위에 맞는 테스트를 실행한다. 기능 완료 전 최소 `lint`, `check-types`, `fsd`를 확인하고 Next.js·DB 변경에는 관련 build와 DB 검증을 추가한다.
- Git hook이 검증을 대신한다고 가정하지 않는다. hook 유무와 관계없이 커밋 전에 필요한 검증 결과를 직접 확인한다.
- 커밋 제목과 본문은 한국어로 작성한다.
- `feat: 기능 요약` 형식을 사용한다.
- 말머리는 `feat`, `fix`, `refactor`, `docs`, `chore`, `build`, `test`처럼 변경 성격에 맞게 유지한다.
- 요약은 `~한다` 문장형이 아니라 한국어 명사형으로 작성하고 마침표를 붙이지 않는다.
- 변경 이유, 사용자 영향, 권한·DB 처리나 검증 범위가 제목만으로 충분하지 않으면 본문에 한국어 목록으로 설명한다.
