# SERKAN Team Realtime 공유 메모

## 목적

회의 중 팀원이 같은 SERKAN 프로토타입을 보면서 아래 내용을 바로 공유할 수 있게 하는 MVP입니다.

- 각자 보고 있는 항목 기준 코멘트 작성
- 상세 페이지 열람 활동
- 루틴 체크 / 해제 활동
- Daily / Weekly / Monthly / Seasonal 루틴 체크박스 상태 실시간 반영
- 항목별 검수 상태
- 항목별 팀 코멘트
- 커스텀 루틴 추가 / 삭제 공유

이 기능은 공동 브라우징이 아닙니다. 다른 사람이 상세 페이지를 열어도 내 화면이 따라 이동하지 않고, 체크/코멘트/검수/추가 루틴 같은 변경사항만 공유됩니다.

## 기준 파일

- `index.html`
- `index.generated-preview.html`
- `serkan-realtime-config.js`
- `serkan-realtime-sync.js`

## 데이터 저장 방식

기존 Supabase 테이블 `club_serkan_state`를 재사용합니다.

- `client_id`: `serkan-dashboard`
- `storage_key`: `SERKAN_TEAM_SHARED_STATE`

따라서 새 테이블을 만들지 않아도 됩니다. 단, Supabase에서 `club_serkan_state` 테이블과 Realtime publication이 활성화되어 있어야 합니다.

## 사용 방법

1. `index.generated-preview.html` 또는 `index.html`을 서버로 엽니다.
2. 오른쪽 아래 `팀 공유` 버튼을 누릅니다.
3. 팀원 이름을 입력합니다.
4. 루틴 체크박스를 누르면 다른 팀원 화면의 같은 체크박스도 같은 상태로 바뀝니다.
5. 항목을 열고 `검수 필요`, `승인`, `보류`, `수정 필요` 중 하나를 선택합니다.
6. 코멘트를 남기면 다른 브라우저에도 공유됩니다.

## 주의

- 이 기능은 운영용 인증 시스템이 아니라 회의/검수용 MVP입니다.
- Supabase 연결이 안 되면 로컬 모드로 동작합니다.
- 원본 `app-data.js` 데이터 구조는 변경하지 않습니다.
- 다른 사람의 화면을 강제로 이동시키지 않습니다.
