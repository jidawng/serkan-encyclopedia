# Product Import Batch B Approval Draft

생성일: 2026-06-15

기준점 커밋:

`ea42668 Batch A product import generated preview`

## 목적

Batch B는 실제 제품 삽입이 아니다.

목표는 Batch A에서 `NEEDS_ITEM`으로 남은 제품군을 수용하기 위한 신규 Item / Manual / Product Group 후보를 승인 가능한 형태로 정리하는 것이다.

이번 단계에서 수정하지 않는 파일:

- `app-data.js`
- `app-data.generated.js`
- `app.js`
- `index.html`

## Batch B 요약

| 항목 | 수 |
| --- | ---: |
| Batch B 후보 | 4 |
| 커버 가능한 제품 | 5 |
| 새 Item 필요한 후보 | 4 |
| 새 Manual 필요한 후보 | 4 |
| 기존 코드 흡수 대안 있음 | 2 |
| 바로 생성하면 위험한 후보 | 1 |
| 승인 시 READY 전환 가능 제품 | 5 |

## 후보 1. SK-MK 남성 톤 보정 / 메이크업 보정

대상 제품:

- 비레디 트루 톤 로션 하이드로/에어리 40ml 기획
- 다슈 맨즈 듀얼 트릭 스틱 샌드 / 라이트

| 항목 | 제안 |
| --- | --- |
| 신규 Topic Code 필요 여부 | 필요 |
| 신규 Item Code 후보 | `SR26-SK-MK-C1` |
| 신규 Manual Code 후보 | `SR26-SK-MK-M1` |
| Product Group 후보명 | 남성 톤 보정 / 부분 커버 |
| 연결 가능한 기존 Routine | `SR26-SK-FT-R142` 샤워 직후 마스크팩, 단 연결 약함 |
| 새 Routine 필요 여부 | 필요 |
| 새 Routine 후보 | `SR26-SK-MK-R1` 출근 전 톤 보정 로션을 얇게 바르기 |
| 기존 코드 흡수 대안 | 비추천 |
| Risk | 메이크업이라는 단어가 서비스 톤과 다르게 느껴질 수 있음 |
| Recommendation | 승인 권장 |

판단:

이 제품군은 기존 Skin item에 억지로 넣으면 스킨케어와 인상 보정이 섞인다. 새 Topic `MK`를 두되 화면명은 “남성 톤 보정 / 부분 커버”로 부드럽게 쓰는 편이 좋다.

## 후보 2. BD-BC 바디워시 / 바디 클렌징

대상 제품:

- 우르오스 스킨워시

| 항목 | 제안 |
| --- | --- |
| 신규 Topic Code 필요 여부 | 필요 |
| 신규 Item Code 후보 | `SR26-BD-BC-C1` |
| 신규 Manual Code 후보 | `SR26-BD-BC-M1` |
| Product Group 후보명 | 바디워시 / 바디 클렌징 |
| 연결 가능한 기존 Routine | `SR26-BD-DT-R105` 샤워 마지막 30초 찬물로 마무리하기 |
| 새 Routine 필요 여부 | 필요 |
| 새 Routine 후보 | `SR26-BD-BC-R1` 운동 후 바디워시로 땀과 피지 씻어내기 |
| 기존 코드 흡수 대안 | `SR26-GR-HR-C1` 개인 세정용품 |
| Risk | Body와 Grooming 경계가 흐릴 수 있음 |
| Recommendation | 승인 권장 |

판단:

바디워시는 Body 관리의 기본 제품군이다. Grooming의 개인 세정용품으로 흡수할 수도 있지만, 나중에 바디로션, 데오 바디제품, 등드름 케어 등으로 확장될 가능성을 보면 `BD-BC`가 더 안전하다.

## 후보 3. SL-LB 수면 안대 / 수면 차단 도구

대상 제품:

- 테라바디 슬립마스크 진동 수면 안대

| 항목 | 제안 |
| --- | --- |
| 신규 Topic Code 필요 여부 | 필요 |
| 신규 Item Code 후보 | `SR26-SL-LB-C1` |
| 신규 Manual Code 후보 | `SR26-SL-LB-M1` |
| Product Group 후보명 | 수면 안대 / 빛 차단 |
| 연결 가능한 기존 Routine | `SR26-SL-RS-R65` 밤에는 인공 조명과 강한 빛 멀리하기 |
| 새 Routine 필요 여부 | 불필요 |
| 기존 코드 흡수 대안 | 비추천 |
| Risk | `LB` 신규 약어 의미 설명 필요 |
| Recommendation | 승인 권장 |

판단:

기존 `SL-RS-C1`은 가습기/습도계라 수면 안대를 넣으면 오연결이다. Sleep 안에서 Light Blocking 계열을 따로 두는 것이 가장 명확하다.

## 후보 4. BD-WR 착장 / 바디 리스크

대상 제품:

- 다슈 맨즈 매직커버 니플밴드 더블 기획

| 항목 | 제안 |
| --- | --- |
| 신규 Topic Code 필요 여부 | 필요 |
| 신규 Item Code 후보 | `SR26-BD-WR-C1` |
| 신규 Manual Code 후보 | `SR26-BD-WR-M1` |
| Product Group 후보명 | 착장 / 바디 리스크 관리 |
| 연결 가능한 기존 Routine | `SR26-ST-CN-C1` 착장 체크리스트 |
| 새 Routine 필요 여부 | 필요 |
| 새 Routine 후보 | `SR26-BD-WR-R1` 얇은 상의 입기 전 비침과 땀 자국 확인하기 |
| 기존 코드 흡수 대안 | `SR26-ST-CN-C1` 착장 체크리스트 |
| Risk | 제품 표현 수위와 카피 톤 주의 필요 |
| Recommendation | 카피 검토 후 승인 |

판단:

구조적으로는 신규 코드가 맞다. 다만 사용자 화면에서는 제품명을 그대로 강조하기보다 “얇은 상의 비침 관리”, “여름 착장 리스크”처럼 생활감 있는 표현으로 다루는 편이 안전하다.

## 승인 우선순위

1. `SK-MK`: 승인 권장
2. `BD-BC`: 승인 권장
3. `SL-LB`: 승인 권장
4. `BD-WR`: 카피 검토 후 승인

## 승인 후 예상 효과

Batch B 후보를 승인하면 현재 `NEEDS_ITEM` 5개 제품을 READY 후보로 전환할 수 있다.

단, 승인 직후에도 바로 원본 `app-data.js`에 넣지 말고 다음 순서를 권장한다.

1. `app-data.generated.js` 후보 생성
2. `index.generated-preview.html`로 브라우저 QA
3. Product Group Detail / Item Detail / Manual Detail / Routine Detail / Search 확인
4. QA 통과 후 원본 반영 여부 결정

## 최종 Recommendation

Batch B는 진행해도 된다.

다만 `BD-WR`은 표현 수위와 화면 카피를 한 번 더 보고 승인하는 편이 좋다. 나머지 `SK-MK`, `BD-BC`, `SL-LB`는 Product DB 수용을 위해 필요한 구조적 gap이므로 승인 권장이다.
