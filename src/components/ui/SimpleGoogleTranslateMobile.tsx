"use client";

import { useEffect, useState, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', countryCode: 'GB', flag: '🇬🇧', googleCode: 'en' },
  { code: 'de', name: 'Deutsch', countryCode: 'DE', flag: '🇩🇪', googleCode: 'de' },
  { code: 'fr', name: 'Français', countryCode: 'FR', flag: '🇫🇷', googleCode: 'fr' },
  { code: 'it', name: 'Italiano', countryCode: 'IT', flag: '🇮🇹', googleCode: 'it' },
  { code: 'sv', name: 'Svenska', countryCode: 'SE', flag: '🇸🇪', googleCode: 'sv' },
  { code: 'nl', name: 'Nederlands', countryCode: 'NL', flag: '🇳🇱', googleCode: 'nl' },
  { code: 'de-ch', name: 'Deutsch', countryCode: 'CH', flag: '🇨🇭', googleCode: 'de' },
  { code: 'he', name: 'עברית', countryCode: 'IL', flag: '🇮🇱', googleCode: 'he' },
  { code: 'ar', name: 'العربية', countryCode: 'AE', flag: '🇦🇪', googleCode: 'ar' },
  { code: 'sw', name: 'Kiswahili', countryCode: 'TZ', flag: '🇹🇿', googleCode: 'sw' },
  { code: 'uk', name: 'Українська', countryCode: 'UA', flag: '🇺🇦', googleCode: 'uk' },
  { code: 'af', name: 'Afrikaans', countryCode: 'ZA', flag: '🇿🇦', googleCode: 'af' },
  { code: 'es', name: 'Español', countryCode: 'ES', flag: '🇪🇸', googleCode: 'es' },
  { code: 'hi', name: 'हिन्दी', countryCode: 'IN', flag: '🇮🇳', googleCode: 'hi' },
  { code: 'zh', name: '中文', countryCode: 'CN', flag: '🇨🇳', googleCode: 'zh-CN' },
  { code: 'ja', name: '日本語', countryCode: 'JP', flag: '🇯🇵', googleCode: 'ja' },
  { code: 'pt', name: 'Português', countryCode: 'PT', flag: '🇵🇹', googleCode: 'pt' },
];

export default function SimpleGoogleTranslateMobile() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let lastDetectedLang = 'en';
    
    const detectLang = () => {
      const hash = window.location.hash;
      
      if (hash.includes('googtrans')) {
        const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/);
        
        if (match && match[1]) {
          const lang = languages.find(l => l.googleCode === match[1]);
          
          if (lang && lang.code !== lastDetectedLang) {
            lastDetectedLang = lang.code;
            setCurrentLang(lang.code);
          }
        }
      } else if (lastDetectedLang !== 'en') {
        lastDetectedLang = 'en';
        setCurrentLang('en');
      }
    };

    detectLang();
    window.addEventListener('hashchange', detectLang);
    const interval = setInterval(detectLang, 1000);

    return () => {
      window.removeEventListener('hashchange', detectLang);
      clearInterval(interval);
    };
  }, []);

  // Load Google Translate
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      
      // @ts-expect-error - Google Translate types are not available
      window.googleTranslateElementInit = () => {
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'google_translate_element';
        widgetContainer.style.position = 'absolute';
        widgetContainer.style.left = '-9999px';
        widgetContainer.style.opacity = '0';
        widgetContainer.style.pointerEvents = 'none';
        document.body.appendChild(widgetContainer);

        try {
          // Check if hash exists and set cookie accordingly
          const hash = window.location.hash;
          if (hash.includes('googtrans')) {
            const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/);
            if (match && match[1]) {
              const cookieValue = `googtrans=/en/${match[1]}`;
              document.cookie = `${cookieValue}; path=/; max-age=31536000`;
            }
          }
          
          // @ts-expect-error - Google Translate types are not available
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: languages.map(l => l.googleCode).join(','),
              // @ts-expect-error - Google Translate types are not available
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch {
          // Silently handle errors
        }
      };
      
      document.head.appendChild(script);
    }
  }, []);

  // Hide Google Translate banner
  useEffect(() => {
    const interval = setInterval(() => {
      const banner = document.querySelector('.goog-te-banner-frame') as HTMLElement;
      const skip = document.querySelector('.skiptranslate') as HTMLElement;
      if (banner) banner.style.display = 'none';
      if (skip) skip.style.display = 'none';
      document.body.style.top = '0';
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    const lang = languages.find(l => l.code === langCode);
    if (!lang) return;

    // Set cookie
    if (langCode === 'en') {
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'googtrans=; path=/; domain=' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } else {
      const cookieValue = `googtrans=/en/${lang.googleCode}`;
      document.cookie = `${cookieValue}; path=/; max-age=31536000`;
      document.cookie = `${cookieValue}; path=/; domain=${window.location.hostname}; max-age=31536000`;
    }

    setCurrentLang(langCode);
    setIsOpen(false);

    // Reload page with hash
    if (langCode === 'en') {
      window.location.hash = '';
      window.location.reload();
    } else {
      window.location.hash = '#googtrans(en|' + lang.googleCode + ')';
      window.location.reload();
    }
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative notranslate z-[10001]" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-3 mt-2 border border-white rounded-full px-4 py-2 hover:opacity-80 transition-opacity w-full justify-center notranslate"
        aria-label="Change language"
      >
        <Globe size={16} className="text-white" />
        <span className="text-white font-medium text-lg notranslate">
          {currentLanguage.code === 'en' ? currentLanguage.name : `${currentLanguage.countryCode} ${currentLanguage.name}`}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-[#242424] shadow-lg rounded-lg overflow-hidden notranslate" style={{ zIndex: 10002 }}>
          <div className="py-2 max-h-[400px] overflow-y-auto">
            {languages.map((lang) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code + lang.countryCode}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#333333] transition-colors notranslate ${
                    isSelected ? 'bg-[#333333] text-orange-300' : 'text-white'
                  }`}
                >
                  <span className="text-xl notranslate">{lang.flag}</span>
                  <span className="text-base font-medium notranslate">
                    {lang.code === 'en' ? lang.name : `${lang.countryCode} ${lang.name}`}
                  </span>
                  {isSelected && (
                    <span className="ml-auto text-orange-300 notranslate">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
