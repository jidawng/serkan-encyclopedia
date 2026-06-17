# Batch B Product Import QA Report

Date: 2026-06-15

## Scope

Batch B applied only to generated preview files.

- Runtime source `app-data.js`: not modified
- Generated data: `app-data.generated.js`
- Preview HTML: `index.generated-preview.html`
- Staging: `data/staging-product-import.json`
- Deferred candidate: `BD-WR / 다슈 맨즈 매직커버 니플밴드 더블 기획`

## Generated Data Summary

| Metric | Before Batch B | After Batch B | Change |
|---|---:|---:|---:|
| READY staging products | 5 | 9 | +4 |
| NEEDS_ITEM staging products | 5 | 1 | -4 |
| Generated real products | 5 | 9 | +4 |
| Real imported Product Groups | 4 | 7 | +3 |
| Items | 81 | 84 | +3 |
| Manuals | 81 | 84 | +3 |
| Routines | 465 | 467 | +2 |

## New Items

| Code | Name | Product Codes |
|---|---|---|
| `SR26-SK-MK-C1` | 남성 톤 보정 / 부분 커버 | `SR26-SK-MK-P114`, `SR26-SK-MK-P111` |
| `SR26-BD-BC-C1` | 바디워시 / 바디 클렌징 | `SR26-BD-BC-P112` |
| `SR26-SL-LB-C1` | 수면 안대 / 빛 차단 도구 | `SR26-SL-LB-P102` |

## New Manuals

| Code | Title | Routine Link |
|---|---|---|
| `SR26-SK-MK-M1` | 남성 톤 보정 / 부분 커버 관리 매뉴얼 | `SR26-SK-MK-R1` |
| `SR26-BD-BC-M1` | 바디워시 / 바디 클렌징 관리 매뉴얼 | `SR26-BD-BC-R1` |
| `SR26-SL-LB-M1` | 수면 안대 / 빛 차단 관리 매뉴얼 | `SR26-SL-RS-R65` |

## New Routines

| Code | Title | Board |
|---|---|---|
| `SR26-SK-MK-R1` | 출근 전 톤 보정 로션을 얇게 바르기 | Daily / 기상 |
| `SR26-BD-BC-R1` | 운동 후 바디워시로 땀과 피지 씻어내기 | Daily / 저녁 |

## Imported Products

| Code | Brand | Product Name | Product Group |
|---|---|---|---|
| `SR26-SK-MK-P114` | 비레디 | 비레디 트루 톤 로션 하이드로/에어리 40ml 기획 | 남성 톤 보정 / 부분 커버 |
| `SR26-SK-MK-P111` | 다슈 | 다슈 맨즈 듀얼 트릭 스틱 샌드 / 라이트 | 남성 톤 보정 / 부분 커버 |
| `SR26-BD-BC-P112` | 우르오스 | 우르오스 스킨워시 | 바디워시 / 바디 클렌징 |
| `SR26-SL-LB-P102` | 테라바디 | 테라바디 슬립마스크 진동 수면 안대 | 수면 안대 / 빛 차단 도구 |

## Automated Data QA

| Check | Result |
|---|---|
| Duplicate codes across Routine / Manual / Item / Product | Pass |
| Imported products have valid Item references | Pass |
| New manuals have valid Routine references | Pass |
| New Item / Manual / Product Group codes present | Pass |
| BD-WR product imported | Pass: not imported |

## Browser QA

Test URL:

`http://localhost:8057/index.generated-preview.html?qa=batch-b-import`

| Screen | Result |
|---|---|
| Product Encyclopedia | Pass. `Skin`, `Body`, `Sleep` category counts reflect new items/groups. |
| Product Group Detail | Pass. `남성 톤 보정 / 부분 커버` opens and shows 2 real product slots. |
| Product Detail | Pass. `비레디 트루 톤 로션` opens from Product Group slot and shows image, product link, related routine, manual, and item. |
| Item Detail | Pass. Related Item opens and links back to its manual/product group. |
| Manual Detail | Pass. Related Item and Product Group are visible. Existing renderer does not expose a dedicated related routine button in manual detail. |
| Routine Detail | Pass by relation: Product Detail shows `출근 전 톤 보정 로션을 얇게 바르기` as related routine. |
| Search logic | Pass. Generated data search resolves new records as Product Group results, not individual P-cards. |

## Search QA

| Query | Result |
|---|---|
| `비레디 톤 보정` | `SR26-SK-MK-C1 / 남성 톤 보정 / 부분 커버` |
| `우르오스 바디워시` | `SR26-BD-BC-C1 / 바디워시 / 바디 클렌징` |
| `테라바디 수면 안대` | `SR26-SL-LB-C1 / 수면 안대 / 빛 차단 도구` |
| `니플밴드` | 0 results; BD-WR remains deferred |

## Notes

- Browser text input automation hit a local virtual clipboard limitation, so search was verified against the generated data and search token behavior rather than typed through the UI field.
- Product category detail pages list Product Groups first; actual product names appear inside Product Group Detail and Product Detail.
- Existing mock placeholder products remain in generated data for old groups, but Batch B products were added only as real Product Group slots.
- `BD-WR` remains deferred pending Style vs Body domain review.

