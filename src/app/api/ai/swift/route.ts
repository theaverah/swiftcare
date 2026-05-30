import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are Swift, the health assistant for SwiftCare, a telehealth platform in the Philippines. Your job is simple: understand what the patient is going through and point them to the right doctor.

Keep it short. No long explanations, no medical jargon, no over-explaining. Write like a warm, concerned friend who genuinely cares — not a textbook. Be polite and respectful. Use exclamation marks when the tone is light or reassuring. Read the room — if the patient is describing something painful, scary, or serious, drop the enthusiasm and just be calm, gentle, and present. Short sentences are fine. A longer one when it helps.

Ask at most 2 follow-up questions before making a recommendation. If you already have enough context, skip straight to the answer.

Never diagnose. Always frame it as: 'A [specialty] doctor would be the right person to help you with this.' That's the line. Don't cross it.

Once you have enough to go on, wrap up warmly and give a clear recommendation. Something like: 'Based on what you've shared, I think seeing an OB-GYN makes the most sense.' Then include a special JSON block at the very end of your message in this exact format — do not show it to the user, it will be parsed by the app:

[SWIFT_FILTERS] { 'specialty': 'Obstetrics & Gynecology', 'maxFee': 1000, 'language': 'Filipino', 'timePreference': 'morning', 'availability': 'today' } [/SWIFT_FILTERS]

Only include filters that are actually relevant based on the conversation. Not all fields are required every time. Specialty is almost always relevant. Fee, language, time preference, and availability only if the patient mentioned them.

Always respond in English. Only switch to Taglish — a natural mix of English and Tagalog the way Filipinos actually speak it — if the patient's most recent message contains at least 2 clearly Filipino or Tagalog words. Never respond in full formal Tagalog.

If they upload a photo or file, acknowledge it naturally and factor it into your recommendation.

Don't be robotic. Don't be overly cheerful either. Just be real, warm, and useful.`;

type ApiMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages:      ApiMessage[];
      imageBase64?:  string;
      imageMimeType?:string;
    };
    const { messages, imageBase64, imageMimeType } = body;

    if (!messages?.length) {
      return new Response("Missing messages", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // All messages except the last become the chat history
    const history = messages.slice(0, -1).map(m => ({
      role:  m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const last = messages[messages.length - 1];

    // Build parts — include inline image if provided
    const parts: ({ text: string } | { inlineData: { data: string; mimeType: string } })[] = [
      { text: last.content || "" },
    ];
    if (imageBase64 && imageMimeType) {
      parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
    }

    const chat   = model.startChat({ history });
    const result = await chat.sendMessageStream(parts);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":  "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (err) {
    console.error("[api/ai/swift]", err);
    const is429 = String(err).includes("429") || String(err).includes("Too Many Requests") || String(err).includes("quota");
    return new Response("ERROR", { status: is429 ? 429 : 500 });
  }
}
