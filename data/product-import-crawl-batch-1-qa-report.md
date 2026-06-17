# Product Import Crawl Batch 1 QA Report

Generated at: 2026-06-17

## Scope

Generated preview only.

Files involved:

- `data/product-import-crawl-batch-1.json`
- `tools/generate-batch-b-product-preview.js`
- `app-data.generated.js`
- `index.generated-preview.html`

Original `app-data.js` was not edited by this batch.

## Added Products

| Code | Item | Slot | Brand | Product |
| --- | --- | --- | --- | --- |
| SR26-SK-SS-P201 | 데일리 선크림 | 건성 | 라운드랩 | 라운드랩 자작나무 수분 선크림 SPF50+ PA++++ |
| SR26-SK-SS-P202 | 데일리 선크림 | 민감/입문 | 닥터지 | 닥터지 그린 마일드 업 선 플러스 SPF50+ PA++++ |
| SR26-SK-AC-P201 | 트러블 케어 | 스팟 패치 | COSRX | COSRX Acne Pimple Master Patch |
| SR26-GR-RS-P201 | 워터픽 / 구강 세정 | 휴대형 | Waterpik | Waterpik Cordless Advanced Water Flosser |
| SR26-SL-RS-P201 | 가습기 / 습도계 | 대용량/스마트 | Levoit | Levoit Superior 6000S Smart Evaporative Humidifier |

## Count Changes

| Metric | Before | After |
| --- | ---: | ---: |
| Real products | 9 | 14 |
| Product records including slots/placeholders | 252 | 257 |
| Items without real products | 77 | 74 |
| Manuals without real products through linked items | 77 | 74 |

## Slot QA

- `데일리 선크림` now has 3 real products.
- `민감/입문` slot contains 2 products: 비레디, 닥터지.
- `건성` slot contains 1 product: 라운드랩.
- `트러블 케어` now has a `스팟 패치` slot with COSRX.
- `워터픽 / 구강 세정` now has a `휴대형` slot with Waterpik.
- `가습기 / 습도계` now has a `대용량/스마트` slot with Levoit.

## Browser QA

Checked with local preview server:

`http://localhost:8061/index.generated-preview.html?qa=product-batch-1`

Confirmed:

- `아이템 & 제품 백과` opens.
- Product count displays `257개`.
- Real product count displays `14개`.
- Search for `라운드랩` returns the `데일리 선크림` product group.
- `데일리 선크림` drawer shows product slots.
- `건성` slot opens a Product List.
- 라운드랩 product opens Product Detail.
- Product Detail shows recommendation reason, target, actual use, caution, and product link.

## Notes

The Product Detail search snapshot still contains the phrase `관련 아이템` in the page-level search stat card, not as a Product Detail related-item card.

## Product Sources

- Round Lab official product page: https://roundlab.com/products/birch-moisturizing-uv-sunscreen
- Kurly product page for Dr.G Green Mild Up Sun Plus: https://www.kurly.com/goods/1001293829
- COSRX official product page: https://www.cosrx.com/products/master-patch-basic-90-ea
- Waterpik official product page: https://www.waterpik.com/oral-health/products/dental-water-flosser/WP-560/
- Levoit official product page: https://levoit.com/products/superior-6000s-smart-evaporative-humidifier
