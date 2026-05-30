export interface DoctorRecommendation {
  specialization: string;
  severity: "low" | "medium" | "high";
  keywords: string[];
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const recommendationSchema = {
  type: "OBJECT",
  properties: {
    specialization: {
      type: "STRING"
    },
    severity: {
      type: "STRING",
      enum: ["low", "medium", "high"]
    },
    keywords: {
      type: "ARRAY",
      items: {
        type: "STRING"
      }
    }
  },
  required: ["specialization", "severity", "keywords"],
  propertyOrdering: ["specialization", "severity", "keywords"]
};

const parseRecommendation = (rawText: string): DoctorRecommendation => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini returned an invalid recommendation format.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Gemini returned an invalid recommendation format.");
  }

  const recommendation = parsed as Partial<DoctorRecommendation>;
  const severity = recommendation.severity;
  const isValidSeverity = severity === "low" || severity === "medium" || severity === "high";

  if (
    typeof recommendation.specialization !== "string" ||
    !recommendation.specialization.trim() ||
    !isValidSeverity ||
    !Array.isArray(recommendation.keywords)
  ) {
    throw new Error("Gemini returned an incomplete recommendation.");
  }

  return {
    specialization: recommendation.specialization.trim(),
    severity,
    keywords: recommendation.keywords
      .filter((keyword): keyword is string => typeof keyword === "string")
      .map((keyword) => keyword.trim())
      .filter(Boolean)
  };
};

export const geminiApi = {
  async recommendDoctorSpecialization(symptoms: string): Promise<DoctorRecommendation> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const prompt = [
      "You are a medical triage assistant for a telehealth doctor directory.",
      "Return ONLY valid JSON with this exact shape:",
      '{"specialization": string, "severity": "low" | "medium" | "high", "keywords": string[]}',
      "Choose one doctor specialization that best matches the patient's symptoms.",
      "Do not include markdown, explanations, comments, or natural language.",
      `Patient symptoms: ${symptoms}`
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: recommendationSchema
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error("Unable to generate doctor recommendations.");
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const recommendationText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!recommendationText) {
      throw new Error("Gemini returned an empty recommendation.");
    }

    return parseRecommendation(recommendationText);
  }
};
