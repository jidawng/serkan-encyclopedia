# Product Import Crawl Batch 4 QA Report

Generated at: 2026-06-17

## Scope

Batch 4 adds real product candidates to generated preview only.

- Source data: `data/product-import-crawl-batch-4.json`
- Generator: `tools/generate-batch-b-product-preview.js`
- Generated output: `app-data.generated.js`
- Preview HTML: `index.generated-preview.html`
- Original data: `app-data.js` was not edited by this batch

## Added Products

| Product Code | Product | Item Code | Item | Manual Code | Slot |
| --- | --- | --- | --- | --- | --- |
| SR26-SP-RS-P201 | Philips Hue Essential Lightstrip 5m White | SR26-SP-RS-C1 | 간접 조명 / 조도 설정 | SR26-SP-RS-M1 | warmIndirect |
| SR26-SP-CN-P201 | IKEA VATTENKAR Desk Organizer | SR26-SP-CN-C1 | 데스크 정리 체크 | SR26-SP-CN-M1 | deskOrganizer |
| SR26-MT-CN-P201 | Moleskine Classic Notebook Black | SR26-MT-CN-C1 | 감정 기록 노트 | SR26-MT-CN-M1 | dailyJournal |
| SR26-MT-RC-P201 | kSafe Time Locking Container | SR26-MT-RC-C1 | 디지털 차단 도구 | SR26-MT-RC-M1 | lockBox |
| SR26-SY-RS-P201 | Time Timer MOD 120 Minute | SR26-SY-RS-C1 | 시간 기록 트래커 | SR26-SY-RS-M1 | visualTimer |
| SR26-BD-FT-P201 | NatraCure FlexiKold Neck Gel Cold Pack with Straps | SR26-BD-FT-C1 | 뒷목 아이스팩 | SR26-BD-FT-M1 | neckColdPack |

## Generator Result

```json
{
  "ready": 9,
  "review": 0,
  "needsItem": 1,
  "generatedProducts": 32,
  "crawlBatchProducts": 23,
  "generatedProductGroups": 26
}
```

## Gap Impact

| Metric | Before Batch 4 | After Batch 4 |
| --- | ---: | ---: |
| Real products | 26 | 32 |
| Items with no real product | 64 | 58 |
| Manuals with no real product through linked items | 64 | 58 |

## Data QA

Checked all 6 Batch 4 products.

- Product record exists: pass
- Item exists: pass
- Manual exists: pass
- Slot exists on item: pass
- Product has imageUrl: pass
- Product has productLink: pass
- Product has recommendationReason / target / actualUse / caution: pass
- Item productCodes includes product code: pass

## Notes

- No new Item or Manual was created in this batch.
- Product Slot presets were added in generated preview flow for existing items that previously had no slots.
- These products are connected to existing Item / Manual records and remain safe for generated-preview validation.
