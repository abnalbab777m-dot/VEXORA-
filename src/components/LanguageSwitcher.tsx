import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('en') ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
      title="Toggle Language"
    >
      <Globe className="w-5 h-5" />
      <span className="text-sm font-semibold uppercase tracking-wider">
        {i18n.language.startsWith('en') ? 'AR' : 'EN'}
      </span>
    </button>
  );
}
