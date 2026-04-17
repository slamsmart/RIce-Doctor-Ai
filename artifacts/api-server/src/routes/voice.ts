import { Router, type IRouter } from "express";
import { GetVoiceGuidanceBody, GetVoiceGuidanceResponse } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  th: "Thai (ภาษาไทย)",
  vi: "Vietnamese (Tiếng Việt)",
  ph: "Filipino (Tagalog)",
  jv: "Javanese (Basa Jawa)",
  su: "Sundanese (Basa Sunda)",
  ms: "Malay (Bahasa Melayu)",
};

router.post("/voice/guidance", async (req, res): Promise<void> => {
  const parsed = GetVoiceGuidanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { disease, treatment, language, cropType } = parsed.data;
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  try {
    const langInstruction = language === "en"
      ? "Respond in English."
      : language === "id"
      ? "Respond in Bahasa Indonesia."
      : language === "th"
      ? "Respond in Thai language."
      : language === "vi"
      ? "Respond in Vietnamese language."
      : language === "ph"
      ? "Respond in Filipino (Tagalog)."
      : language === "jv"
      ? "Respond in Javanese language (Basa Jawa), using simple everyday Javanese that farmers understand."
      : language === "su"
      ? "Respond in Sundanese language (Basa Sunda), using simple everyday Sundanese that farmers understand."
      : language === "ms"
      ? "Respond in Bahasa Melayu (Malaysian Malay)."
      : "Respond in English.";

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are a friendly agricultural advisor speaking directly to a farmer. ${langInstruction} Use simple, clear language a farmer can easily understand. Speak warmly and supportively. Keep the response under 150 words.`
        },
        {
          role: "user",
          content: `My ${cropType} has been diagnosed with ${disease}. The recommended treatment is: ${treatment}. Please explain what I should do in simple words that I can follow step by step.`
        }
      ],
    });

    const text = response.choices[0]?.message?.content ?? `Your ${cropType} has been diagnosed. Please follow the treatment instructions provided.`;

    res.json(GetVoiceGuidanceResponse.parse({ text, language, languageName }));
  } catch (err) {
    logger.error({ err }, "Voice guidance generation failed");
    res.status(500).json({ error: "Failed to generate voice guidance" });
  }
});

export default router;
