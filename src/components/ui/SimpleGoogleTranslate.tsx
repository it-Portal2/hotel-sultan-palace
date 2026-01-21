"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Globe, ChevronDown } from "lucide-react";

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          new (
            options: {
              pageLanguage: string;
              includedLanguages: string;
              layout: unknown;
              autoDisplay: boolean;
            },
            elementId: string,
          ): unknown;
          InlineLayout: { SIMPLE: unknown };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }
}

interface Language {
  code: string;
  name: string;
  countryCode: string;
  flag: string;
  googleCode: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    countryCode: "GB",
    flag: "🇬🇧",
    googleCode: "en",
  },
  {
    code: "de",
    name: "Deutsch",
    countryCode: "DE",
    flag: "🇩🇪",
    googleCode: "de",
  },
  {
    code: "fr",
    name: "Français",
    countryCode: "FR",
    flag: "🇫🇷",
    googleCode: "fr",
  },
  {
    code: "it",
    name: "Italiano",
    countryCode: "IT",
    flag: "🇮🇹",
    googleCode: "it",
  },
  {
    code: "sv",
    name: "Svenska",
    countryCode: "SE",
    flag: "🇸🇪",
    googleCode: "sv",
  },
  {
    code: "nl",
    name: "Nederlands",
    countryCode: "NL",
    flag: "🇳🇱",
    googleCode: "nl",
  },
  {
    code: "de-ch",
    name: "Deutsch",
    countryCode: "CH",
    flag: "🇨🇭",
    googleCode: "de",
  },
  {
    code: "he",
    name: "עברית",
    countryCode: "IL",
    flag: "🇮🇱",
    googleCode: "iw",
  }, // Google uses legacy 'iw' code for Hebrew
  {
    code: "ar",
    name: "العربية",
    countryCode: "AE",
    flag: "🇦🇪",
    googleCode: "ar",
  },
  {
    code: "sw",
    name: "Kiswahili",
    countryCode: "TZ",
    flag: "🇹🇿",
    googleCode: "sw",
  },
  {
    code: "uk",
    name: "Українська",
    countryCode: "UA",
    flag: "🇺🇦",
    googleCode: "uk",
  },
  {
    code: "af",
    name: "Afrikaans",
    countryCode: "ZA",
    flag: "🇿🇦",
    googleCode: "af",
  },
  {
    code: "es",
    name: "Español",
    countryCode: "ES",
    flag: "🇪🇸",
    googleCode: "es",
  },
  {
    code: "hi",
    name: "हिन्दी",
    countryCode: "IN",
    flag: "🇮🇳",
    googleCode: "hi",
  },
  {
    code: "zh",
    name: "中文",
    countryCode: "CN",
    flag: "🇨🇳",
    googleCode: "zh-CN",
  },
  {
    code: "ja",
    name: "日本語",
    countryCode: "JP",
    flag: "🇯🇵",
    googleCode: "ja",
  },
  {
    code: "pt",
    name: "Português",
    countryCode: "PT",
    flag: "🇵🇹",
    googleCode: "pt",
  },
];

const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";
const GOOGLE_TRANSLATE_ELEMENT_ID = "google_translate_element";
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

const getRootDomain = (hostname: string): string => {
  const parts = hostname.split(".");
  return parts.length <= 2 ? hostname : parts.slice(-2).join(".");
};

const parseGoogTransHash = (hash: string): string | null => {
  const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/);
  return match?.[1] || null;
};

const clearAllGoogTransCookies = (): void => {
  const hostname = window.location.hostname;
  const rootDomain = getRootDomain(hostname);
  const expiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const domains = ["", hostname, `.${hostname}`, rootDomain, `.${rootDomain}`];

  domains.forEach((domain) => {
    const domainPart = domain ? `; domain=${domain}` : "";
    document.cookie = `googtrans=${domainPart}; path=/; ${expiry}`;
  });
};

const setGoogTransCookie = (googleCode: string): void => {
  const hostname = window.location.hostname;
  const rootDomain = getRootDomain(hostname);
  const cookieValue = `googtrans=/en/${googleCode}`;

  document.cookie = `${cookieValue}; path=/; max-age=${COOKIE_MAX_AGE}`;
  document.cookie = `${cookieValue}; path=/; domain=${hostname}; max-age=${COOKIE_MAX_AGE}`;
  document.cookie = `${cookieValue}; path=/; domain=.${rootDomain}; max-age=${COOKIE_MAX_AGE}`;
};

export default function SimpleGoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detect current language from URL hash
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastDetectedLang = "en";

    const detectLang = () => {
      const googleCode = parseGoogTransHash(window.location.hash);

      if (googleCode) {
        const lang = SUPPORTED_LANGUAGES.find(
          (l) => l.googleCode === googleCode,
        );
        if (lang && lang.code !== lastDetectedLang) {
          lastDetectedLang = lang.code;
          setCurrentLang(lang.code);
        }
      } else if (lastDetectedLang !== "en") {
        lastDetectedLang = "en";
        setCurrentLang("en");
      }
    };

    detectLang();
    window.addEventListener("hashchange", detectLang);
    const interval = setInterval(detectLang, 1000);

    return () => {
      window.removeEventListener("hashchange", detectLang);
      clearInterval(interval);
    };
  }, []);

  // Initialize Google Translate widget
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;

    window.googleTranslateElementInit = () => {
      const widgetContainer = document.createElement("div");
      widgetContainer.id = GOOGLE_TRANSLATE_ELEMENT_ID;
      Object.assign(widgetContainer.style, {
        position: "absolute",
        left: "-9999px",
        opacity: "0",
        pointerEvents: "none",
      });
      document.body.appendChild(widgetContainer);

      try {
        const googleCode = parseGoogTransHash(window.location.hash);
        if (googleCode) {
          document.cookie = `googtrans=/en/${googleCode}; path=/; max-age=${COOKIE_MAX_AGE}`;
        }

        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: SUPPORTED_LANGUAGES.map(
              (l) => l.googleCode,
            ).join(","),
            layout:
              window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          GOOGLE_TRANSLATE_ELEMENT_ID,
        );
      } catch {
        // Google Translate initialization failed silently
      }
    };

    document.head.appendChild(script);
  }, []);

  // Hide Google Translate banner elements
  useEffect(() => {
    const interval = setInterval(() => {
      const banner = document.querySelector(
        ".goog-te-banner-frame",
      ) as HTMLElement;
      const skip = document.querySelector(".skiptranslate") as HTMLElement;
      if (banner) banner.style.display = "none";
      if (skip) skip.style.display = "none";
      document.body.style.top = "0";
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  const handleLanguageChange = (langCode: string) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
    if (!lang) return;

    if (langCode === "en") {
      clearAllGoogTransCookies();
      window.location.hash = "";
    } else {
      setGoogTransCookie(lang.googleCode);
      window.location.hash = `#googtrans(en|${lang.googleCode})`;
    }

    setCurrentLang(langCode);
    setIsOpen(false);
    window.location.reload();
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];
  const displayName =
    currentLanguage.code === "en"
      ? currentLanguage.name
      : `${currentLanguage.countryCode} ${currentLanguage.name}`;

  return (
    <>
      <div className="relative notranslate" ref={dropdownRef}>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1 xl:gap-2 border border-white rounded-full px-2 py-1 hover:opacity-80 transition-opacity flex-shrink-0 notranslate cursor-pointer"
          aria-label="Change language"
        >
          <Globe size={14} className="md:w-3 md:h-3 xl:w-4 xl:h-4 text-white" />
          <span className="text-white font-medium text-[12px] md:text-[14px] xl:text-[16px] whitespace-nowrap notranslate">
            {displayName}
          </span>
          <ChevronDown
            size={14}
            className={`md:w-3 md:h-3 xl:w-4 xl:h-4 text-white transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0"
              onClick={() => setIsOpen(false)}
              style={{ zIndex: 99998 }}
            />
            <div
              className="fixed w-48 bg-[#242424] shadow-lg rounded-lg overflow-hidden notranslate"
              onClick={(e) => e.stopPropagation()}
              style={{
                zIndex: 99999,
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
              }}
            >
              <div className="py-2 max-h-[400px] overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === currentLang;
                  const label =
                    lang.code === "en"
                      ? lang.name
                      : `${lang.countryCode} ${lang.name}`;

                  return (
                    <button
                      key={`${lang.code}-${lang.countryCode}`}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-[#333333] transition-colors notranslate cursor-pointer ${
                        isSelected
                          ? "bg-[#333333] text-orange-300"
                          : "text-white"
                      }`}
                    >
                      <span className="text-xl notranslate">{lang.flag}</span>
                      <span className="text-sm font-medium notranslate">
                        {label}
                      </span>
                      {isSelected && (
                        <span className="ml-auto text-orange-300 notranslate">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
