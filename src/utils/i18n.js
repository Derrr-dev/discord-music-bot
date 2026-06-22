const i18next = require("i18next");
const en = require("../locales/en.json");
const id = require("../locales/id.json");

async function initI18n() {
  await i18next.init({
    lng: process.env.DEFAULT_LANGUAGE || "id",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      id: { translation: id },
    },
    interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
  });
}

function t(key, lang = "id", vars) {
  return i18next.t(key, { lng: lang, ...(vars || {}) });
}

const supportedLanguages = [
  { code: "id", name: "Indonesian (Bahasa Indonesia)" },
  { code: "en", name: "English" },
];

function isValidLanguage(code) {
  return supportedLanguages.some(l => l.code === code);
}

module.exports = { initI18n, t, supportedLanguages, isValidLanguage };
