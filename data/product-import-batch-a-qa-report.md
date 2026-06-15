# Product Import Batch A QA Report

생성일: 2026-06-15

## 범위

Batch A만 진행했다.

진행한 것:

- 기존 Item / Manual Code 안에서 흡수 가능한 제품 5개를 `READY`로 재분류
- `data/staging-product-import.json` 상태 갱신
- `app-data.generated.js` 생성
- `index.generated-preview.html` 생성
- 실제 제품 슬롯을 클릭 가능한 Product Detail로 연결
- 검색을 복합어 토큰 매칭 방식으로 보강

진행하지 않은 것:

- `SK-MK`, `BD-BC`, `SL-LB`, `BD-WR` 신규 Item / Manual 생성 안 함
- `app-data.js` 직접 수정 안 함
- 신규 Product를 원본 데이터에 병합하지 않음

## 상태 요약

| Status | Count |
| --- | ---: |
| READY | 5 |
| REVIEW | 0 |
| NEEDS_ITEM | 5 |
| PENDING | 0 |
| NEEDS_MANUAL | 0 |
| SOURCE_CONFLICT | 0 |

## 실제 반영된 샘플 제품

| Product | Product Group | Item Code | Manual Code |
| --- | --- | --- | --- |
| 비레디 블루 수분 선크림 SPF50+/PA++++ | 데일리 선크림 | `SR26-SK-SS-C1` | `SR26-SK-SS-M1` |
| 쏘내추럴 파우더포룸 피치 데오 팩트 | 체취 / 데오 관리 | `SR26-GR-FR-C1` | `SR26-GR-FR-M1` |
| 솔랩 프리미엄 탈모/두피진정 두피앰플 | 두피케어 / 두피 세럼 | `SR26-SK-HR-C1` | `SR26-SK-HR-M1` |
| 케라스타즈 제네시스 옴므 세럼 | 두피케어 / 두피 세럼 | `SR26-SK-HR-C1` | `SR26-SK-HR-M1` |
| 풀리오 목어깨 마사지기 | 회복 디바이스 / 목어깨 마사지 | `SR26-BD-RC-C1` | `SR26-BD-RC-M1` |

실제 제품 수: 5개

실제 Product Group 수: 4개

## 로컬 구조 QA

| 항목 | 결과 |
| --- | --- |
| 실제 제품 수 | 5 |
| 실제 Product Group 수 | 4 |
| 누락 item 참조 | 0 |
| 중복 product code | 0 |
| `staging-product-import.json` JSON 유효성 | OK |
| `product-import-ready-batch-plan.json` JSON 유효성 | OK |

## 브라우저 QA

검증 URL:

`http://localhost:8057/index.generated-preview.html`

| 화면 | 확인 항목 | 결과 |
| --- | --- | --- |
| Product Encyclopedia | Product Group 화면 진입 | PASS |
| Product Group Detail | `데일리 선크림` drawer 열림 | PASS |
| Product Group Detail | mock slot은 `제품 연결 대기`로 유지 | PASS |
| Product Group Detail | 실제 제품 슬롯이 버튼으로 표시 | PASS |
| Product Detail | 실제 제품명 표시 | PASS |
| Product Detail | 이미지 렌더링 | PASS |
| Product Detail | productLink 표시 | PASS |
| Product Detail | 관련 Item 표시 | PASS |
| Product Detail | 관련 Routine 표시 | PASS |
| Item Detail | 관련 Manual 표시 | PASS |
| Item Detail | 관련 Product Group 표시 | PASS |
| Manual Detail | 정규화된 데일리 선크림 본문 표시 | PASS |
| Manual Detail | 예전 `상처 후 색소침착` 본문 미노출 | PASS |
| Search | `비레디 선크림` 검색 결과 1개 | PASS |
| Search | 개별 P code가 독립 카드처럼 검색을 지배하지 않음 | PASS |

## 발견된 문제와 처리

1. 실제 제품 슬롯이 처음에는 클릭되지 않았다.
   - 처리: mock slot은 그대로 두고, 실제 제품 slot만 `data-open-type="product"` 버튼으로 렌더링하도록 최소 수정.

2. Product Detail 이미지 확인이 불가능했다.
   - 처리: 실제 제품 slot 클릭 시 Product Detail로 열리게 하여 `imageUrl` 렌더링 확인.

3. Manual 제목만 바뀌고 본문에는 예전 상처 색소침착 내용이 남았다.
   - 처리: generated preview에서 Batch A manual block까지 정규화.

4. `비레디 선크림` 복합 검색어가 0개로 나왔다.
   - 처리: 검색을 전체 문자열 포함 방식에서 토큰별 모두 포함 방식으로 보강.

## Batch B 필요 여부

필요하다.

Batch A로는 기존 코드에 흡수 가능한 제품만 처리했다. 아래 제품군은 아직 실제 제품을 넣을 수 없다.

- `SK-MK`: 남성 톤 보정 / 부분 커버
- `BD-BC`: 바디워시 / 바디 클렌징
- `SL-LB`: 수면 안대 / 빛 차단
- `BD-WR`: 착장 / 바디 리스크 관리

다음 단계는 Batch B 신규 Item / Manual 생성안을 승인한 뒤, generated data 후보로만 반영하는 것이다.
