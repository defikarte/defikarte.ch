import cn from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import iconChevronDownWhite from '../../../assets/icons/icon-chevron-down-white.svg';
import iconLanguageSwitchCircleGreen from '../../../assets/navigation/icon-language-switch-circle-green.svg';
import type { i18n } from 'i18next';

interface Language {
  code: string;
  label: string;
}

const languages: Language[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
];

interface LanguageMenuProps {
  variant: 'light' | 'dark';
}

const selectInitialLanguage = (i18n: i18n) => {
  const lang = languages.find(x => x.code == i18n.resolvedLanguage);
  return lang ?? languages[0];
};

export const LanguageMenu = ({ variant }: LanguageMenuProps) => {
  const { i18n } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(() =>
    selectInitialLanguage(i18n)
  );

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectLanguage = (language: Language) => {
    void i18n.changeLanguage(language.code);
    setSelectedLanguage(language);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block z-40 shrink-0" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center ps-1 py-1 pe-2.5 gap-1.5 border border-primary-80-white hover:border-primary-100-green-02 rounded-[50px] text-xs text-primary-100-white font-normal focus:outline-none cursor-pointer"
      >
        <img src={iconLanguageSwitchCircleGreen} alt="language" />
        <span className="capitalize w-4">{selectedLanguage?.code}</span>
        <img src={iconChevronDownWhite} alt="language" />
      </button>
      {isOpen && (
        <ul
          className={cn(
            'absolute flex flex-col py-3 px-4 gap-2 right-0 mt-2 rounded-xl text-right',
            {
              'bg-secondary-green-03': variant === 'dark',
              'text-primary-100-white': variant === 'dark',
              'bg-primary-100-white': variant === 'light',
              'text-primary-100-green-04': variant === 'light',
            }
          )}
        >
          {languages.map(language => (
            <li
              key={language.code}
              onClick={() => selectLanguage(language)}
              className={`cursor-pointer leading-[150%] text-xs font-medium hover:text-primary-100-green-01 ${
                selectedLanguage?.code === language.code ? 'text-primary-100-green-02' : ''
              }`}
            >
              <span>{language.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
