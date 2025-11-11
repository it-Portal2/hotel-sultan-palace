"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, ChevronDown } from 'lucide-react';

// Type declarations for Google Translate
interface GoogleTranslateWindow extends Window {
  google?: {
    translate: {
      TranslateElement: {
        new (options: {
          pageLanguage: string;
          includedLanguages: string;
          layout: number;
          autoDisplay: boolean;
        }, elementId: string): void;
        InlineLayout: {
          SIMPLE: number;
        };
      };
    };
  };
  googleTranslateElementInit?: () => void;
}

const languages = [
  { code: 'en', name: 'English', countryCode: 'GB', flag: '🇬🇧', googleCode: 'en' },
  { code: 'es', name: 'Español', countryCode: 'ES', flag: '🇪🇸', googleCode: 'es' },
  { code: 'fr', name: 'Français', countryCode: 'FR', flag: '🇫🇷', googleCode: 'fr' },
  { code: 'de', name: 'Deutsch', countryCode: 'DE', flag: '🇩🇪', googleCode: 'de' },
  { code: 'it', name: 'Italiano', countryCode: 'IT', flag: '🇮🇹', googleCode: 'it' },
  { code: 'ar', name: 'العربية', countryCode: 'SA', flag: '🇸🇦', googleCode: 'ar' },
  { code: 'hi', name: 'हिन्दी', countryCode: 'IN', flag: '🇮🇳', googleCode: 'hi' },
  { code: 'zh', name: '中文', countryCode: 'CN', flag: '🇨🇳', googleCode: 'zh-CN' },
  { code: 'ja', name: '日本語', countryCode: 'JP', flag: '🇯🇵', googleCode: 'ja' },
  { code: 'pt', name: 'Português', countryCode: 'PT', flag: '🇵🇹', googleCode: 'pt' },
];

/**
 * Simple Google Translate Button
 * Only uses Google Translate - no routing, no next-intl
 */
export default function SimpleGoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initialize Google Translate Widget
    const initGoogleTranslate = () => {
      // Remove existing widget if any
      let widgetContainer = document.getElementById('google_translate_element');
      if (widgetContainer) {
        widgetContainer.remove();
      }

      // Create new widget container
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'google_translate_element';
      widgetContainer.style.position = 'absolute';
      widgetContainer.style.left = '-9999px';
      widgetContainer.style.opacity = '0';
      widgetContainer.style.pointerEvents = 'none';
      document.body.appendChild(widgetContainer);

      // Initialize Google Translate
      const win = window as unknown as GoogleTranslateWindow;
      if (win.google && win.google.translate) {
        try {
          new win.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: languages.map(l => l.googleCode).join(','),
              layout: win.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch (error) {
          console.error('Google Translate init error:', error);
        }
      }
    };

    // Load Google Translate script
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      
      const win = window as unknown as GoogleTranslateWindow;
      win.googleTranslateElementInit = () => {
        setTimeout(initGoogleTranslate, 100);
      };
      
      document.head.appendChild(script);
    } else {
      const win = window as unknown as GoogleTranslateWindow;
      if (win.google && win.google.translate) {
        // If already loaded, initialize immediately
        setTimeout(initGoogleTranslate, 100);
      }
    }

    // Function to detect current language from multiple sources
    const detectCurrentLanguage = () => {
      // Method 1: Check URL hash (highest priority)
      const hash = window.location.hash;
      if (hash.includes('googtrans')) {
        const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/);
        if (match) {
          const langCode = match[1];
          if (langCode === 'en') return 'en';
          const lang = languages.find(l => l.googleCode === langCode);
          if (lang) return lang.code;
        }
      } else {
        // If no hash, it's English (default)
        return 'en';
      }

      // Method 2: Check cookie (only if hash exists, otherwise ignore cookie for English)
      const langCookie = document.cookie.match(/googtrans=([^;]+)/);
      if (langCookie && hash.includes('googtrans')) {
        const cookieValue = langCookie[1];
        if (cookieValue.includes('/')) {
          const lang = cookieValue.split('/').pop()?.split('-')[0] || 'en';
          if (lang === 'zh') return 'zh';
          if (languages.find(l => l.code === lang)) return lang;
        }
      }

      // Method 3: Check Google Translate select element (only if hash exists)
      if (hash.includes('googtrans')) {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select && select.value && select.value !== 'en') {
          const lang = languages.find(l => l.googleCode === select.value);
          if (lang) return lang.code;
        }
      }

      return 'en'; // Default
    };

    // Set initial language
    const initialLang = detectCurrentLanguage();
    setCurrentLang(initialLang);

    // Monitor language changes
    const updateLanguage = () => {
      const detectedLang = detectCurrentLanguage();
      setCurrentLang(prevLang => {
        // Only update if actually different
        if (detectedLang !== prevLang) {
          return detectedLang;
        }
        return prevLang;
      });
    };

    // Check language periodically (but less frequently to avoid flickering)
    const langCheckInterval = setInterval(updateLanguage, 1000);

    // Listen to Google Translate changes
    let selectElement: HTMLSelectElement | null = null;
    const checkSelect = () => {
      selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElement) {
        selectElement.addEventListener('change', updateLanguage);
      }
    };
    checkSelect();
    
    // Keep checking for select element
    const selectCheckInterval = setInterval(checkSelect, 500);

    // Listen to hash changes
    window.addEventListener('hashchange', updateLanguage);

    // Hide Google Translate bar and fix white space
    const hideGoogleTranslateBar = () => {
      const banner = document.querySelector('.goog-te-banner-frame');
      const skipTranslate = document.querySelector('.skiptranslate');
      const combo = document.querySelector('.goog-te-combo');
      
      if (banner) {
        (banner as HTMLElement).style.display = 'none';
        (banner as HTMLElement).style.visibility = 'hidden';
        (banner as HTMLElement).style.opacity = '0';
        (banner as HTMLElement).style.height = '0';
        (banner as HTMLElement).style.margin = '0';
        (banner as HTMLElement).style.padding = '0';
      }
      
      if (skipTranslate) {
        (skipTranslate as HTMLElement).style.display = 'none';
        (skipTranslate as HTMLElement).style.visibility = 'hidden';
        (skipTranslate as HTMLElement).style.margin = '0';
        (skipTranslate as HTMLElement).style.padding = '0';
        (skipTranslate as HTMLElement).style.height = '0';
      }
      
      if (combo) {
        (combo as HTMLElement).style.display = 'none';
      }

      // Fix body and html top spacing
      if (document.body) {
        document.body.style.top = '0';
        document.body.style.paddingTop = '0';
        document.body.style.marginTop = '0';
      }
      if (document.documentElement) {
        document.documentElement.style.top = '0';
        document.documentElement.style.paddingTop = '0';
        document.documentElement.style.marginTop = '0';
      }
    };

    // Hide bar immediately and on interval
    hideGoogleTranslateBar();
    const interval = setInterval(hideGoogleTranslateBar, 100);

    // Also hide on DOM mutations
    const observer = new MutationObserver(hideGoogleTranslateBar);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      clearInterval(langCheckInterval);
      clearInterval(selectCheckInterval);
      observer.disconnect();
      window.removeEventListener('hashchange', updateLanguage);
      if (selectElement) {
        selectElement.removeEventListener('change', updateLanguage);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: string) => {
    setIsOpen(false);
    setCurrentLang(langCode); // Immediately update state
    
    const lang = languages.find(l => l.code === langCode);
    if (!lang) return;

    const currentUrl = window.location.href.split('#')[0];
    
    // For English: Remove hash and reset Google Translate
    if (langCode === 'en') {
      // Clear all Google Translate cookies
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('googtrans') || name.includes('googtrans')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        }
      });
      
      // Reset Google Translate select to English before reload
      const resetTranslate = () => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select) {
          select.value = 'en';
          const changeEvent = new Event('change', { bubbles: true, cancelable: true });
          select.dispatchEvent(changeEvent);
        }
      };
      
      resetTranslate();
      
      // Remove hash and reload immediately
      window.location.href = currentUrl;
      // Reload will happen automatically with clean URL
    } else {
      // For other languages: Use hash method
      const hash = `googtrans(en|${lang.googleCode})`;
      window.location.href = currentUrl + '#' + hash;
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right,
      });
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative notranslate" ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 xl:gap-2 border border-white rounded-full px-2 py-1 hover:opacity-80 transition-opacity flex-shrink-0 notranslate relative"
          aria-label="Change language"
          aria-expanded={isOpen}
        >
          <Globe size={14} className="md:w-3 md:h-3 xl:w-4 xl:h-4 text-white" />
          <span className="text-white font-medium text-[12px] md:text-[14px] xl:text-[16px] whitespace-nowrap notranslate">
            {currentLanguage.code === 'en' ? currentLanguage.name : `${currentLanguage.countryCode} ${currentLanguage.name}`}
          </span>
          <ChevronDown 
            size={14} 
            className={`md:w-3 md:h-3 xl:w-4 xl:h-4 text-white transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)}
            style={{ zIndex: 99998 }}
          />
          {/* Dropdown */}
          <div 
            className="fixed w-48 bg-[#242424] shadow-lg rounded-lg overflow-hidden notranslate" 
            style={{ 
              zIndex: 99999, 
              top: `${dropdownPosition.top}px`, 
              right: `${dropdownPosition.right}px` 
            }}
          >
            <div className="py-2">
              {languages.map((lang) => {
                const isActive = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#333333] transition-colors notranslate ${
                      isActive ? 'bg-[#333333] text-orange-300' : 'text-white'
                    }`}
                  >
                    <span className="text-xl notranslate">{lang.flag}</span>
                    <span className="text-sm font-medium notranslate">
                      {lang.code === 'en' ? lang.name : `${lang.countryCode} ${lang.name}`}
                    </span>
                    {isActive && (
                      <span className="ml-auto text-orange-300 notranslate">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
