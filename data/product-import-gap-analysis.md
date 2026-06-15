# Product Import Gap Analysis

생성일: 2026-06-15

## 작업 범위

이번 단계는 실제 Product 삽입이 아니라, Notion Product DB를 수용하기 위한 Item / Manual / Code gap 분석이다.

수정하지 않은 파일:

- `app-data.js`
- `app-data.generated.js`
- `app.js`
- `index.html`

생성한 제안 파일:

- `data/product-import-gap-analysis.md`
- `data/product-import-code-proposals.json`

근거 파일:

- `data/staging-product-import.json`
- `data/product-import-review-table.md`
- 현재 `app-data.js`

## READY가 0인 이유

샘플 제품 10개는 이미지와 링크가 있는 실제 제품이지만, 기존 Item / Manual 구조와 직접 맞물리는 항목이 없다.

주요 원인:

- 제품은 실제 생활 제품인데 기존 Item은 mock slot을 만들기 위해 넓거나 어색하게 생성된 항목이 많다.
- 기존 Item 이름이 실제 제품군보다 좁다. 예: `상처 선크림/패치`, `마사지볼 회복 루틴`.
- Notion code와 현재 app-data code의 domain/topic이 다르다. 예: 두피케어는 Notion에서 `GR-SC`, 현재 후보는 `SK-HR`.
- 일부 제품군은 받을 Item 자체가 없다. 예: 남성 톤 보정, 바디워시, 수면 안대.

따라서 지금 제품을 바로 넣으면 Product Group은 렌더링되지만, Relation이 부자연스럽게 보일 가능성이 높다.

## Gap 분류

| 분류 | 항목 |
| --- | --- |
| 기존 Item Code에 바로 연결 후보는 있음 | 선크림, 데오 팩트, 두피앰플, 목어깨 마사지기, 두피 세럼 |
| Item은 있지만 Manual이 좁거나 어색함 | 선크림, 목어깨 마사지기, 두피케어 |
| Item 자체가 없음 | 남성 톤 보정, 바디워시, 수면 안대, 착장/바디 리스크 |
| Domain / Topic 코드가 새로 필요 | `SK-MK`, `BD-BC`, `SL-LB`, `BD-WR`, `GR-SC` 후보 |
| 기존 코드로 흡수 가능 | 데오 팩트 -> `GR-FR`, 두피케어 -> `SK-HR` 또는 `GR-SC`, 회복 디바이스 -> `BD-RC` |
| 새 코드 생성 권장 | 남성 톤 보정, 바디워시, 수면 안대, 착장/바디 리스크 |

## 후보별 상세 분석

### 1. SK-MK 남성 톤 보정 / 부분 커버

대상 제품:

- 비레디 트루 톤 로션 하이드로/에어리 40ml 기획
- 다슈 맨즈 듀얼 트릭 스틱 샌드 / 라이트

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 비추천 |
| 신규 Item Code 후보 | `SR26-SK-MK-C1` |
| 신규 Manual Code 후보 | `SR26-SK-MK-M1` |
| Product Group 후보명 | 남성 톤 보정 / 부분 커버 |
| 연결 가능한 기존 Routine 예시 | `SR26-SK-FT-R142` 샤워 직후 마스크팩, 단 직접 연결은 약함 |
| 새 Routine 필요 여부 | 필요 |
| 새 Routine 후보 | `SR26-SK-MK-R1` 출근 전 톤 보정 로션을 얇게 바르기 |
| 추천 상태 | NEEDS_ITEM |

판단 근거:

현재 Skin에는 보습, 선크림, 여드름, 애프터쉐이브 계열은 있지만 남성 베이스/톤 보정 제품을 받을 Item이 없다. 기존 스킨케어로 흡수하면 “피부 관리”와 “인상 보정”이 섞여 검색과 연결이 흐려진다.

### 2. BD-BC 바디워시 / 바디 클렌징

대상 제품:

- 우르오스 스킨워시

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 비추천 |
| 신규 Item Code 후보 | `SR26-BD-BC-C1` |
| 신규 Manual Code 후보 | `SR26-BD-BC-M1` |
| Product Group 후보명 | 바디워시 / 바디 클렌징 |
| 연결 가능한 기존 Routine 예시 | `SR26-BD-DT-R105` 샤워 마지막 30초 찬물로 마무리하기 |
| 새 Routine 필요 여부 | 필요 |
| 새 Routine 후보 | `SR26-BD-BC-R1` 운동 후 바디워시로 땀과 피지 씻어내기 |
| 추천 상태 | NEEDS_ITEM |

판단 근거:

`GR-HR` 개인 세정용품으로 흡수할 수도 있지만, 바디워시는 Body 위생/샤워 루틴의 중심 제품이다. Grooming에 넣으면 바디 관리 제품군이 계속 누락된다.

### 3. 수면 안대 / 빛 차단

대상 제품:

- 테라바디 슬립마스크 진동 수면 안대

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 비추천 |
| 신규 Item Code 후보 | `SR26-SL-LB-C1` |
| 신규 Manual Code 후보 | `SR26-SL-LB-M1` |
| Product Group 후보명 | 수면 안대 / 빛 차단 |
| 연결 가능한 기존 Routine 예시 | `SR26-SL-RS-R65` 밤에는 인공 조명과 강한 빛 멀리하기 |
| 새 Routine 필요 여부 | 선택 |
| 새 Routine 후보 | 기존 빛 차단 루틴을 활용 가능 |
| 추천 상태 | NEEDS_ITEM |

판단 근거:

현재 `SR26-SL-RS-C1`은 가습기/습도계다. 수면 안대를 여기에 넣으면 “습도 제품” Product Group에 수면 안대가 들어가는 오연결이 생긴다. Sleep domain 안에 Light Blocking 계열을 따로 두는 편이 안전하다.

### 4. 체취 / 데오 관리

대상 제품:

- 쏘내추럴 파우더포룸 피치 데오 팩트

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 불필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 가능 |
| 기존 Item Code 후보 | `SR26-GR-FR-C1` |
| 기존 Manual Code 후보 | `SR26-GR-FR-M1` |
| Product Group 후보명 | 체취 / 데오 관리 |
| 연결 가능한 기존 Routine 예시 | `SR26-GR-FR-M1` 체취 부위 세정 관리 매뉴얼 |
| 새 Routine 필요 여부 | 불필요 |
| 추천 상태 | REVIEW |

판단 근거:

제품 의미는 Grooming의 체취 관리와 잘 맞는다. 다만 Notion code는 `BD-BC` 계열로 들어와 있어, 도메인을 Body로 볼지 Grooming으로 볼지 기준만 정하면 READY에 가까워질 수 있다.

### 5. 착장 / 바디 리스크 관리

대상 제품:

- 다슈 맨즈 매직커버 니플밴드

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 비추천 |
| 신규 Item Code 후보 | `SR26-BD-WR-C1` |
| 신규 Manual Code 후보 | `SR26-BD-WR-M1` |
| Product Group 후보명 | 착장 / 바디 리스크 관리 |
| 연결 가능한 기존 Routine 예시 | `SR26-ST-CN-C1` 착장 체크리스트, 단 Item 성격은 다름 |
| 새 Routine 필요 여부 | 필요 |
| 새 Routine 후보 | `SR26-BD-WR-R1` 얇은 상의 입기 전 비침과 땀 자국 확인하기 |
| 추천 상태 | NEEDS_ITEM |

판단 근거:

Style 착장 체크와 관련은 있지만 제품은 “위생/바디 리스크를 줄이는 도구”에 가깝다. 바디워시나 바디그루밍에 넣으면 너무 억지다.

### 6. 두피케어 / 두피 세럼

대상 제품:

- 솔랩 프리미엄 탈모/두피진정 두피앰플
- 케라스타즈 제네시스 옴므 세럼 안티-슈트 포티피앙

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 조건부 필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 가능 |
| 신규 Item Code 후보 | `SR26-GR-SC-C1` |
| 신규 Manual Code 후보 | `SR26-GR-SC-M1` |
| 기존 흡수 후보 | `SR26-SK-HR-C1`, `SR26-SK-HR-M1` |
| Product Group 후보명 | 두피케어 / 두피 세럼 |
| 연결 가능한 기존 Routine 예시 | `SR26-SK-HR-R139`, `SR26-SK-HR-R140`, `SR26-GR-HR-M145` |
| 새 Routine 필요 여부 | 불필요 |
| 추천 상태 | REVIEW |

판단 근거:

현재는 `SK-HR`에 두피 보습제가 있고 실제 루틴도 존재한다. 하지만 Notion 제품 코드는 `GR-SC`이고, 두피케어는 Grooming/Style에 더 자연스러울 수도 있다. 운영 기준을 하나로 정해야 한다.

### 7. 회복 디바이스 / 목어깨 마사지

대상 제품:

- 풀리오 목어깨 마사지기

| 항목 | 제안 |
| --- | --- |
| 신규 Domain / Topic 필요 여부 | 불필요 |
| 기존 Domain / Topic 흡수 가능 여부 | 가능 |
| 기존 Item Code 후보 | `SR26-BD-RC-C1` |
| 기존 Manual Code 후보 | `SR26-BD-RC-M1` |
| Product Group 후보명 | 회복 디바이스 / 목어깨 마사지 |
| 연결 가능한 기존 Routine 예시 | `SR26-BD-CL-R101`, `SR26-BD-FT-R95` |
| 새 Routine 필요 여부 | 불필요 |
| 추천 상태 | REVIEW |

판단 근거:

Body recovery 계열로 흡수할 수 있다. 다만 기존 group명이 `마사지볼 회복 루틴`이라 목어깨 마사지기를 넣으면 제품군 이름이 어색해진다. group명을 넓히면 READY에 가까워진다.

## 기존 코드로 흡수 가능한 항목

| 제품군 | 흡수 후보 | 조건 |
| --- | --- | --- |
| 데오 팩트 | `SR26-GR-FR-C1` / `SR26-GR-FR-M1` | 체취/데오를 Grooming으로 확정 |
| 두피 세럼 | `SR26-SK-HR-C1` / `SR26-SK-HR-M1` | 두피케어를 Skin/Hair로 유지 |
| 목어깨 마사지기 | `SR26-BD-RC-C1` / `SR26-BD-RC-M1` | Product Group명을 회복 디바이스까지 확장 |
| 데일리 선크림 | `SR26-SK-SS-C1` / `SR26-SK-SS-M1` | 상처 색소침착 전용 의미를 데일리 선케어까지 확장 |

## 새 코드가 필요한 항목

| 제품군 | 신규 Item 후보 | 신규 Manual 후보 | 이유 |
| --- | --- | --- | --- |
| 남성 톤 보정 / 부분 커버 | `SR26-SK-MK-C1` | `SR26-SK-MK-M1` | 기존 Skin item에 메이크업/톤 보정 슬롯이 없음 |
| 바디워시 / 바디 클렌징 | `SR26-BD-BC-C1` | `SR26-BD-BC-M1` | Body shower 제품을 받을 item 없음 |
| 수면 안대 / 빛 차단 | `SR26-SL-LB-C1` | `SR26-SL-LB-M1` | 기존 Sleep item은 가습기/습도계라 오연결 위험 |
| 착장 / 바디 리스크 관리 | `SR26-BD-WR-C1` | `SR26-BD-WR-M1` | 니플밴드/비침/땀자국 같은 제품군을 받을 item 없음 |
| 두피케어 / 두피 세럼 | `SR26-GR-SC-C1` | `SR26-GR-SC-M1` | 기존 `SK-HR` 유지 여부에 따라 조건부 |

## 다음 단계에서 READY로 만들 수 있는 최소 범위

최소 보완만 하면 READY 후보로 만들 수 있는 제품군:

1. 데오 팩트: `GR-FR`로 확정하면 READY 가능
2. 목어깨 마사지기: `BD-RC` Product Group명을 넓히면 READY 가능
3. 두피 세럼 2개: `SK-HR` 유지 또는 `GR-SC` 신설 기준을 정하면 READY 가능
4. 선크림: `SK-SS`를 데일리 선케어까지 확장하면 READY 가능

즉, 새 Item을 많이 만들지 않고도 최소 4~5개 제품은 READY로 전환 가능하다.

새 Item 후보까지 승인하면 샘플 10개 전부를 READY 또는 거의 READY 상태로 만들 수 있다.

추천 다음 단계:

1. `SK-SS`를 데일리 선크림으로 확장할지, 상처 후 선크림으로 유지할지 결정
2. `BD-BC`, `SK-MK`, `SL-LB`, `BD-WR` 신규 Item/Manual 생성 승인 여부 결정
3. 두피케어 canonical code를 `SK-HR`로 유지할지 `GR-SC`로 바꿀지 결정
4. 승인된 범위만 `app-data.generated.js` 후보로 생성
