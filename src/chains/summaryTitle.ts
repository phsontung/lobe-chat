import { chatHelpers } from '@/store/chat/helpers';
import { globalHelpers } from '@/store/global/helpers';
import { ChatStreamPayload, OpenAIChatMessage } from '@/types/openai/chat';

export const chainSummaryTitle = async (
  messages: OpenAIChatMessage[],
): Promise<Partial<ChatStreamPayload>> => {
  const lang = globalHelpers.getCurrentLanguage();

  const finalMessages: OpenAIChatMessage[] = [
    {
      content:
        "You are an assistant who is good at conversation. You need to summarize the user's conversation into a title within 10 words.",
      role: 'system',
    },
    {
      content: `${messages.map((message) => `${message.role}: ${message.content}`).join('\n')}

      Please summarize the above conversation into a title within 10 words. No punctuation is required. The output language is：${lang}`,
      role: 'user',
    },
  ];
  // 如果超过 16k，则使用 GPT-4-turbo 模型
  const tokens = await chatHelpers.getMessagesTokenCount(finalMessages);
  let model: string | undefined = undefined;
  if (tokens > 16_000) {
    model = 'gpt-4-turbo-preview';
  }

  return {
    messages: finalMessages,
    model,
  };
};
