import { produce } from 'immer';
import { StateCreator } from 'zustand/vanilla';

import { chainLangDetect } from '@/chains/langDetect';
import { chainTranslate } from '@/chains/translate';
import { TraceNameMap, TracePayload } from '@/const/trace';
import { supportLocales } from '@/locales/resources';
import { chatService } from '@/services/chat';
import { messageService } from '@/services/message';
import { chatSelectors } from '@/store/chat/selectors';
import { ChatStore } from '@/store/chat/store';
import { useGlobalStore } from '@/store/global';
import { settingsSelectors } from '@/store/global/selectors';
import { ChatTTS, ChatTranslate } from '@/types/message';
import { GlobalTranslationConfig } from '@/types/settings';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('enhance');

/**
 * enhance chat action like translate,tts
 */
export interface ChatEnhanceAction {
  clearTTS: (id: string) => Promise<void>;
  clearTranslate: (id: string) => Promise<void>;
  getCurrentTracePayload: (data: Partial<TracePayload>) => TracePayload;
  getCurrentTranslationSetting: () => GlobalTranslationConfig;
  translateMessage: (id: string, targetLang: string) => Promise<void>;
  ttsMessage: (
    id: string,
    state?: { contentMd5?: string; file?: string; voice?: string },
  ) => Promise<void>;
  updateMessageTTS: (id: string, data: Partial<ChatTTS> | false) => Promise<void>;
  updateMessageTranslate: (id: string, data: Partial<ChatTranslate> | false) => Promise<void>;
}

export const chatEnhance: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatEnhanceAction
> = (set, get) => ({
  clearTTS: async (id) => {
    await get().updateMessageTTS(id, false);
  },

  clearTranslate: async (id) => {
    await get().updateMessageTranslate(id, false);
  },
  getCurrentTracePayload: (data) => ({
    sessionId: get().activeId,
    topicId: get().activeTopicId,
    ...data,
  }),
  getCurrentTranslationSetting: () => {
    return settingsSelectors.currentSystemAgent(useGlobalStore.getState()).translation;
  },

  translateMessage: async (id, targetLang) => {
    const { toggleChatLoading, updateMessageTranslate, dispatchMessage } = get();

    const message = chatSelectors.getMessageById(id)(get());
    if (!message) return;

    // Get current agent for translation
    const translationSetting = get().getCurrentTranslationSetting();

    // create translate extra
    await updateMessageTranslate(id, { content: '', from: '', to: targetLang });

    toggleChatLoading(true, id, n('translateMessage(start)', { id }) as string);

    let content = '';
    let from = '';

    // detect from language
    chatService
      .fetchPresetTaskResult({
        params: merge(translationSetting, chainLangDetect(message.content)),
        trace: get().getCurrentTracePayload({ traceName: TraceNameMap.LanguageDetect }),
      })
      .then(async (data) => {
        if (data && supportLocales.includes(data)) from = data;

        await updateMessageTranslate(id, { content, from, to: targetLang });
      });

    // translate to target language
    await chatService.fetchPresetTaskResult({
      onMessageHandle: (text) => {
        dispatchMessage({
          id,
          key: 'translate',
          type: 'updateMessageExtra',
          value: produce({ content: '', from, to: targetLang }, (draft) => {
            content += text;
            draft.content += content;
          }),
        });
      },
      params: merge(translationSetting, chainTranslate(message.content, targetLang)),
      trace: get().getCurrentTracePayload({ traceName: TraceNameMap.Translator }),
    });

    await updateMessageTranslate(id, { content, from, to: targetLang });

    toggleChatLoading(false);
  },

  ttsMessage: async (id, state = {}) => {
    await get().updateMessageTTS(id, state);
  },

  updateMessageTTS: async (id, data) => {
    await messageService.updateMessage(id, { tts: data as ChatTTS });
    await get().refreshMessages();
  },

  updateMessageTranslate: async (id, data) => {
    await messageService.updateMessage(id, { translate: data as ChatTranslate });
    await get().refreshMessages();
  },
});
