import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = `Extract ALL data from this invoice/bill...
         Extract ALL data from this invoice/bill and You MUST return ONLY a valid JSON array (no markdown, no explanation) with this structure:

{
  "vendor": {
    "name": "Company Name",
    "gstin": "GSTIN if visible",
  },
  "invoice": {
    "bill number": "INV-123",
    "bill date": "2024-01-15",
    "total amount": 50000.00,
  },
  "products": [
    {
      "name": "Product name",
      "part_number": "P123",
      "quantity": 10,
      "unit": "pcs",
      "price": 4100.00,
      "hsn_code": "8708",
      "gst_percentage": 18,
      "discount": 0,
      "confidence": 0.9
    }
  ]
}

Rules:
- Extract ALL visible products
- "price" is the PURCHASE rate (unit price before tax)
- Ensure all amounts are numbers
- "gst_percentage" should be the tax rate number (e.g., 5, 12, 18, 28)
- "discount" is the discount PERCENTAGE (if visible)
- Use standard units (pcs, kg, etc.)
- Set confidence 0.5-1.0
- Return empty array [] if data  no found
- Return ONLY valid JSON
- "CRITICAL: Return ONLY valid JSON with NO spaces before colons. Format: \"key\":value not \"key\" :value"
        
        
        `; // Your existing prompt

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
        ]
      }],
      config: { temperature: 0.1, maxOutputTokens: 8192 }
    });

    const rawText = typeof response.text === 'function' ? response.text() : response.text;

    // Return raw response for client-side parsing
    return NextResponse.json({ rawText });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}