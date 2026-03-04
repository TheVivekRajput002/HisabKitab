import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { imageBase64 } = await request.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const prompt = `You are examining a bank cheque/check image. Extract all visible details from this cheque.

You MUST return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "amount": 50000.00,
  "cheque_number": "123456",
  "cheque_bank": "State Bank of India",
  "cheque_date": "2024-01-15",
  "payee_name": "ABC Company",
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234",
  "notes": "Any memo or remarks written on the cheque"
}

Rules:
- "amount" must be a number (the cheque amount). Extract from both words and figures if available.
- "cheque_number" is the cheque serial number (usually printed at the bottom or top of the cheque)
- "cheque_bank" is the name of the bank that issued the cheque
- "cheque_date" must be in YYYY-MM-DD format
- "payee_name" is who the cheque is made payable to (the "Pay" line)
- "account_number" is the account number if visible
- "ifsc_code" is the IFSC code if visible
- "notes" for any memo or remarks
- If a field is not visible or unreadable, use an empty string "" for text fields and 0 for amount
- Return ONLY valid JSON with NO markdown formatting
- "CRITICAL: Return ONLY valid JSON with NO spaces before colons. Format: \\"key\\":value not \\"key\\" :value"
`;

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                ]
            }],
            config: { temperature: 0.1, maxOutputTokens: 4096 }
        });

        const rawText = typeof response.text === 'function' ? response.text() : response.text;

        return NextResponse.json({ rawText });

    } catch (error) {
        console.error('Gemini Check Scan Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
