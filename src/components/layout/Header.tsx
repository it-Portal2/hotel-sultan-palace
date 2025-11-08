"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaWhatsapp,
  FaFacebookF,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import {
  Clock,
  Thermometer,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import BookNowButton from "../ui/BookNowButton";
import Image from "next/image";

function TimeAndTemperature() {
  const [now, setNow] = useState<string>("");
  const [tempC, setTempC] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const time = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setNow(time);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchTemp = async (lat = -6.165, lon = 39.2025) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        const t = data?.current?.temperature_2m;
        if (typeof t === "number") setTempC(Math.round(t));
      } catch (error) {
        console.error("Failed to fetch temperature:", error);
      }
    };
    fetchTemp();
  }, []);

  const tempF = tempC !== null ? Math.round((tempC * 9) / 5 + 32) : null;

  return (
    <div className="hidden md:flex items-center gap-4 lg:gap-6 text-white text-[12px] md:text-[14px] lg:text-[16px] font-semibold">
      <div className="flex items-center gap-1 md:gap-2">
        <Clock size={12} className="md:w-4 md:h-4" />
        <span className="whitespace-nowrap">Local time: {now || "--:--"}</span>
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <Thermometer size={12} className="md:w-4 md:h-4" />
        <span className="whitespace-nowrap">
          Temp: {tempC !== null ? `${tempC}°C / ${tempF}°F` : "--"}
        </span>
      </div>
    </div>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutUsMenuOpen, setIsAboutUsMenuOpen] = useState(false);
  const [isActivitiesMenuOpen, setIsActivitiesMenuOpen] = useState(false);
  const [isWellnessMenuOpen, setIsWellnessMenuOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const socialLinks = [
    { name: "Whatsapp", icon: FaWhatsapp, href: "https://wa.me/255777085630", title: "WhatsApp: +255 777 085 630" },
    { name: "Facebook", icon: FaFacebookF, href: "#" },
    { name: "LinkedIn", icon: FaLinkedinIn, href: "#" },
    { name: "Twitter", icon: FaTwitter, href: "#" },
  ];

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Activities", caret: true, href: "#", hasSubmenu: true },
    { label: "Wellness & Relaxation", caret: true, href: "#", hasSubmenu: true },
    { label: "Villas", href: "/villas" },
    { label: "Gallery", href: "/gallery" },
    { label: "Offers",  href: "/offers" },
    { label: "About Us", href: "#" ,caret: true, hasSubmenu: true},
    { label: "Contact Us", href: "/contact-us" },
  ];

  const activitiesSubmenu = [
    { label: "Deep Blue Dive", href: "/activities/deep-blue-dive" },
    { label: "Aqua Adventure", href: "/activities/aqua-adventure" },
    { label: "Spirit of Swahili", href: "/activities/spirit-of-swahili" },
  ];

  const wellnessSubmenu = [
    { label: "Ocean Breeze Spa", href: "/wellness/ocean-breeze-spa" },
    { label: "Fitness & Gym Studio", href: "/wellness/fitness-gym-studio" },
  ];

  const aboutUsSubmenu = [
    { label: "How To Get To Zanzibar", href: "/how-to-get-to-zanzibar" },
    { label: "Our Stories", href: "/our-stories" },
    { label: "About Us", href: "/about-us" },
  ];

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMenuOpen]);

 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.submenu-container')) {
        setIsAboutUsMenuOpen(false);
        setIsActivitiesMenuOpen(false);
        setIsWellnessMenuOpen(false);
      }
    };

    if (isAboutUsMenuOpen || isActivitiesMenuOpen || isWellnessMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAboutUsMenuOpen, isActivitiesMenuOpen, isWellnessMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`w-full absolute top-0 left-0 z-30 font-open-sans ${scrolled ? "backdrop-blur-sm bg-[#0a1a2b]/40" : ""}`}>
        {/* Top Section - Desktop Only */}
        <div className="hidden md:block w-full px-4 md:px-6 lg:px-10 xl:px-20">
          <div className="flex items-center justify-between py-1 md:py-4 gap-2 xl:gap-4">
            <TimeAndTemperature />
            <div className="flex items-center gap-2 xl:gap-3 2xl:gap-5 text-white text-[12px] md:text-[14px] xl:text-[16px] font-semibold flex-shrink-0">
              <div className="flex items-center gap-1 xl:gap-2">
                <Phone size={12} className="md:w-3 md:h-3 xl:w-4 xl:h-4" color="#79C9E9" />
                <div className="flex gap-1 xl:gap-2 text-[12px] md:text-[14px] xl:text-[16px]">
                  <Link href="tel:+255684888111" className="hover:text-orange-300 transition-colors whitespace-nowrap">+255 684 888 111</Link>
                  <span>,</span>
                  <Link href="tel:+255657269674" className="hover:text-orange-300 transition-colors whitespace-nowrap">+255 657 269 674</Link>
                </div>
              </div>
              <Link
                href="mailto:portalholdingsznz@gmail.com"
                className="flex items-center gap-1 xl:gap-2 hover:text-orange-300 transition-colors"
              >
                <Mail size={14} className="md:w-3 md:h-3 xl:w-4 xl:h-4" color="#79C9E9" />
                <span className="text-[12px] md:text-[14px] xl:text-[16px] truncate max-w-[180px] xl:max-w-none">portalholdingsznz@gmail.com</span>
              </Link>
              <button className="flex items-center gap-1 xl:gap-2 border border-white rounded-full px-2 py-1 hover:opacity-80 transition-opacity flex-shrink-0">
                <Globe size={14} className="md:w-3 md:h-3 xl:w-4 xl:h-4 text-white" />
                <span className="text-white font-medium text-[12px] md:text-[14px] xl:text-[16px] whitespace-nowrap">
                  English
                </span>
                <ChevronDown size={14} className="md:w-3 md:h-3 xl:w-4 xl:h-4 text-white" />
              </button>
            </div>
          </div>
          <hr className="border-white/20" />
        </div>

        {/* Menu Bar Section - Logo, Social Icons, Navigation */}
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-[82px]">
          <div className="flex items-center justify-between py-1 gap-2 xl:gap-4">
            <div className="flex items-center gap-2 md:gap-3 xl:gap-4 flex-shrink-0">
              <Link href="/" className="flex-shrink-0 z-50">
                <Image
                  src="/sultan-logo.png"
                  alt="Sultan Palace"
                  width={200}
                  height={200}
                  priority
                  className="!h-[50px] md:!h-[70px] xl:!h-[84px] !w-auto" 
                  style={{ height: "50px", width: "auto" }}
                />
              </Link>
              {/* Social Icons - Now in Menu Bar */}
              <div className="flex items-center gap-2 md:gap-3">
                {socialLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    target={link.name === "Whatsapp" ? "_blank" : undefined}
                    rel={link.name === "Whatsapp" ? "noopener noreferrer" : undefined}
                    className="text-white hover:text-orange-300 transition-colors"
                    title={link.title || link.name}
                    aria-label={link.name === "Whatsapp" ? "Chat on WhatsApp - +255 777 085 630" : link.name}
                  >
                    <link.icon size={14} className="md:w-4 md:h-4" />
                  </Link>
                ))}
              </div>
            </div>

            <nav className="hidden lg:flex items-center justify-center gap-3 xl:gap-4 2xl:gap-6 text-white text-[14px] xl:text-[16px] font-semibold font-open-sans flex-1 min-w-0">
              {navLinks.map((item) => (
                <div key={item.label} className="relative">
                  {item.hasSubmenu ? (
                    <button
                      onClick={() => {
                        // Close other submenus and toggle current one
                        if (item.label === "Activities") {
                          setIsActivitiesMenuOpen(!isActivitiesMenuOpen);
                          setIsAboutUsMenuOpen(false);
                          setIsWellnessMenuOpen(false);
                        } else if (item.label === "Wellness & Relaxation") {
                          setIsWellnessMenuOpen(!isWellnessMenuOpen);
                          setIsAboutUsMenuOpen(false);
                          setIsActivitiesMenuOpen(false);
                        } else if (item.label === "About Us") {
                          setIsAboutUsMenuOpen(!isAboutUsMenuOpen);
                          setIsActivitiesMenuOpen(false);
                          setIsWellnessMenuOpen(false);
                        }
                      }}
                      className="whitespace-nowrap hover:text-orange-300 transition-colors flex items-center gap-1 xl:gap-2 text-[13px] xl:text-[16px]"
                    >
                      <span className="truncate max-w-[120px] xl:max-w-none">{item.label}</span>
                      {item.caret && (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform duration-300 ${
                            (item.label === "Activities" && isActivitiesMenuOpen) ||
                            (item.label === "Wellness & Relaxation" && isWellnessMenuOpen) ||
                            (item.label === "About Us" && isAboutUsMenuOpen)
                              ? 'rotate-180' : 'rotate-0'
                          }`}
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="whitespace-nowrap hover:text-orange-300 transition-colors flex items-center gap-1 xl:gap-2 text-[13px] xl:text-[16px]"
                    >
                      <span className="truncate max-w-[120px] xl:max-w-none">{item.label}</span>
                      {item.caret && <ChevronDown size={14} />}
                    </Link>
                  )}
                  
                  {/* Activities Submenu */}
                  {item.hasSubmenu && item.label === "Activities" && (
                    <div className={`submenu-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 py-2 w-[194px] bg-[#242424] shadow-lg z-50 transition-all duration-300 ease-out ${isActivitiesMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[30px] border-l-transparent border-r-transparent border-b-[#242424]"></div>
                      <div className="py-4 px-4 space-y-5">
                        {activitiesSubmenu.map((subItem, index) => (
                          <div key={subItem.label}>
                            <Link
                              href={subItem.href}
                              className="text-white text-[14px] font-medium hover:text-orange-300 transition-colors block"
                              onClick={() => setIsActivitiesMenuOpen(false)}
                            >
                              {subItem.label}
                            </Link>
                            {index < activitiesSubmenu.length - 1 && (
                              <hr className="border-white/8 mt-5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wellness Submenu */}
                  {item.hasSubmenu && item.label === "Wellness & Relaxation" && (
                    <div className={`submenu-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 py-2 w-[194px] bg-[#242424] shadow-lg z-50 transition-all duration-300 ease-out ${isWellnessMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[30px] border-l-transparent border-r-transparent border-b-[#242424]"></div>
                      <div className="py-4 px-4 space-y-5">
                        {wellnessSubmenu.map((subItem, index) => (
                          <div key={subItem.label}>
                            <Link
                              href={subItem.href}
                              className="text-white text-[14px] font-medium hover:text-orange-300 transition-colors block"
                              onClick={() => setIsWellnessMenuOpen(false)}
                            >
                              {subItem.label}
                            </Link>
                            {index < wellnessSubmenu.length - 1 && (
                              <hr className="border-white/8 mt-5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* about Submenu */}
                  {item.hasSubmenu && item.label === "About Us" && (
                    <div className={`submenu-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 py-2 w-[194px] bg-[#242424] shadow-lg z-50 transition-all duration-300 ease-out ${isAboutUsMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[30px] border-l-transparent border-r-transparent border-b-[#242424]"></div>
                      <div className="py-4 px-4 space-y-5">
                        {aboutUsSubmenu.map((subItem, index) => (
                          <div key={subItem.label}>
                            <Link
                              href={subItem.href}
                              className="text-white text-[14px] font-medium hover:text-orange-300 transition-colors block"
                              onClick={() => setIsAboutUsMenuOpen(false)}
                            >
                              {subItem.label}
                            </Link>
                              {index < aboutUsSubmenu.length - 1 && (
                              <hr className="border-white/8 mt-5" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
              <div className="hidden md:block">
                <BookNowButton size="sm" className="px-4 md:px-6 lg:px-8 xl:px-[40px] 2xl:px-[53px] py-2 md:py-2.5 lg:py-3 xl:py-[14px] rounded-[9px] text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px] h-auto md:h-[45px] lg:h-[49px] w-fit whitespace-nowrap" />
              </div>
              <div className="lg:hidden z-50">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-white"
                >
                  <Menu size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`
        lg:hidden fixed top-0 left-0 w-full h-screen bg-[#0a1a2b] z-40
        transition-transform duration-300 ease-in-out
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col
      `}
      >
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-5 right-5 text-white z-50"
        >
          <X size={32} />
        </button>

        <nav className="mt-24 px-6 overflow-y-auto">
          <ul className="space-y-2">
            {navLinks.map((item) => {
              const isExpandable = !!item.hasSubmenu;
              const isOpen = mobileOpenSection === item.label;
              const toggle = () => setMobileOpenSection(isOpen ? null : item.label);
              return (
                <li key={item.label} className="border-b border-white/10 pb-2">
                  {isExpandable ? (
                    <button
                      onClick={toggle}
                      className="w-full flex items-center justify-between text-left text-white text-xl font-semibold py-3"
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={20}
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="block w-full text-white text-xl font-semibold py-3 hover:text-orange-300 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}

                  {/* Submenus */}
                  {isExpandable && item.label === "Activities" && (
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <ul className="pl-4 pr-2 py-1 space-y-2">
                          {activitiesSubmenu.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                className="block text-white/90 text-base py-2 hover:text-white"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {isExpandable && item.label === "Wellness & Relaxation" && (
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <ul className="pl-4 pr-2 py-1 space-y-2">
                          {wellnessSubmenu.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                className="block text-white/90 text-base py-2 hover:text-white"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  {isExpandable && item.label === "About Us" && (
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <ul className="pl-4 pr-2 py-1 space-y-2">
                          {aboutUsSubmenu.map((sub) => (
                            <li key={sub.label}>
                              <Link
                                href={sub.href}
                                className="block text-white/90 text-base py-2 hover:text-white"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <hr className="border-white/20 w-3/4 my-8" />

        <div className="md:hidden mt-auto mb-8 flex flex-col items-center gap-4 text-white text-lg font-semibold">
          <Link
            href="tel:+255657269674"
            className="flex items-center gap-3 hover:text-orange-300 transition-colors"
          >
            <Phone size={16} color="#79C9E9" />
            <span>+255 657 269 674</span>
          </Link>
          <Link
            href="mailto:portalholdingsznz@gmail.com"
            className="flex items-center gap-3 hover:text-orange-300 transition-colors"
          >
            <Mail size={16} color="#79C9E9" />
            <span>portalholdingsznz@gmail.com</span>
          </Link>
          <button className="flex items-center gap-3 mt-2 border border-white rounded-full px-4 py-2 hover:opacity-80 transition-opacity">
            <Globe size={16} />
            <span>English</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
