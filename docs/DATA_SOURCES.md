# Catalogue provenance and limitations

Catalogue review date: **7 November 2026**. This is a curated, source-linked planning catalogue, not a live government feed or an eligibility determination. The app displays unknown dates as unknown; it never generates deadlines relative to the current date.

## Official sources

- [NSP scheme directory](https://scholarships.gov.in/All-Scholarships): current-cycle scheme names and published student dates. AICTE degree/diploma entries show 1 June–30 November 2026; UGC Ishan Uday opens 16 September; several other schemes close 30 November. Confirm extensions inside the portal.
- [NSP homepage](https://scholarships.gov.in/) and [student information](https://scholarships.gov.in/Students): CSSS is renewal-only. These pages showed 31 October 2026 while the directory showed 30 November. **Grantly deliberately stores no CSSS deadline** and explains the conflict.
- [CSSS guidelines](https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf): above the 80th percentile in the relevant Class XII stream; family income up to ₹4.5 lakh; ₹12,000/year UG and ₹20,000/year PG; renewal marks/attendance conditions. Percentage marks are not a percentile, so the screening result remains provisional.
- [AICTE Pragati degree guidelines](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf): women in eligible AICTE-approved degree programmes; first/lateral-entry conditions; income ceiling ₹8 lakh; ₹50,000/year; family and merit conditions. Diploma and Saksham/Swanath entries link their own directory-provided guidelines.
- [UGC postgraduate guidelines](https://scholarships.gov.in/public/schemeGuidelines/Guidelines_NATIONAL_SCHOLARSHIP_FOR_POSTGRADUATE_STUDIES_UGC_2324.pdf): first regular PG, age and institution conditions; published ₹15,000/month for ten months across two years.
- [PwD guidelines](https://scholarships.gov.in/public/schemeGuidelines/DEPDGuidelines_1.pdf): benchmark disability/UDID and family conditions; post-matric income ceiling ₹2.5 lakh.
- [YASASVI guidelines](https://scholarships.gov.in/public/schemeGuidelines/ApprovedmodifieddraftofTopClassCollege.pdf): OBC/EBC/DNT, notified institutions, income ceiling ₹2.5 lakh; tuition and prescribed allowances rather than a single universal award.
- [SC top-class guidelines](https://scholarships.gov.in/public/schemeGuidelines/Top_Class_Education_Scheme_2018.pdf): SC category, income ceiling ₹8 lakh, first-year/institution conditions and prescribed allowances. The linked document is labelled 2025–26; confirm the current cycle.
- [Ishan Uday guidelines](https://scholarships.gov.in/public/schemeGuidelines/Guidelines_ISHAN%20UDAY_2324.pdf): NER domicile **and Class XII from an NER school**, first regular UG, income below ₹4.5 lakh; ₹8,000/month for ten months. The app screens domicile region but explicitly asks users to verify the school criterion.
- [NSP eligibility checker](https://scholarships.gov.in/scholarshipEligibility): illustrates why application type, course mode, date of birth, religion and other criteria still need official verification.
- [Bihar Medhasoft](https://medhasoft.bihar.gov.in/): graduation programme and batch-specific links. Landing pages reviewed showed 2022–25 result batches, not a verified current closing date.
- [Bihar Student Credit Card](https://www.7nishchay-yuvaupmission.bihar.gov.in/) and [BSEFC portal](https://www.bsefcl.bihar.gov.in/): education-loan pathway. It is repayable financing, not a scholarship grant. Current interest, repayment, sanction and DRCC requirements must be confirmed.

## Data contract

`public/data/scholarships.json` is schema version 1. Each record has a stable numeric ID, shareable slug, HTTPS application/source links, review date, explicit deadline note and document checklist. `src/services/catalog.ts` validates the response before rendering. Missing or conflicting dates are `null`; a null income/marks value is not proof that no criterion exists. Read the complete conditions and official guidelines.

The match engine is explainable tri-state screening: matched, mismatch and unknown. Unanswered criteria never silently pass. Institution approval, admission year, percentile, concurrent awards, application mode and document authenticity are not automatically verified. The assistant is deterministic and local, not a language model or an official adviser.

## Maintenance

1. Re-check official portals and guidelines before changing a record.
2. Update the record's `verifiedAt`, the catalogue review date, and this document together.
3. Do not copy third-party deadline aggregators or fabricate a date to keep a countdown populated.
4. Run `npm run validate:data`, `npm test`, and the browser suite.
5. A banner warns when the catalogue review is more than 30 days old. Refresh retries the static asset; it does not claim to fetch live government data.
