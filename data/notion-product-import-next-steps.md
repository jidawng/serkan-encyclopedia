# Notion Product Import / Cross-Merge Status

Generated at: 2026-06-16

## Current Decision

Do not import products directly into `app-data.js`.

Use this order:

1. Notion Product DB CSV/JSON export
2. `staging-product-import.json`
3. reviewed generated data
4. `app-data.generated.js`
5. browser QA
6. later merge into the main data only after approval

## Source Status

| Source | Status | Use |
| --- | --- | --- |
| Serkan Lifestyle CSV | Available | Routine/manual cross-merge coverage check |
| 남성 자기 관리 방법론 Notion page | Available as reference page | Manual tone, rationale, behavior context |
| SERKAN 상품 DB Notion page | Schema/page available | Product DB source |
| SERKAN 상품 DB full query | Blocked | Notion query tool returns `notion-query-data-sources not found` |
| SERKAN 상품 DB CSV/JSON export | Not found locally | Needed for reliable full import |
| External crawling/search | Possible by batch | Fill products missing from Product DB/export |

## Latest Local Analysis

Files generated:

- `data/cross-merge-product-gap-report.md`
- `data/product-crawl-staging-candidates.json`

Summary:

| Metric | Count |
| --- | ---: |
| Lifestyle CSV rows | 465 |
| Generated routines | 467 |
| CSV actions missing by exact routine title | 0 |
| Manuals | 84 |
| Items | 84 |
| Product records including slots/placeholders | 252 |
| Real products | 9 |
| Items with at least one real product | 7 |
| Items without real products | 77 |
| Manuals without real products through linked items | 77 |

Product gap by domain:

| Domain | Missing Product Items |
| --- | ---: |
| SK | 11 |
| BD | 9 |
| SY | 9 |
| SO | 9 |
| GR | 8 |
| FD | 7 |
| ST | 7 |
| MT | 6 |
| SL | 6 |
| SP | 5 |

## Interpretation

The routine/manual cross-merge coverage is stable enough to proceed.

The main blocker is product coverage:

- The app currently has many Product Slot placeholders.
- Only 9 real products are mapped with actual product/image data.
- 77 items still need verified real product candidates.
- The Notion Product DB needs to be exported or directly queried before a full product import can be trusted.

## Safe Next Step

Preferred:

1. Export the SERKAN Product DB from Notion as CSV or JSON.
2. Place the export in the project or provide its path.
3. Parse it into `staging-product-import.json`.
4. Match products to existing `itemCode`, `manualCode`, and slots.
5. Put unmatched products into `REVIEW`, `NEEDS_ITEM`, or `NEEDS_MANUAL`.

Fallback:

If Product DB export is not available yet, crawl/search only the missing 77 item candidates in batches.

Suggested first crawl batch:

1. `SR26-SK-SS-C1` 데일리 선크림
2. `SR26-SK-AC-C1` 트러블 케어
3. `SR26-SK-SH-C1` 애프터쉐이브
4. `SR26-GR-RS-C1` 워터픽 / 구강 세정
5. `SR26-FD-FT-C1` 전해질 보충제
6. `SR26-SL-RS-C1` 가습기 / 습도계
7. `SR26-BD-DT-C1` 반창고/상처 키트
8. `SR26-ST-RS-C1` 발색 립밤
9. `SR26-SP-CN-C1` 데스크 정리 체크
10. `SR26-MT-RC-C1` 디지털 차단 도구

## Guardrails

- Do not edit `app-data.js` during import staging.
- Do not treat slot placeholders as real products.
- Do not create P1/P2/P3 duplicate product cards.
- Keep Product Slot under Item.
- Use official product pages, Olive Young, Coupang, Naver Shopping, or brand stores as source candidates.
- Store source URL, image URL, slot, risk, and reason for every crawled product.
