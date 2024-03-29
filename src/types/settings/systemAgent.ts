export interface GlobalTranslationConfig {
  model: string;
  provider: string;
}

export interface GlobalFunctionConfig {
  model: string;
  provider: string;
}

export interface GlobalSystemAgentConfig {
  function: GlobalFunctionConfig;
  translation: GlobalTranslationConfig;
}
