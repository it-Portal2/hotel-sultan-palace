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
    <div className="hidden md:flex items-center gap-6 text-white text-[13px] font-semibold">
      <div className="flex items-center gap-2">
        <Clock size={16} />
        <span>Local time: {now || "--:--"}</span>
      </div>
      <div className="flex items-center gap-2">
        <Thermometer size={16} />
        <span>
          Temperature: {tempC !== null ? `${tempC}°C / ${tempF}°F` : "--"}
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

  const socialLinks = [
    { name: "Whatsapp", icon: FaWhatsapp, href: "#" },
    { name: "Facebook", icon: FaFacebookF, href: "#" },
    { name: "LinkedIn", icon: FaLinkedinIn, href: "#" },
    { name: "Twitter", icon: FaTwitter, href: "#" },
  ];

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Activities", caret: true, href: "#", hasSubmenu: true },
    { label: "Wellness & Relaxation", caret: true, href: "#", hasSubmenu: true },
    { label: "Villas", href: "#" },
    { label: "Gallery", href: "#" },
    { label: "Offers",  href: "/offers" },
    { label: "About Us", href: "#" ,caret: true, hasSubmenu: true},
    { label: "Contact Us", href: "/contact-us" },
  ];

  const activitiesSubmenu = [
    { label: "Deep Blue Dive", href: "#" },
    { label: "Aqua Adventure", href: "#" },
    { label: "Spirit of Swahili", href: "#" },
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

  return (
    <>
      <header className="w-full absolute top-0 left-0 z-30 font-open-sans">
        <div className="w-full px-4 lg:px-12">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-6 lg:gap-8">
              <div className="flex items-center gap-4">
                {socialLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-white hover:text-orange-300 transition-colors"
                  >
                    <link.icon size={14} />
                  </Link>
                ))}
              </div>
              <TimeAndTemperature />
            </div>
            <div className="hidden md:flex items-center gap-5 text-white text-[13px] font-semibold">
              <div className="flex items-center gap-2">
                <Phone size={12} color="#79C9E9" />
                <div className="flex gap-2 text-[12px]">
                  <Link href="tel:+255684888111" className="hover:text-orange-300 transition-colors">+255 684 888 111</Link>
                  <span>,</span>
                  <Link href="tel:+255657269674" className="hover:text-orange-300 transition-colors">+255 657 269 674</Link>
                </div>
              </div>
              <Link
                href="mailto:portalholdingsznz@gmail.com"
                className="flex items-center gap-2 hover:text-orange-300 transition-colors"
              >
                <Mail size={12} color="#79C9E9" />
                <span className="text-[12px]">portalholdingsznz@gmail.com</span>
              </Link>
              <button className="flex items-center gap-2 border border-white rounded-full px-2 py-1 hover:opacity-80 transition-opacity">
                <Globe size={12} className="text-white" />
                <span className="text-white font-medium text-[13px]">
                  English
                </span>
                <ChevronDown size={12} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        <hr className="border-white/20" />

        <div className="w-full px-4 lg:px-20">
          <div className="flex items-center justify-between py-1">
            <Link href="/" className="flex-shrink-0 z-50">
              <Image
                src="/sultan-logo.png"
                alt="Sultan Palace"
                width={200}
                height={200}
                priority
                className="!h-16 !w-auto md:!h-20" 
                style={{ height: "80px", width: "auto" }}
              />
            </Link>

            <nav className="hidden lg:flex items-center justify-center gap-6 text-white text-[12px] font-semibold font-open-sans w-full">
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
                      className="whitespace-nowrap hover:text-orange-300 transition-colors flex items-center gap-2"
                    >
                      {item.label}
                      {item.caret && !(
                        (item.label === "Activities" && isActivitiesMenuOpen) ||
                        (item.label === "Wellness & Relaxation" && isWellnessMenuOpen) ||
                       
                        (item.label === "About Us" && isAboutUsMenuOpen)
                      ) && <ChevronDown size={14} />}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="whitespace-nowrap hover:text-orange-300 transition-colors flex items-center gap-2"
                    >
                      {item.label}
                      {item.caret && <ChevronDown size={14} />}
                    </Link>
                  )}
                  
                  {/* Activities Submenu */}
                  {item.hasSubmenu && item.label === "Activities" && isActivitiesMenuOpen && (
                    <div className="submenu-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 py-2 w-[194px] bg-[#242424] shadow-lg z-50">
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
                  {item.hasSubmenu && item.label === "Wellness & Relaxation" && isWellnessMenuOpen && (
                    <div className="submenu-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 py-2 w-[194px] bg-[#242424] shadow-lg z-50">
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
                  {item.hasSubmenu && item.label === "About Us" && isAboutUsMenuOpen && (
                    <div className="submenu-container absolute top-full left-1/2 transform -translate-x-1/2 mt-2 py-2 w-[194px] bg-[#242424] shadow-lg z-50">
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

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <BookNowButton scrollTo="booking-form" size="sm" className="text-[14px]" />
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
        flex flex-col items-center justify-center
      `}
      >
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-5 right-5 text-white z-50"
        >
          <X size={32} />
        </button>

        <nav className="flex flex-col items-center gap-6 text-center">
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white text-2xl font-semibold hover:text-orange-300 transition-colors flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
              {item.caret && <ChevronDown size={20} />}
            </Link>
          ))}
        </nav>

        <hr className="border-white/20 w-3/4 my-8" />

        <div className="md:hidden flex flex-col items-center gap-4 text-white text-lg font-semibold">
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
