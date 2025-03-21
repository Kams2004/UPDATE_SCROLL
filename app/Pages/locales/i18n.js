import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import fr from './fr.json';

const getStoredLanguage = async () => {
  try {
    return await AsyncStorage.getItem('language') || 'en';
  } catch {
    return 'en';
  }
};

const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      fr: { translation: fr }
    },
    lng: storedLanguage,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: {
      useSuspense: false
    }
  });
};

initI18n();

export const changeLanguage = async (language) => {
  try {
    const normalizedLang = language.toLowerCase();
    await i18n.changeLanguage(normalizedLang);
    await AsyncStorage.setItem('language', normalizedLang);
  } catch (error) {
    console.error('Language change error:', error);
  }
};

export default i18n;