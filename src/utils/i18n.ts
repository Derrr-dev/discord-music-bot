import i18next from "i18next";
import en from "../locales/en.json";
import id from "../locales/id.json";

export async function initI18n() {
  await i18next.init({
    lng: process.env.DEFAULT_LANGUAGE || "id",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      id: { translation: id },
    },
    interpolation: { escapeValue: false },
  });
}

export function t(
  key: string,
  lang: string = "id",
  vars?: Record<string, string | number>
): string {
  return i18next.t(key, { lng: lang, ...vars });
}

export const supportedLanguages = [
  { code: "id", name: "Indonesian (Bahasa Indonesia)" },
  { code: "en", name: "English" },
];

export function isValidLanguage(code: string): boolean {
  return supportedLanguages.some((l) => l.code === code);
}
