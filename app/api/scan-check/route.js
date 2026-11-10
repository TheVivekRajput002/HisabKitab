import { NextResponse } from 'next/server';
import { generateGeminiContentWithFailover } from '../_lib/geminiFailover';

export async function POST(request) {
    try {
        const { imageBase64, vendors } = await request.json();

        // Optional list of the company's vendors so the AI can pick the right one
        const vendorList = Array.isArray(vendors)
            ? vendors
                .filter((v) => v && v.id != null && v.name)
                .slice(0, 1500)
                .map((v) => `${v.id} | ${String(v.name).replace(/\s+/g, ' ').trim()}${v.gstin ? ` | GSTIN: ${v.gstin}` : ''}`)
            : [];

        const vendorSection = vendorList.length > 0
            ? `
VENDOR MATCHING:
Below is the list of known vendors (format: "id | name | GSTIN"). Decide which vendor this payment belongs to (the party RECEIVING the money - see rules above).
Match intelligently: ignore prefixes/suffixes like M/s, Shri, Shree, Pvt Ltd, Enterprises vs Ent., handle abbreviations/initials, spelling and OCR mistakes, and Hindi/Devanagari names transliterated to English (e.g. "ट्रैक्टर हाउस" = "Tractor House").
- "matched_vendor_id": the exact id (as written in the list) of the best matching vendor, or "" if no vendor in the list reasonably matches. NEVER invent an id.
- "matched_vendor_name": the vendor name exactly as written in the list, or "".
- "vendor_match_confidence": integer 0-100 for how sure you are of the match (0 if no match).

VENDOR LIST:
${vendorList.join('\n')}
`
            : `
- "matched_vendor_id": "", "matched_vendor_name": "", "vendor_match_confidence": 0 (no vendor list was provided).
`;

        const prompt = `You are examining an image of a payment document from an Indian business. It can be:
1. A bank CHEQUE.
2. An RTGS / NEFT / IMPS / UPI / Bank Transfer statement, mini statement or bank transfer slip.
3. A RECEIPT / money receipt / cash receipt (printed receipt book page, often handwritten, may be in Hindi or English) issued BY the vendor acknowledging money received ("Received with thanks from ...").
Extract all visible details.

You MUST return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "document_type": "CHEQUE",
  "amount": 50000.00,
  "payee_name": "ABC Company",
  "pay_name": "ABC Company",
  "received_from": "",
  "date": "2024-01-15",
  "cheque_number": "123456",
  "cheque_bank": "State Bank of India",
  "cheque_date": "2024-01-15",
  "rtgs_transaction_id": "MAHBN12026062056286764",
  "rtgs_bank": "Punjab National Bank",
  "rtgs_transfer_date": "2024-01-15",
  "receipt_number": "",
  "receipt_issued_by": "",
  "account_number": "1234567890",
  "ifsc_code": "PUNB0322700",
  "notes": "Any memo, particulars, NEFT/RTGS transaction ref or remarks",
  "matched_vendor_id": "",
  "matched_vendor_name": "",
  "vendor_match_confidence": 0
}

Rules:
- "document_type": "CHEQUE" for a cheque, "RTGS" for RTGS/NEFT/IMPS/UPI/bank transfer statements or slips, "RECEIPT" for a receipt / money receipt issued by a business (a page titled "RECEIPT", "Money Receipt", "रसीद", with "Received with thanks from", "the sum of Rs." etc.).
- "amount": Must be a number (float/int). CAREFULLY cross-check numbers with words! A trailing slash and dash like "/-" or "=/-" is NOT extra zeros (e.g. "5000/-" is five thousand, NOT 50000). Always verify with amount in words (e.g. "पाँच हजार मात्र" = 5000, "दस हजार" = 10000, "पचास हजार" = 50000). For bank statements use the main transaction/debit amount.
- "payee_name" / "pay_name": The VENDOR, i.e. the party who RECEIVES the money:
  - CHEQUE: the name after "Pay".
  - RTGS: the beneficiary / recipient name (e.g. from "NEFT ... <name>", "TO <name>", or particulars).
  - RECEIPT: the business that ISSUED the receipt - the printed letterhead/business name at the top, also usually repeated near the signature as "For: <name>". It is NOT the "Received with thanks from M/s ..." party (that is the payer, i.e. our own company).
  - Write the name in English letters (transliterate Hindi if needed).
- "received_from": For RECEIPT only, the party written after "Received with thanks from" (transliterated to English). Otherwise "".
- "date": Date of transaction/cheque/receipt in YYYY-MM-DD format. Indian dates are written DD/MM/YY or DD/MM/YYYY (e.g. "6/11/26" = 2026-11-06).
- If document is a Cheque:
  - "cheque_number": Cheque serial number (printed at top or bottom MICR line).
  - "cheque_bank": Name of bank that issued the cheque.
  - "cheque_date": Cheque date in YYYY-MM-DD format.
- If document is RTGS/NEFT/Bank Transfer statement:
  - "rtgs_transaction_id": The UTR / NEFT reference number / Transaction ID / Ref No.
  - "rtgs_bank": The bank name (or derived from IFSC, e.g. PUNB0322700 -> Punjab National Bank).
  - "rtgs_transfer_date": Transfer date in YYYY-MM-DD format.
- If document is a RECEIPT:
  - "receipt_number": The printed/written receipt number (e.g. "No. 4403" -> "4403").
  - "receipt_issued_by": The name of the business that issued the receipt (same as payee_name).
  - If a real cheque number or UTR number is written on the receipt, also fill "cheque_number" / "rtgs_transaction_id". Ignore non-numeric placeholders like "O.K." or "-".
  - "notes": Short summary like "Receipt No. 4403 from Tractor House" plus anything notable written on it.
- "account_number": Account number if visible.
- "ifsc_code": IFSC code if visible.
- "notes": Full particulars line or any additional memo text.
- If a field is not visible or unreadable, use an empty string "" for text fields and 0 for amount.
${vendorSection}
- Return ONLY valid JSON with NO markdown formatting.
- "CRITICAL: Return ONLY valid JSON with NO spaces before colons. Format: \\"key\\":value not \\"key\\" :value"
`;

        const scanStart = performance.now();
        const { response, usedModel } = await generateGeminiContentWithFailover({
            model: 'gemini-3.5-flash-lite',
            fallbackModels: ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                ]
            }],
            config: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' }
        });
        const scanEnd = performance.now();
        console.log(`[Scan Payment] Payment scan succeeded using model: "${usedModel}" in ${((scanEnd - scanStart) / 1000).toFixed(2)}s`);

        const rawText = typeof response.text === 'function' ? response.text() : response.text;

        let parsed = null;
        try {
            const start = rawText.indexOf('{');
            const end = rawText.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                let jsonStr = rawText.substring(start, end + 1);
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
                parsed = JSON.parse(jsonStr);
                if (parsed.vendor_match_confidence && parsed.vendor_match_confidence <= 1 && parsed.vendor_match_confidence > 0) {
                    parsed.vendor_match_confidence = Math.round(parsed.vendor_match_confidence * 100);
                }
            }
        } catch (e) {
            console.warn('[Scan Payment] Failed to parse JSON on server:', e);
        }

        return NextResponse.json({ rawText, data: parsed });

    } catch (error) {
        console.error('Gemini Payment Scan Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
