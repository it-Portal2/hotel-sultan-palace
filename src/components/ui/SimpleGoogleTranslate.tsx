"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Globe, ChevronDown } from "lucide-react";

// Extend Window interface for Google Translate
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
          InlineLayout: {
            SIMPLE: unknown;
          };
        };
      };
    };
    googleTranslateElementInit: () => void;
  }
}

const languages = [
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
    googleCode: "he",
  },
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

export default function SimpleGoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detect language from hash on mount and periodically
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastDetectedLang = "en";

    const detectLang = () => {
      const hash = window.location.hash;

      if (hash.includes("googtrans")) {
        const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/);

        if (match && match[1]) {
          const lang = languages.find((l) => l.googleCode === match[1]);

          if (lang && lang.code !== lastDetectedLang) {
            lastDetectedLang = lang.code;
            setCurrentLang(lang.code);
          }
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

  // Load Google Translate
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;

      window.googleTranslateElementInit = () => {
        const widgetContainer = document.createElement("div");
        widgetContainer.id = "google_translate_element";
        widgetContainer.style.position = "absolute";
        widgetContainer.style.left = "-9999px";
        widgetContainer.style.opacity = "0";
        widgetContainer.style.pointerEvents = "none";
        document.body.appendChild(widgetContainer);

        try {
          // Check if hash exists and set cookie accordingly
          const hash = window.location.hash;
          if (hash.includes("googtrans")) {
            const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/);
            if (match && match[1]) {
              const cookieValue = `googtrans=/en/${match[1]}`;
              document.cookie = `${cookieValue}; path=/; max-age=31536000`;
            }
          }

          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: languages.map((l) => l.googleCode).join(","),
              layout:
                window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            "google_translate_element",
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

  // Update dropdown position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 8,
        right: window.innerWidth - buttonRect.right,
      });
    }
  }, [isOpen]);

  // Helper function to get root domain (e.g., "example.com" from "www.example.com")
  const getRootDomain = (hostname: string): string => {
    const parts = hostname.split(".");
    // Handle cases like localhost or IP addresses
    if (parts.length <= 2) return hostname;
    // Return last two parts (e.g., "example.com")
    return parts.slice(-2).join(".");
  };

  // Helper function to clear all googtrans cookies on all domain variations
  const clearAllGoogTransCookies = () => {
    const hostname = window.location.hostname;
    const rootDomain = getRootDomain(hostname);
    const expiry = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Clear on all possible domain variations
    const domains = [
      "", // No domain (current)
      hostname, // Current hostname (e.g., www.example.com)
      "." + hostname, // With leading dot
      rootDomain, // Root domain (e.g., example.com)
      "." + rootDomain, // Root domain with leading dot
    ];

    domains.forEach((domain) => {
      const domainPart = domain ? `; domain=${domain}` : "";
      document.cookie = `googtrans=${domainPart}; path=/; ${expiry}`;
    });
  };

  // Handle language change
  const handleLanguageChange = (langCode: string) => {
    const lang = languages.find((l) => l.code === langCode);
    if (!lang) return;

    const hostname = window.location.hostname;
    const rootDomain = getRootDomain(hostname);

    // Set or clear cookie
    if (langCode === "en") {
      // Clear all googtrans cookies on all domain variations
      clearAllGoogTransCookies();
    } else {
      const cookieValue = `googtrans=/en/${lang.googleCode}`;
      // Set cookie on multiple domains to ensure it works
      document.cookie = `${cookieValue}; path=/; max-age=31536000`;
      document.cookie = `${cookieValue}; path=/; domain=${hostname}; max-age=31536000`;
      document.cookie = `${cookieValue}; path=/; domain=.${rootDomain}; max-age=31536000`;
    }

    setCurrentLang(langCode);
    setIsOpen(false);

    // Reload page with hash
    if (langCode === "en") {
      window.location.hash = "";
      window.location.reload();
    } else {
      window.location.hash = "#googtrans(en|" + lang.googleCode + ")";
      window.location.reload();
    }
  };

  const currentLanguage =
    languages.find((l) => l.code === currentLang) || languages[0];

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
            {currentLanguage.code === "en"
              ? currentLanguage.name
              : `${currentLanguage.countryCode} ${currentLanguage.name}`}
          </span>
          <ChevronDown
            size={14}
            className={`md:w-3 md:h-3 xl:w-4 xl:h-4 text-white transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
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
                {languages.map((lang) => {
                  const isSelected = lang.code === currentLang;
                  return (
                    <button
                      key={lang.code + lang.countryCode}
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
                        {lang.code === "en"
                          ? lang.name
                          : `${lang.countryCode} ${lang.name}`}
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
