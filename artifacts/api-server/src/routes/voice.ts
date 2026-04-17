import { Router, type IRouter } from "express";
import { GetVoiceGuidanceBody, GetVoiceGuidanceResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_TEXT_MODEL = process.env.DASHSCOPE_TEXT_MODEL ?? "qwen-plus-latest";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  th: "Thai",
  vi: "Vietnamese",
  ph: "Filipino (Tagalog)",
  jv: "Javanese",
  su: "Sundanese",
  ms: "Malay",
};

async function generateVoiceGuidance(input: {
  disease: string;
  treatment: string;
  language: string;
  cropType: string;
  languageName: string;
}): Promise<string> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error("DASHSCOPE_API_KEY must be set to generate voice guidance with Qwen.");
  }

  const langInstruction = input.language === "en"
    ? "Respond in English."
    : input.language === "id"
    ? "Respond in Bahasa Indonesia."
    : input.language === "th"
    ? "Respond in Thai."
    : input.language === "vi"
    ? "Respond in Vietnamese."
    : input.language === "ph"
    ? "Respond in Filipino (Tagalog)."
    : input.language === "jv"
    ? "Respond in Javanese using simple everyday Basa Jawa that farmers understand."
    : input.language === "su"
    ? "Respond in Sundanese using simple everyday Basa Sunda that farmers understand."
    : input.language === "ms"
    ? "Respond in Bahasa Melayu."
    : "Respond in English.";

  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DASHSCOPE_TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a friendly agricultural advisor speaking directly to a farmer. ${langInstruction}
Use simple, clear language a farmer can easily understand. Speak warmly and supportively.
Keep the response under 150 words and make it easy to read aloud as voice guidance.`,
        },
        {
          role: "user",
          content: `My ${input.cropType} has been diagnosed with ${input.disease}.
The recommended treatment is: ${input.treatment}.
Please explain what I should do in simple words that I can follow step by step.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 350,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope voice guidance failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  return typeof rawContent === "string"
    ? rawContent
    : rawContent?.find((item) => item.type === "text")?.text
      ?? `Your ${input.cropType} has been diagnosed. Please follow the treatment instructions provided.`;
}

router.post("/voice/guidance", async (req, res): Promise<void> => {
  const parsed = GetVoiceGuidanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { disease, treatment, language, cropType } = parsed.data;
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  try {
    const text = await generateVoiceGuidance({
      disease,
      treatment,
      language,
      cropType,
      languageName,
    });

    res.json(GetVoiceGuidanceResponse.parse({ text, language, languageName }));
  } catch (err) {
    logger.error({ err }, "Voice guidance generation failed");
    res.status(500).json({ error: "Failed to generate voice guidance" });
  }
});

export default router;
