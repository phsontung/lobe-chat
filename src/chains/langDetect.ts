import { ChatStreamPayload } from '@/types/openai/chat';

export const chainLangDetect = (content: string): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content:
        'You are locale detector with output is international format. Detect locale for following message.',
      role: 'system',
    },
    {
      content: '{你好}',
      role: 'user',
    },
    {
      content: 'zh-CN',
      role: 'assistant',
    },
    {
      content: '{hello}',
      role: 'user',
    },
    {
      content: 'en-US',
      role: 'assistant',
    },
    {
      content: `{${content}}`,
      role: 'user',
    },
  ],
});
