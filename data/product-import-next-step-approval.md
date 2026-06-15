# Product Import Next Step Approval Plan

생성일: 2026-06-15

## 결론

이전 Gap 분석 방향은 맞다. 하지만 다음 단계에서 바로 실제 제품을 넣는 것은 아직 이르다.

지금 해야 할 일은 제품 삽입이 아니라, 샘플 제품 10개를 받을 수 있도록 Item / Manual / Code 기준을 승인 가능한 배치로 나누는 것이다.

이번 파일은 승인용 실행안이며, 앱 본체 파일은 수정하지 않았다.

## 왜 바로 제품을 넣으면 안 되는가

현재 Product Group 렌더링 구조는 괜찮다. 문제는 실제 제품을 연결할 Item/Manual 이름과 코드가 아직 제품군을 충분히 받지 못한다는 점이다.

예:

- 데일리 선크림 제품을 `상처 선크림/패치`에 넣으면 의미가 좁다.
- 바디워시는 받을 `BD-BC` item이 없다.
- 수면 안대는 기존 `SL-RS` 가습기/습도계와 다르다.
- 두피케어는 `SK-HR`과 `GR-SC` 중 어디로 갈지 기준이 필요하다.
- 목어깨 마사지기는 `마사지볼 회복 루틴`에 넣을 수는 있지만 이름이 좁다.

## Batch A: 기존 코드 흡수 / 정규화

새 Item을 만들지 않고, 기존 코드의 의미를 정리하면 READY 후보로 전환 가능한 항목이다.

| 결정 ID | 제품군 | 기존 코드 | 필요한 결정 | READY 가능 제품 |
| --- | --- | --- | --- | --- |
| A1 | 체취 / 데오 관리 | `SR26-GR-FR-C1`, `SR26-GR-FR-M1` | 데오 제품은 Grooming 체취 관리로 본다 | 쏘내추럴 데오 팩트 |
| A2 | 회복 디바이스 / 목어깨 마사지 | `SR26-BD-RC-C1`, `SR26-BD-RC-M1` | 마사지볼보다 넓은 회복 디바이스 그룹으로 확장 | 풀리오 목어깨 마사지기 |
| A3 | 두피케어 / 두피 세럼 | `SR26-SK-HR-C1` 유지 또는 `SR26-GR-SC-C1` 신설 | 두피케어 canonical code 결정 | 솔랩 두피앰플, 케라스타즈 두피 세럼 |
| A4 | 데일리 선크림 | `SR26-SK-SS-C1`, `SR26-SK-SS-M1` | SK-SS를 데일리 선케어까지 확장할지 결정 | 비레디 블루 수분 선크림 |

Batch A 승인 시 예상:

- 최소 4개 READY 가능
- 선크림 의미 확장까지 승인하면 5개 READY 가능

## Batch B: 신규 Item / Manual 후보

기존 코드에 흡수하지 않는 편이 안전한 항목이다.

| 제품군 | 신규 Item Code | 신규 Manual Code | 신규 Routine 후보 | 대상 제품 |
| --- | --- | --- | --- | --- |
| 남성 톤 보정 / 부분 커버 | `SR26-SK-MK-C1` | `SR26-SK-MK-M1` | `SR26-SK-MK-R1` | 비레디 톤 로션, 다슈 듀얼 트릭 스틱 |
| 바디워시 / 바디 클렌징 | `SR26-BD-BC-C1` | `SR26-BD-BC-M1` | `SR26-BD-BC-R1` | 우르오스 스킨워시 |
| 수면 안대 / 빛 차단 | `SR26-SL-LB-C1` | `SR26-SL-LB-M1` | 기존 빛 차단 루틴 활용 가능 | 테라바디 슬립마스크 |
| 착장 / 바디 리스크 관리 | `SR26-BD-WR-C1` | `SR26-BD-WR-M1` | `SR26-BD-WR-R1` | 다슈 니플밴드 |

Batch B 승인 시 예상:

- 추가 5개 READY 가능
- Batch A + Batch B를 모두 승인하면 샘플 10개 전부 READY 또는 READY 직전 상태로 이동 가능

## 추천 진행 순서

1. Batch A부터 승인한다.
2. Batch A 승인 범위만 기준으로 `staging-product-import.json`의 상태를 READY 후보로 갱신한다.
3. Batch B 신규 코드명을 검토한다.
4. 신규 Item/Manual 이름이 마음에 들면 그때 `app-data.generated.js` 후보를 만든다.
5. 브라우저에서 Product Encyclopedia, Product Group Detail, Item Detail, Manual Detail, Routine Detail, Search를 QA한다.

## 지금 승인하면 좋은 최소 결정

우선 아래 네 가지만 결정하면 된다.

1. 데오 제품은 `GR-FR` 체취/데오 관리로 간다.
2. `BD-RC`는 마사지볼뿐 아니라 회복 디바이스까지 받는다.
3. 두피케어는 `SK-HR` 유지 또는 `GR-SC` 신설 중 하나로 정한다.
4. 데일리 선크림은 `SK-SS` 확장 또는 신규 데일리 선케어 item 중 하나로 정한다.

## 다음 단계 제안

다음 작업은 실제 제품 삽입이 아니라 `Batch A 승인안`을 기준으로 staging 상태만 업데이트하는 것이다.

그 다음에야 `app-data.generated.js` 후보를 만들 수 있다.
