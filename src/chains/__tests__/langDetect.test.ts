import { describe, expect, it } from 'vitest';

import { ChatStreamPayload } from '@/types/openai/chat';

import { chainLangDetect } from '../langDetect';

// 描述测试块
describe('chainLangDetect', () => {
  // 测试用例：验证函数返回的结构
  it('should return a payload with the correct structure and embedded user content', () => {
    // 用户输入的内容
    const userContent = 'Hola';

    // 预期的返回值结构
    const expectedPayload: Partial<ChatStreamPayload> = {
      messages: [
        {
          content:
            'You are a linguist who is proficient in languages from all over the world. You need to recognize the content input by the user and output it in an international standard locale.',
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
          content: `{${userContent}}`,
          role: 'user',
        },
      ],
    };

    // 执行函数并获取结果
    const result = chainLangDetect(userContent);

    // 断言结果是否符合预期
    expect(result).toEqual(expectedPayload);
  });
});
