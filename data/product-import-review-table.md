# SERKAN Product Import Review Table

생성일: 2026-06-15

## 1. Notion DB 접근 가능 여부

결론: 접근 가능.

- Notion Product DB: `추천 제품 큐레이션 보기`
- Source DB URL: `https://www.notion.so/36f43a1ad2c48122b39cf43b9024bccf?v=36f43a1ad2c4813eb466000cb2bc3127`
- Data Source: `collection://2a646ac2-c1ce-48cb-ac56-6fd873c16303`
- 확인 가능 범위: DB schema, property 목록, 개별 제품 페이지 샘플
- 제한: 현재 세션의 table query 도구는 전체 행 export에서 실패했음. 전체 제품 일괄 매핑은 Notion CSV/JSON export 또는 query 도구 복구 후 진행 권장.

이번 단계에서 하지 않은 것:

- `app-data.js` 수정 안 함
- `app-data.generated.js` 생성 안 함
- `app.js` 수정 안 함
- `index.html` 수정 안 함
- HTML 화면에 실제 제품 반영 안 함

## 2. 현재 HTML 데이터 구조 요약

| 구조 | 현재 수 | 역할 |
| --- | ---: | --- |
| `categories` | 10 | Skin, Grooming, Body, Food, Sleep, Mental, Style, Relationship, Space, System 등 공통 분류 |
| `routines` | 465 | Daily/Weekly/Situation 등에 노출되는 실행 루틴 |
| `manuals` | 81 | Routine/Situation에서 열리는 상세 매뉴얼 |
| `items` | 81 | Manual과 Product Group 사이의 실행 도구/아이템 그룹 |
| `products` | 243 | 현재는 실제 제품이 아니라 mock recommendation slot |
| `situations` | 45 | 상황형 루틴/매뉴얼 진입점 |

현재 `products` 필드:

| Field | 역할 |
| --- | --- |
| `code` | 개별 product/slot code |
| `brand` | 브랜드명 |
| `productName` | 제품명 |
| `category` | 표시 카테고리 |
| `itemCode` | Product Group 생성 기준 |
| `domain` | SERKAN domain |
| `recommendationType` | 가성비 / 민감·입문 / 프리미엄 등 슬롯 성격 |
| `imageUrl` | 제품 이미지 |
| `productLink` | 제품 링크 |
| `recommendationReason` | 추천 이유 |
| `target` | 추천 대상 |
| `caution` | 주의사항 |
| `tags` | 검색/분류 태그 |
| `connectionStatus` | mock/real/pending 상태 |

## 3. Product Group 생성 기준

현재 `app.js` 기준:

- Product Group code는 기본적으로 `product.itemCode`를 사용한다.
- `itemCode`가 없으면 `product.code`의 `-P숫자`를 `-PG`로 바꾼 값을 fallback으로 쓴다.
- P1/P2/P3 개별 제품은 Product Encyclopedia에서 따로 카드화하지 않고, 하나의 Product Group 내부 슬롯으로 묶는 구조다.
- Detail/Relation 화면에서는 `includeMock: false`가 사용되어 mock product는 숨겨진다.
- Product Encyclopedia Hub에서는 mock group이 보일 수 있지만 “Mock Product / 제품 연결 대기” 상태로 표시된다.

## 4. Mock Product 필터링 기준

현재 mock으로 판단되는 조건:

- `connectionStatus === "mock"`
- `imageUrl`이 없고 `productLink`가 없거나 `#`
- 텍스트에 `가성비 추천 제품`, `민감/입문 추천 제품`, `프리미엄 추천 제품`, `placeholder` 등이 포함됨

따라서 실제 제품 import 시 최소 조건:

- `connectionStatus`는 `mock`이 아니어야 함
- `imageUrl` 또는 실제 product image URL 필요
- `productLink`는 `#`가 아니어야 함
- 제품명은 “가성비 추천 제품” 같은 슬롯명이 아니라 실제 제품명이어야 함

## 5. imageUrl / productLink 렌더링 방식

- `imageUrl`이 있으면 `<img class="product-image">`로 렌더링된다.
- `imageUrl`이 없으면 bottle/jar/box 형태 placeholder art가 표시된다.
- `productLink`가 있고 `#`이 아니면 Product Detail에서 링크로 노출된다.
- Notion `제품 사진`은 file property 안의 `source` URL을 `product.imageUrl`로 추출해야 한다.

## 6. Notion Product DB 필드 매핑표

| Notion Field | SERKAN_DATA Field | 사용 방식 |
| --- | --- | --- |
| `브랜드` | `product.brand` | 필수 |
| `제품명` | `product.productName` | 필수 |
| `제품 사진` | `product.imageUrl` | Notion file JSON의 `source` URL 추출 |
| `공식 링크` | `product.productLink` | 필수, `#` 금지 |
| `SERKAN Code` | `product.code` 후보 | 중복 검사 후 사용 |
| `카테고리` | `product.category`, `candidateDomain` | 피부관리/Skin 등으로 변환 |
| `제품군` | `candidateTopic`, `candidateProductGroup` | Product Group 후보 |
| `추천 이유 한 줄` | `product.recommendationReason` | 비어 있으면 page content에서 후보 생성 |
| `추천 대상` | `product.target` | 비어 있으면 page content에서 후보 생성 |
| `태그` | `product.tags` | `/`, `,` 기준 split 후보 |
| `검수 상태` | `importStatus` 판단 근거 | 승인이어도 item/manual 불일치면 REVIEW |
| `분류 확신도` | classification confidence | READY 판정 보조 |
| `이미지 상태` | image risk | 사용 불가면 READY 불가 |
| `트렌드 근거` | `reason` / source note | 내부 판단 근거. 화면에 장문 노출 금지 |
| `연결 섹션 코드` | `candidateDomain`, `candidateTopic` | 비어 있으면 제품명/제품군 기반 추정 |
| `Codex 분류 메모` | `risk`, internal note | 사용자 화면 노출 금지 |

## 7. staging-product-import.json 필드 설계

파일: `data/staging-product-import.json`

각 제품 record는 아래 필드를 가진다.

| Field | 설명 |
| --- | --- |
| `sourceId` | Notion page id |
| `source` | `Notion` |
| `brand` | 브랜드 |
| `productName` | 제품명 |
| `productImage` | 제품 이미지 URL |
| `productLink` | 공식/소스 링크 |
| `notionCategory` | Notion 카테고리 |
| `notionAssetType` | Notion 제품군 |
| `candidateDomain` | 추정 SERKAN domain |
| `candidateTopic` | 추정 SERKAN topic |
| `candidateItemCode` | 기존 item code 후보 |
| `candidateManualCode` | 기존 manual code 후보 |
| `candidateProductGroup` | Product Group 후보 |
| `recommendationType` | 데일리/입문/프리미엄/상황형 등 |
| `importStatus` | READY/REVIEW/PENDING/NEEDS_ITEM/NEEDS_MANUAL/SOURCE_CONFLICT |
| `risk` | 위험 요소 |
| `reason` | 판단 근거 |

## 8. 자동 분류 기준

| 제품명/카테고리 키워드 | Domain | Topic | Item Code 후보 | 판정 기준 |
| --- | --- | --- | --- | --- |
| 선크림, sunscreen, SPF | SK | SS | `SR26-SK-SS-C1` | 현재 item이 상처 선크림 맥락이라 데일리 선케어는 REVIEW |
| 클렌저, 폼클렌징 | SK | CL | `SR26-SK-CL-C1` | 여드름/좁쌀 케어와 일반 클렌징 분리 필요 |
| 면도기, 쉐이빙젤 | GR | SH | `SR26-GR-SH-C1` | 기존 item이 면도 후 위생 체크라 REVIEW 가능성 |
| 바디워시, 스킨워시 | BD | BC | 없음 | NEEDS_ITEM |
| 데오드란트, 데오, 체취 | GR | FR | `SR26-GR-FR-C1` | Notion code가 BD이면 REVIEW |
| 가습기, 습도계 | SL | RS/CN | `SR26-SL-RS-C1` 또는 `SR26-SL-CN-C1` | 수면 환경/습도 맥락 확인 필요 |
| 수면 안대, 슬립마스크 | SL | 미정 | 없음 | NEEDS_ITEM |
| 영양제, 전해질, 단백질 | FD | 미정 | 없음 | Food supplement item group 설계 필요 |
| 디퓨저, 청소, 정리, 수납 | SP 또는 SL | 미정 | 없음 | 공간관리/수면환경 목적 확인 필요 |
| 노트, 타이머, 앱, 생산성 도구 | SY 또는 MT | 미정 | 없음 | System/Mental 목적 확인 필요 |

## 9. 샘플 매핑 10개

| Brand | Product Name | Notion Category | Asset Type | Candidate Domain | Candidate Item Code | Candidate Manual Code | Product Group | Import Status | Risk | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 비레디 | 비레디 블루 수분 선크림 SPF50+/PA++++ | 피부관리 | 선케어 | SK | `SR26-SK-SS-C1` | `SR26-SK-SS-M1` | 상처 선크림/패치 | REVIEW | 데일리 선크림이 아니라 상처 색소침착 맥락에 붙음 | 데일리 선케어 item/manual 정리가 필요 |
| 비레디 | 비레디 트루 톤 로션 하이드로/에어리 40ml 기획 | 피부관리 | 메이크업 | SK | 없음 | 없음 | 톤 보정 로션 | NEEDS_ITEM | `SR26-SK-MK-C1` 없음 | 남성 베이스/톤 보정 item 필요 |
| 우르오스 | 우르오스 스킨워시 | 바디관리 | 바디케어 | BD | 없음 | 없음 | 바디워시 | NEEDS_ITEM | `SR26-BD-BC-C1` 없음 | 바디 클렌징 item 필요 |
| 테라바디 | 테라바디 슬립마스크 진동 수면 안대 | 수면관리 | 홈케어디바이스 | SL | 없음 | 없음 | 수면 안대 / 빛 차단 | NEEDS_ITEM | 기존 SL-RS는 가습기/습도계 | 수면 안대 전용 item 필요 |
| 쏘내추럴 | 파우더포룸 피치 데오 팩트 | 위생관리 | 바디케어 | GR | `SR26-GR-FR-C1` | `SR26-GR-FR-M1` | 체취 세정용품 | REVIEW | Notion code는 BD-BC, 후보는 GR-FR | 체취/데오 domain 정규화 필요 |
| 다슈 | 맨즈 매직커버 니플밴드 | 위생관리 | 바디케어 | BD | 없음 | 없음 | 착장/바디 리스크 관리 | NEEDS_ITEM | 직접 item 없음 | 여름 착장/비침 리스크 item 필요 |
| 솔랩 | 프리미엄 탈모/두피진정 두피앰플 | 스타일관리 | 두피케어 | SK/GR | `SR26-SK-HR-C1` | `SR26-SK-HR-M1` | 두피 보습제 | REVIEW | Notion code는 GR-SC, 후보는 SK-HR | 두피케어 domain/topic 통일 필요 |
| 풀리오 | 목어깨 마사지기 | 바디관리 | 운동회복 | BD | `SR26-BD-RC-C1` | `SR26-BD-RC-M1` | 마사지볼 회복 루틴 | REVIEW | 마사지기와 마사지볼 group 차이 | 회복 디바이스 group 분리 후보 |
| 다슈 | 맨즈 듀얼 트릭 스틱 샌드 / 라이트 | 피부관리 | 메이크업 | SK | 없음 | 없음 | 부분 커버 / 남성 베이스 | NEEDS_ITEM | SK-MK item/manual 없음 | 남성 메이크업 item 필요 |
| 케라스타즈 | 제네시스 옴므 세럼 안티-슈트 포티피앙 | 스타일관리 | 두피케어 | SK/GR | `SR26-SK-HR-C1` | `SR26-SK-HR-M1` | 두피 보습제 | REVIEW | Notion code는 GR-SC, 후보는 SK-HR | 두피 세럼/두피 보습 코드 정리 필요 |

## 10. 샘플 상태 요약

| Import Status | Count |
| --- | ---: |
| READY | 0 |
| REVIEW | 5 |
| PENDING | 0 |
| NEEDS_ITEM | 5 |
| NEEDS_MANUAL | 0 |
| SOURCE_CONFLICT | 0 |

## 11. 다음 단계에서 실제 app-data.generated.js 반영 가능 여부

판단: 아직 바로 반영하지 않는 편이 안전함.

이유:

- Product Group 렌더링 구조는 실제 제품을 받을 준비가 되어 있음.
- 하지만 샘플 10개 기준으로 READY가 0개다.
- 문제는 제품 데이터 품질보다 기존 Item/Manual taxonomy가 실제 제품군을 받을 만큼 세분화되어 있지 않은 점이다.
- 특히 `SK-MK`, `BD-BC`, 수면 안대, 착장/바디 리스크, 두피케어 domain/topic은 먼저 정리해야 한다.

추천 순서:

1. Notion 전체 Product DB를 CSV/JSON으로 export한다.
2. `NEEDS_ITEM` 제품군을 받을 Item Group 설계안을 먼저 만든다.
3. Item Group 승인 후 READY 후보만 `app-data.generated.js` 생성 대상으로 삼는다.
4. 브라우저에서 Product Encyclopedia, Product Group Detail, Item Detail, Manual Detail, Routine Detail, Search를 QA한다.
