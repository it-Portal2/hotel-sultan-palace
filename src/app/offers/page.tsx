"use client";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OffersCarousel from "@/components/home/OffersCarousel";
import TransfersSection from "@/components/shared/TransfersSection";
import ContactUsButton from "@/components/ui/ContactUsButton";
import { useEffect, useRef, useState } from "react";
import { useBookingEnquiry } from "@/context/BookingEnquiryContext";

export default function OffersPage() {
  const { openModal } = useBookingEnquiry();
  const [isVisible, setIsVisible] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [sectionVisible, setSectionVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    setIsVisible(true);
    
    // Enhanced Intersection Observer for sections and cards
    const observers: IntersectionObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    const setupObservers = () => {
      // Observe sections
      const sectionKeys = ['cards-section', 'carousel-section', 'transfers-section'];
      
      sectionKeys.forEach((key) => {
        const element = sectionRefs.current[key];
        if (element && !observedElements.has(element)) {
          observedElements.add(element);
          
          const rect = element.getBoundingClientRect();
          const isVisibleNow = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isVisibleNow) {
            setTimeout(() => {
              setSectionVisible((prev) => ({ ...prev, [key]: true }));
              element.classList.add(`offers-${key}-visible`);
            }, 100);
          } else {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    setSectionVisible((prev) => ({ ...prev, [key]: true }));
                    entry.target.classList.add(`offers-${key}-visible`);
                    observer.unobserve(entry.target);
                  }
                });
              },
              { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
            );
            observer.observe(element);
            observers.push(observer);
          }
        }
      });

      // Observe individual cards with different animations
      const cards = document.querySelectorAll(".offer-card");
      cards.forEach((card, index) => {
        if (!observedElements.has(card as HTMLElement)) {
          observedElements.add(card as HTMLElement);
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("card-visible");
                  // Add specific animation class based on index
                  const animationType = index % 4;
                  entry.target.classList.add(`card-animation-${animationType}`);
                  observer.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.15, rootMargin: '0px 0px -100px 0px' }
          );
          observer.observe(card);
          observers.push(observer);
        }
      });
    };

    setupObservers();
    const timeoutId = setTimeout(setupObservers, 200);
    const timeoutId2 = setTimeout(setupObservers, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const headingWords = "Exclusive Offers & Packages".split(" ");

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans w-full max-w-full overflow-x-hidden">
        <section className="relative w-full h-[520px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/offers/hero.png"
            alt="Offers Hero Background"
            fill
            priority
            loading="eager"
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 1 }}
          />
        
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24 px-4">
            <div className="text-center max-w-[680px] px-2">
              <h1 
                ref={headingRef}
                className="text-[#FFFFFF] text-2xl md:text-4xl lg:text-[48px] font-semibold leading-[1.15] md:leading-[1.2] tracking-[0.02em] mb-3 md:mb-6 drop-shadow-[0px_4px_26.4px_rgba(0,0,0,0.69)] relative overflow-hidden"
              >
                <span className="flex flex-wrap justify-center gap-x-2">
                  {headingWords.map((word, index) => (
                    <span
                      key={index}
                      className={`inline-block hero-word ${
                        isVisible ? "hero-word-visible" : ""
                      }`}
                      style={{
                        animationDelay: `${index * 0.2}s`,
                      }}
                    >
                      {word === "&" ? (
                        <span className="relative inline-block">
                          <span className="shimmer-text">&</span>
                        </span>
                      ) : (
                        <span className="relative inline-block">
                          {word}
                          <span className="absolute inset-0 shimmer-overlay"></span>
                        </span>
                      )}
                    </span>
                  ))}
                </span>
              </h1>
              <p 
                className={`text-[#FFFFFF] text-sm md:text-[22px] font-semibold leading-[1.4] tracking-[0.02em] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all duration-1000 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ animationDelay: "1s" }}
              >
                Special deals available only when booking directly through our official website
              </p>
            </div>
          </div>
        </section>

        <section ref={(el) => { if (el) sectionRefs.current['cards-section'] = el; }} className={`relative min-h-[631px] overflow-hidden offers-cards-section ${sectionVisible['cards-section'] ? 'offers-cards-section-visible' : ''}`}>
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'linear-gradient(180deg, #616C26 0%, #C8CCB3 31%, #F1F2EE 49%, #FFFFFF 62%, #FFFFFF 71%, #FFFFFF 100%)',
              opacity: 1
            }}
          ></div>
          
          <div ref={cardsRef} className="relative z-10 max-w-[1596px] mx-auto px-4 md:px-6 py-16">
            <div className="flex flex-col gap-[40px]">
              {[
                {
                  image: "/offers/advance-escape-bg.png",
                  title: "Advance Escape Offer",
                  description: [
                    "Save 10% when you confirm your stay at least 5 months in advance.",
                    "Plan early, pay less, and look forward to your tropical dream.",
                    "Not valid during July, August & festive season."
                  ],
                  layout: "md:flex-row"
                },
                {
                  image: "/offers/stay-more-bg.png",
                  title: "Stay More, Spend Less",
                  description: [
                    "Stay 5 nights and pay for only 4!",
                    "Enjoy an extra night of ocean breeze, relaxation, and island luxury — on us.",
                    "Blackout dates: July, August & festive period."
                  ],
                  layout: "md:flex-row-reverse"
                },
                {
                  image: "/offers/family-getaway-bg.png",
                  title: "Family Getaway Treat",
                  description: [
                    "Children under 12 years stay free when sharing with parents in Garden View Villas (up to 2 kids).",
                    "Perfect opportunity to make family memories that last forever.",
                    "Not valid during July, August & festive period."
                  ],
                  layout: "md:flex-row"
                },
                {
                  image: "/offers/seventh-night-bg.png",
                  title: "Seventh Night on Us",
                  description: [
                    "Celebrate your love with our Honeymoon Indulgence Offer 💍",
                    "Stay 5 nights or more and enjoy:",
                    "• Complimentary 30-minute couple's massage",
                    "• Welcome bottle of wine & sunset cocktail for two",
                    "• 10% off scuba diving experiences",
                    "Valid within one year of your wedding (proof required).",
                    "Not valid during July, August & festive season."
                  ],
                  layout: "md:flex-row-reverse"
                },
                {
                  image: "/offers/family-getaway-bg.png",
                  title: "Romance by the Ocean",
                  description: [
                    "Stay 7 nights, pay for only 5 — and receive:",
                    "• A bottle of sparkling wine upon arrival",
                    "• Sunset drinks at our beach bar",
                    "• 10% off all water activities",
                    "Offer not valid during July, August & festive period."
                  ],
                  layout: "md:flex-row"
                }
              ].map((offer, index) => (
                <div 
                  key={index}
                  className={`offer-card flex flex-col ${offer.layout} items-center gap-[92px]`}
                >
                  <div className="relative w-full md:w-[650px] h-[450px] rounded-[15px] overflow-hidden flex-shrink-0 group cursor-pointer offer-card-image">
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      fill
                      quality={85}
                      sizes="(max-width: 768px) 100vw, 650px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between group offer-card-content">
                    <div className="space-y-[31px]">
                      <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand transform transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FF6A00]">
                        {offer.title}
                      </h3>
                      <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                        {offer.description.map((desc, i) => (
                          <p 
                            key={i}
                            className={`transform transition-all duration-300 offer-desc-item ${
                              desc.includes("Not valid") || desc.includes("Blackout") || desc.includes("Offer not valid")
                                ? "text-[#FF6A00] group-hover:translate-x-1"
                                : "group-hover:translate-x-1"
                            }`}
                            style={{ transitionDelay: `${i * 0.05}s` }}
                          >
                            {desc}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 offer-card-button">
                      <ContactUsButton 
                        onClick={openModal}
                        text="Booking Enquiry"
                        width="w-[170px]"
                        bgColor="#FF6A00"
                        shadowColor="#FF6A00"
                        rounded="rounded-[5px]"
                        textSize="text-[15px]"
                        height="h-[41px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div ref={(el) => { if (el) sectionRefs.current['carousel-section'] = el; }} className={`offers-carousel-section ${sectionVisible['carousel-section'] ? 'offers-carousel-section-visible' : ''}`}>
          <OffersCarousel />
        </div>

        <div ref={(el) => { if (el) sectionRefs.current['transfers-section'] = el; }} className={`offers-transfers-section ${sectionVisible['transfers-section'] ? 'offers-transfers-section-visible' : ''}`}>
          <TransfersSection />
        </div>
      </main>
      <Footer />

      <style jsx global>{`
        /* Hero Heading Animations */
        .hero-word {
          opacity: 0;
          transform: translateY(30px) rotateX(90deg);
          animation: wordReveal 0.8s ease-out forwards;
        }

        .hero-word-visible {
          animation: wordReveal 0.8s ease-out forwards;
        }

        @keyframes wordReveal {
          0% {
            opacity: 0;
            transform: translateY(30px) rotateX(90deg);
          }
          50% {
            opacity: 0.5;
            transform: translateY(15px) rotateX(45deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg);
          }
        }

        .shimmer-text {
          display: inline-block;
          background: linear-gradient(90deg, #FFFFFF 0%, #FF6A00 50%, #FFFFFF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .shimmer-overlay {
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
          pointer-events: none;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% center;
          }
          100% {
            background-position: -200% center;
          }
        }

        /* Section Animations */
        .offers-cards-section {
          opacity: 0 !important;
          transform: translateY(80px) scale(0.98) !important;
          transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }
        .offers-cards-section.offers-cards-section-visible {
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
        }

        .offers-carousel-section {
          opacity: 0 !important;
          transform: translateX(100px) !important;
          transition: all 1s ease-out 0.3s !important;
        }
        .offers-carousel-section.offers-carousel-section-visible {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        .offers-transfers-section {
          opacity: 0 !important;
          transform: translateY(60px) !important;
          transition: all 1s ease-out 0.4s !important;
        }
        .offers-transfers-section.offers-transfers-section-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        /* Card Animations - Different for each card */
        .offer-card {
          opacity: 0 !important;
          will-change: transform, opacity;
        }

        /* Animation Type 0: Slide from left + rotate */
        .offer-card.card-animation-0 {
          transform: translateX(-150px) rotateY(-15deg) scale(0.9) !important;
          transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        .offer-card.card-animation-0.card-visible {
          opacity: 1 !important;
          transform: translateX(0) rotateY(0deg) scale(1) !important;
        }

        /* Animation Type 1: Slide from right + rotate */
        .offer-card.card-animation-1 {
          transform: translateX(150px) rotateY(15deg) scale(0.9) !important;
          transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s !important;
        }
        .offer-card.card-animation-1.card-visible {
          opacity: 1 !important;
          transform: translateX(0) rotateY(0deg) scale(1) !important;
        }

        /* Animation Type 2: Slide from bottom + scale + rotate */
        .offer-card.card-animation-2 {
          transform: translateY(120px) rotateX(10deg) scale(0.85) !important;
          transition: all 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s !important;
        }
        .offer-card.card-animation-2.card-visible {
          opacity: 1 !important;
          transform: translateY(0) rotateX(0deg) scale(1) !important;
        }

        /* Animation Type 3: Fade + zoom + rotate */
        .offer-card.card-animation-3 {
          transform: scale(0.7) rotateZ(-5deg) !important;
          transition: all 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s !important;
        }
        .offer-card.card-animation-3.card-visible {
          opacity: 1 !important;
          transform: scale(1) rotateZ(0deg) !important;
        }

        /* Card Image Animation */
        .offer-card-image {
          opacity: 0 !important;
          transform: scale(1.1) !important;
          transition: all 0.8s ease-out 0.4s !important;
        }
        .offer-card.card-visible .offer-card-image {
          opacity: 1 !important;
          transform: scale(1) !important;
        }

        /* Card Content Animation */
        .offer-card-content {
          opacity: 0 !important;
          transform: translateY(30px) !important;
          transition: all 0.8s ease-out 0.6s !important;
        }
        .offer-card.card-visible .offer-card-content {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        /* Description Items Staggered Animation */
        .offer-desc-item {
          opacity: 0 !important;
          transform: translateX(-20px) !important;
          transition: all 0.6s ease-out !important;
        }
        .offer-card.card-visible .offer-desc-item {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }

        /* Button Animation */
        .offer-card-button {
          opacity: 0 !important;
          transform: scale(0.8) translateY(20px) !important;
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s !important;
        }
        .offer-card.card-visible .offer-card-button {
          opacity: 1 !important;
          transform: scale(1) translateY(0) !important;
        }

        /* Additional hover effects */
        .offer-card:hover .group {
          transform: translateY(-5px);
        }

        .offer-card .group {
          transition: transform 0.3s ease-out;
        }

        /* Button pulse effect */
        @keyframes buttonPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 106, 0, 0.7);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(255, 106, 0, 0);
          }
        }

        .group\/btn:hover {
          animation: buttonPulse 2s infinite;
        }

        /* Enhanced card hover effect */
        .offer-card.card-visible:hover {
          transform: translateY(-8px) !important;
        }

        .offer-card.card-visible:hover .offer-card-image {
          transform: scale(1.05) !important;
        }
      `}</style>
    </>
  );
}