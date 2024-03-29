import { Mock, describe, expect, it, vi } from 'vitest';

import { chatHelpers } from '@/store/chat/helpers';
import { globalHelpers } from '@/store/global/helpers';
import { OpenAIChatMessage } from '@/types/openai/chat';

import { chainSummaryTitle } from '../summaryTitle';

// Mock the getCurrentLanguage function
vi.mock('@/store/global/helpers', () => ({
  globalHelpers: {
    getCurrentLanguage: vi.fn(),
  },
}));

// Mock the chatHelpers.getMessagesTokenCount function
vi.mock('@/store/chat/helpers', () => ({
  chatHelpers: {
    getMessagesTokenCount: vi.fn(),
  },
}));

describe('chainSummaryTitle', () => {
  it('should create a payload with system and user messages and select the appropriate model based on token count', async () => {
    // Arrange
    const messages: OpenAIChatMessage[] = [
      { content: 'Hello, how can I assist you?', role: 'assistant' },
      { content: 'I need help with my account.', role: 'user' },
    ];
    const currentLanguage = 'en-US';
    const tokenCount = 17000; // Arbitrary token count above the GPT-3.5 limit
    (globalHelpers.getCurrentLanguage as Mock).mockReturnValue(currentLanguage);
    (chatHelpers.getMessagesTokenCount as Mock).mockResolvedValue(tokenCount);

    // Act
    const result = await chainSummaryTitle(messages);

    // Assert
    expect(result).toEqual({
      messages: [
        {
          content:
            "You are an assistant who is good at conversation. You need to summarize the user's conversation into a title within 10 words.",
          role: 'system',
        },
        {
          content: `assistant: Hello, how can I assist you?\nuser: I need help with my account.

          Please summarize the above conversation into a title within 10 words. No punctuation is required. The output language is：${currentLanguage}`,
          role: 'user',
        },
      ],
      model: 'gpt-4-turbo-preview',
    });

    // Verify that getMessagesTokenCount was called with the correct messages
    expect(chatHelpers.getMessagesTokenCount).toHaveBeenCalledWith([
      {
        content:
          "You are an assistant who is good at conversation. You need to summarize the user's conversation into a title within 10 words.",
        role: 'system',
      },
      {
        content: `assistant: Hello, how can I assist you?\nuser: I need help with my account.

        Please summarize the above conversation into a title within 10 words. No punctuation is required. The output language is：${currentLanguage}`,
        role: 'user',
      },
    ]);
  });

  it('should use the default model if the token count is below the GPT-3.5 limit', async () => {
    // Arrange
    const messages: OpenAIChatMessage[] = [
      { content: 'Hello, how can I assist you?', role: 'assistant' },
      { content: 'I need help with my account.', role: 'user' },
    ];
    const currentLanguage = 'en-US';
    const tokenCount = 10000; // Arbitrary token count below the GPT-3.5 limit
    (globalHelpers.getCurrentLanguage as Mock).mockReturnValue(currentLanguage);
    (chatHelpers.getMessagesTokenCount as Mock).mockResolvedValue(tokenCount);

    // Act
    const result = await chainSummaryTitle(messages);

    // Assert
    expect(result).toEqual({
      messages: [
        {
          content:
            "You are an assistant who is good at conversation. You need to summarize the user's conversation into a title within 10 words.",
          role: 'system',
        },
        {
          content: `assistant: Hello, how can I assist you?\nuser: I need help with my account.

          Please summarize the above conversation into a title within 10 words. No punctuation is required. The output language is：${currentLanguage}`,
          role: 'user',
        },
      ],
      // No model specified since the token count is below the limit
    });

    // Verify that getMessagesTokenCount was called with the correct messages
    expect(chatHelpers.getMessagesTokenCount).toHaveBeenCalledWith([
      {
        content:
          "You are an assistant who is good at conversation. You need to summarize the user's conversation into a title within 10 words.",
        role: 'system',
      },
      {
        content: `assistant: Hello, how can I assist you?\nuser: I need help with my account.

        Please summarize the above conversation into a title within 10 words. No punctuation is required. The output language is：${currentLanguage}`,
        role: 'user',
      },
    ]);
  });
});
