import { Form, type ItemGroup } from '@lobehub/ui';
import { Form as AntForm , Select, SelectProps } from 'antd';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { Webhook } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSyncSettings } from '@/app/settings/hooks/useSyncSettings';
import { ModelItemRender, ProviderItemRender } from '@/components/ModelSelect';
import { FORM_STYLE } from '@/const/layoutTokens';
import { useGlobalStore } from '@/store/global';
import { settingsSelectors , modelProviderSelectors } from '@/store/global/selectors';
import { ModelProviderCard } from '@/types/llm';

const TRANSLATION_SETTING_KEY = 'translation';

type SettingItemGroup = ItemGroup;

const useStyles = createStyles(({ css, prefixCls }) => ({
  select: css`
    .${prefixCls}-select-dropdown .${prefixCls}-select-item-option-grouped {
      padding-inline-start: 12px;
    }
  `,
}));
interface ModelOption {
  label: any;
  provider: string;
  value: string;
}

const Translation = memo(() => {
  const { t } = useTranslation('setting');
  const [form] = AntForm.useForm();

  const settings = useGlobalStore(settingsSelectors.currentSettings, isEqual);
  const [setSettings] = useGlobalStore((s) => [s.setSettings]);

  const select = useGlobalStore(modelProviderSelectors.modelSelectList, isEqual);

  const { styles } = useStyles();

  const enabledList = select.filter((s) => s.enabled);

  const options = useMemo<SelectProps['options']>(() => {
    const getChatModels = (provider: ModelProviderCard) =>
      provider.chatModels
        .filter((c) => !c.hidden)
        .map((model) => ({
          label: <ModelItemRender {...model} />,
          provider: provider.id,
          value: model.id,
        }));

    if (enabledList.length === 1) {
      const provider = enabledList[0];

      return getChatModels(provider);
    }

    return enabledList.map((provider) => ({
      label: <ProviderItemRender provider={provider.id} />,
      options: getChatModels(provider),
    }));
  }, [enabledList]);

  const commonTranslation: SettingItemGroup = {
    children: [
      {
        children: (
          <Select
            className={styles.select}
            onChange={(model, option) => {
              setSettings({
                translation: {
                  model,
                  provider: (option as unknown as ModelOption).provider,
                },
              });
            }}
            options={options}
            popupMatchSelectWidth={false}
          />
        ),
        desc: t('settingSystem.translation.modelDesc'),
        label: t('settingSystem.translation.label'),
        name: [TRANSLATION_SETTING_KEY, 'model'],
        tag: 'model',
      },
    ],
    icon: Webhook,
    title: t('settingSystem.translation.title'),
  };

  useSyncSettings(form);

  return (
    <Form
      form={form}
      initialValues={settings}
      items={[commonTranslation]}
      // onValuesChange={debounce(setSettings, 100)}
      {...FORM_STYLE}
    />
  );
});

export default Translation;
