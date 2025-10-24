import { GoogleGenAI, GenerateContentResponse, Content, Modality } from "@google/genai";
import { Message, Source, TTSVoice, Settings } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const modelConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
};

function messagesToHistory(messages: Message[]): Content[] {
  return messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));
}

const createPersonalizedConfig = (baseConfig: any, settings: Settings) => {
    let systemInstruction = `You are a helpful AI assistant named Study AI. It's very important that you remember the context of the conversation and build upon previous questions and answers to provide a continuous dialogue.`;

    if (settings.userName) {
        systemInstruction = `You are a helpful AI assistant named Study AI. The user's name is ${settings.userName}. Please be friendly and address them by their name where it feels natural. It's very important that you remember the context of the conversation and build upon previous questions and answers to provide a continuous, personal dialogue.`;
    }

    if (settings.memory && settings.memory.length > 0) {
        const memoryFacts = settings.memory.filter(mem => mem.key && mem.value).map(mem => `${mem.key}: ${mem.value}`).join('; ');
        if (memoryFacts) {
            systemInstruction += `\n\nAdditionally, remember these key facts about the user for this conversation: ${memoryFacts}. Use these facts to tailor your responses.`;
        }
    }
    
    const config = { ...baseConfig };
    config.systemInstruction = systemInstruction;
    return config;
};


export async function getStandardResponse(prompt: string, history: Message[], settings: Settings): Promise<{ text: string, sources?: Source[] }> {
  const model = 'gemini-2.5-flash';
  const chatHistory = messagesToHistory(history);
  const response = await ai.models.generateContent({
    model: model,
    contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
    config: createPersonalizedConfig(modelConfig, settings)
  });
  return { text: response.text };
}

export async function getLiteResponse(prompt: string, history: Message[], settings: Settings): Promise<{ text: string, sources?: Source[] }> {
  const model = 'gemini-flash-lite-latest';
  const chatHistory = messagesToHistory(history);
  const response = await ai.models.generateContent({
    model: model,
    contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
    config: createPersonalizedConfig(modelConfig, settings)
  });
  return { text: response.text };
}

export async function getThinkingResponse(prompt: string, history: Message[], settings: Settings): Promise<{ text: string, sources?: Source[] }> {
  const model = 'gemini-2.5-pro';
  const chatHistory = messagesToHistory(history);
  const response = await ai.models.generateContent({
    model: model,
    contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
    config: createPersonalizedConfig({
      ...modelConfig,
      thinkingConfig: { thinkingBudget: 32768 },
    }, settings),
  });
  return { text: response.text };
}

export async function getSearchResponse(prompt: string, history: Message[], settings: Settings): Promise<{ text: string, sources?: Source[] }> {
  const model = 'gemini-2.5-flash';
  const chatHistory = messagesToHistory(history);
  const response = await ai.models.generateContent({
    model: model,
    contents: [...chatHistory, { role: 'user', parts: [{ text: prompt }] }],
    config: createPersonalizedConfig({
      ...modelConfig,
      tools: [{ googleSearch: {} }],
    }, settings),
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources: Source[] = groundingChunks
    ?.map((chunk: any) => ({
      uri: chunk.web?.uri,
      title: chunk.web?.title,
    }))
    .filter((source: Source) => source.uri && source.title) || [];

  return { text: response.text, sources };
}

export async function getTextToSpeech(text: string, voice: TTSVoice): Promise<string | undefined> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export { ai };