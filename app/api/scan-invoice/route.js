import { NextResponse } from 'next/server';
import { generateGeminiContentWithFailover } from '../_lib/geminiFailover';

const extractJsonObject = (text) => {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return cleaned.slice(start, end + 1);
};

const isValidInvoiceJson = (text) => {
  try {
    const jsonStr = extractJsonObject(text);
    if (!jsonStr) return false;
    const parsed = JSON.parse(jsonStr);
    return parsed && Array.isArray(parsed.products);
  } catch {
    return false;
  }
};

// ==========================================================================
// GROQ/GROK CODE - COMMENTED OUT (using Gemini instead)
// ==========================================================================

// const extractGroqText = (payload) => {
//   if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
//     return payload.output_text.trim();
//   }
//
//   const outputBlocks = Array.isArray(payload?.output) ? payload.output : [];
//   const outputTexts = outputBlocks
//     .flatMap((block) => (Array.isArray(block?.content) ? block.content : []))
//     .map((part) => part?.text)
//     .filter((text) => typeof text === 'string' && text.trim())
//     .map((text) => text.trim());
//
//   if (outputTexts.length > 0) {
//     return outputTexts.join('\n');
//   }
//
//   const fallbackChoice = payload?.choices?.[0]?.message?.content;
//   if (typeof fallbackChoice === 'string' && fallbackChoice.trim()) {
//     return fallbackChoice.trim();
//   }
//
//   return '';
// };

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    // const hasImage = typeof imageBase64 === 'string' && imageBase64.trim().length > 0;
    // const useGroqTextTest = process.env.USE_GROQ_TEST === 'true' && !hasImage;
    // const useGroqVision = process.env.USE_GROQ_VISION === 'true' && hasImage;

    // if (useGroqTextTest) {
    //   if (!process.env.GROQ_API_KEY) {
    //     return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    //   }
    //
    //   const groqResponse = await fetch('https://api.groq.com/openai/v1/responses', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    //     },
    //     body: JSON.stringify({
    //       model: 'openai/gpt-oss-20b',
    //       input: input || 'Explain the importance of fast language models'
    //     })
    //   });
    //
    //   if (!groqResponse.ok) {
    //     const errorBody = await groqResponse.text();
    //     return NextResponse.json(
    //       { error: `Groq API error: ${errorBody}` },
    //       { status: groqResponse.status }
    //     );
    //   }
    //
    //   const data = await groqResponse.json();
    //   const rawText = extractGroqText(data);
    //
    //   if (!rawText) {
    //     return NextResponse.json(
    //       { error: 'Groq returned an empty response. Set USE_GROQ_TEST=false to use Gemini scanner.' },
    //       { status: 502 }
    //     );
    //   }
    //
    //   return NextResponse.json({ rawText });
    // }

    // if (useGroqVision) {
    //   if (!process.env.GROQ_API_KEY) {
    //     return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    //   }
    //
    //   const prompt = `Extract ALL data from this invoice/bill and return ONLY valid JSON with this structure:
    //   {
    //     "vendor": {
    //       "name": "Company Name",
    //       "gstin": "GSTIN if visible"
    //     },
    //     "invoice": {
    //       "bill number": "INV-123",
    //       "bill date": "2024-01-15",
    //       "total amount": 50000.00
    //     },
    //     "products": [
    //       {
    //         "name": "Product name",
    //         "part_number": "P123",
    //         "quantity": 10,
    //         "unit": "pcs",
    //         "price": 4100.00,
    //         "hsn_code": "8708",
    //         "gst_percentage": 18,
    //         "discount": 0,
    //         "confidence": 0.9
    //       }
    //     ]
    //   }
    //
    //   Rules:
    //   - Extract ALL visible products
    //   - "price" is PURCHASE rate (unit price before tax)
    //   - Ensure numeric fields are numbers
    //   - Return ONLY JSON, no markdown or explanation
    //   - If value missing, use empty string for text and 0 for numbers`;
    //
    //   const visionModel = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
    //   const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
    //
    //   const groqResponse = await fetch('https://api.groq.com/openai/v1/responses', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    //     },
    //     body: JSON.stringify({
    //       model: visionModel,
    //       input: [
    //         {
    //           role: 'user',
    //           content: [
    //             { type: 'input_text', text: prompt },
    //             { type: 'input_image', image_url: imageUrl, detail: 'auto' }
    //           ]
    //         }
    //       ]
    //     })
    //   });
    //
    //   if (!groqResponse.ok) {
    //     const errorBody = await groqResponse.text();
    //     return NextResponse.json(
    //       { error: `Groq Vision API error: ${errorBody}` },
    //       { status: groqResponse.status }
    //     );
    //   }
    //
    //   const data = await groqResponse.json();
    //   const rawText = extractGroqText(data);
    //
    //   if (!rawText) {
    //     return NextResponse.json(
    //       { error: 'Groq Vision returned an empty response.' },
    //       { status: 502 }
    //     );
    //   }
    //
    //   return NextResponse.json({ rawText });
    // }

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
- before giving the data calculate yourself, if the total amount is sum of (unit_price+gst-discount)*quantity of every product
- "CRITICAL: Return ONLY valid JSON with NO spaces before colons. Format: \"key\":value not \"key\" :value"
        
        
        `; // Your existing prompt

    const { response } = await generateGeminiContentWithFailover({
      model: 'gemini-2.5-pro',
      fallbackModels: ['gemini-2.5-flash-lite', 'gemini-2.0-flash'],
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
        ]
      }],
      config: { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' }
    });

    let rawText = typeof response.text === 'function' ? response.text() : response.text;

    if (!isValidInvoiceJson(rawText)) {
      const repairPrompt = `Fix this into valid JSON only. Return one JSON object with keys "vendor", "invoice", "products" where "products" is always an array. No markdown or explanation.\n\n${rawText}`;
      const { response: repairedResponse } = await generateGeminiContentWithFailover({
        model: 'gemini-2.5-pro',
        fallbackModels: ['gemini-2.5-flash-lite', 'gemini-2.0-flash'],
        contents: [{ parts: [{ text: repairPrompt }] }],
        config: { temperature: 0, maxOutputTokens: 4096, responseMimeType: 'application/json' }
      });

      rawText = typeof repairedResponse.text === 'function' ? repairedResponse.text() : repairedResponse.text;
    }

    // Return raw response for client-side parsing
    return NextResponse.json({ rawText });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
