import { NextResponse } from 'next/server';
import { generateGeminiContentWithFailover } from '../_lib/geminiFailover';

export async function POST(request) {
    try {
        const { imageBase64 } = await request.json();

        const prompt = `You are examining an image which could be a bank cheque/check OR an RTGS / NEFT / IMPS / Bank Transfer statement / mini statement / receipt. Extract all visible details from this image.

You MUST return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "document_type": "CHEQUE",
  "amount": 50000.00,
  "payee_name": "ABC Company",
  "pay_name": "ABC Company",
  "date": "2024-01-15",
  "cheque_number": "123456",
  "cheque_bank": "State Bank of India",
  "cheque_date": "2024-01-15",
  "rtgs_transaction_id": "MAHBN12026062056286764",
  "rtgs_bank": "Punjab National Bank",
  "rtgs_transfer_date": "2024-01-15",
  "account_number": "1234567890",
  "ifsc_code": "PUNB0322700",
  "notes": "Any memo, particulars, NEFT/RTGS transaction ref or remarks"
}

Rules:
- "document_type": Set to "CHEQUE" if it's a cheque, or "RTGS" if it's an RTGS/NEFT/IMPS/Bank transfer statement/receipt/mini statement.
- "amount": Must be a number (the transfer or cheque debit/credit amount). Extract from both words and figures if available. For bank statements, extract the main transaction/debit amount.
- "payee_name" / "pay_name": Name of the vendor, payee, beneficiary, or recipient (e.g. from "Pay", "NEFT ... <name>", "FRM <name>", "TO <name>", or particulars in statement).
- "date": Date of transaction or cheque in YYYY-MM-DD format.
- If document is a Cheque:
  - "cheque_number": Cheque serial number (printed at top or bottom MICR line).
  - "cheque_bank": Name of bank that issued the cheque.
  - "cheque_date": Cheque date in YYYY-MM-DD format.
- If document is RTGS/NEFT/Bank Transfer statement/receipt:
  - "rtgs_transaction_id": The UTR / UTR number / NEFT reference number / Transaction ID / Ref No (e.g. MAHBN12026062056286764, UTR number, etc.).
  - "rtgs_bank": The issuing/receiving bank name or IFSC code (e.g. PUNB0322700 -> Punjab National Bank, or bank name mentioned).
  - "rtgs_transfer_date": Transfer date in YYYY-MM-DD format.
- "account_number": Account number if visible (e.g. "TRANSFER FROM 60049787708" or mini statement account number).
- "ifsc_code": IFSC code if visible (e.g. PUNB0322700).
- "notes": Full particulars line or any additional memo text.
- If a field is not visible or unreadable, use an empty string "" for text fields and 0 for amount.
- Return ONLY valid JSON with NO markdown formatting.
- "CRITICAL: Return ONLY valid JSON with NO spaces before colons. Format: \\"key\\":value not \\"key\\" :value"
`;

        const scanStart = performance.now();
        const { response, usedModel } = await generateGeminiContentWithFailover({
            model: 'gemini-3.5-flash-lite',
            fallbackModels: ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                ]
            }],
            config: { temperature: 0.1, maxOutputTokens: 4096 }
        });
        const scanEnd = performance.now();
        console.log(`[Scan Payment] Payment scan succeeded using model: "${usedModel}" in ${((scanEnd - scanStart) / 1000).toFixed(2)}s`);

        const rawText = typeof response.text === 'function' ? response.text() : response.text;

        return NextResponse.json({ rawText });

    } catch (error) {
        console.error('Gemini Payment Scan Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
