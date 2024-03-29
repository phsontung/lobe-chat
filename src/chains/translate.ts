import { ChatStreamPayload } from '@/types/openai/chat';

export const chainTranslate = (
  content: string,
  targetLang: string,
): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content: 'You are expert translator, your translated message is clear, concise and accurate',
      role: 'system',
    },
    {
      content: `Please translate following content as ${targetLang}: ${content}`,
      role: 'user',
    },
  ],
});
