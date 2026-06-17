# Product Import Batch B Expansion Summary

생성일: 2026-06-15

## 이번 단계 결론

Batch B 중 아래 3개는 승인 후보로 확정했다.

- `SK-MK`: 남성 톤 보정 / 메이크업 보정
- `BD-BC`: 바디워시 / 바디 클렌징
- `SL-LB`: 수면 안대 / 빛 차단

아래 1개는 보류 검토로 분리했다.

- `BD-WR`: 착장 / 바디 리스크

## 생성안 기준 수량

| 항목 | 수 |
| --- | ---: |
| 신규 Item 생성안 | 3 |
| 신규 Manual 생성안 | 3 |
| 신규 Product Group 생성안 | 3 |
| 신규 Routine 생성안 | 2 |
| 기존 Routine 연결 활용 | 1 |
| READY 전환 가능한 제품 | 4 |
| 실제 Product Import 가능한 제품 | 4 |
| 보류 제품 | 1 |

## 승인된 신규 Item 후보

| Code | Name | Domain | Topic |
| --- | --- | --- | --- |
| `SR26-SK-MK-C1` | 남성 톤 보정 / 부분 커버 | SK | MK |
| `SR26-BD-BC-C1` | 바디워시 / 바디 클렌징 | BD | BC |
| `SR26-SL-LB-C1` | 수면 안대 / 빛 차단 도구 | SL | LB |

## 승인된 신규 Manual 후보

| Code | Title |
| --- | --- |
| `SR26-SK-MK-M1` | 남성 톤 보정 / 부분 커버 관리 매뉴얼 |
| `SR26-BD-BC-M1` | 바디워시 / 바디 클렌징 관리 매뉴얼 |
| `SR26-SL-LB-M1` | 수면 안대 / 빛 차단 관리 매뉴얼 |

## READY 전환 가능한 제품

| Product | Target Item |
| --- | --- |
| 비레디 트루 톤 로션 하이드로/에어리 40ml 기획 | `SR26-SK-MK-C1` |
| 다슈 맨즈 듀얼 트릭 스틱 샌드 / 라이트 | `SR26-SK-MK-C1` |
| 우르오스 스킨워시 | `SR26-BD-BC-C1` |
| 테라바디 슬립마스크 진동 수면 안대 | `SR26-SL-LB-C1` |

## BD-WR 보류 판단

`BD-WR`은 구조적으로 Body Domain 유지가 더 맞지만, 사용자 화면에서 표현 수위가 민감할 수 있다.

따라서 바로 생성하지 않고 다음 기준을 먼저 승인받는 것이 좋다.

- 카드 제목은 `착장 / 바디 리스크 관리`
- 설명은 `얇은 상의 비침, 땀 자국, 마찰 관리` 중심
- 제품명은 상세 또는 태그에만 노출

## 다음 Batch 후보

1. Batch B Approved Preview 생성
   - 위 3개 Item / Manual / Product Group을 `app-data.generated.js` 후보에만 반영
   - READY 제품 4개 전환
   - `BD-WR`은 제외

2. Browser QA
   - Product Encyclopedia
   - Product Group Detail
   - Item Detail
   - Manual Detail
   - Routine Detail
   - Search

3. BD-WR 카피 승인 후 별도 Batch C로 처리
