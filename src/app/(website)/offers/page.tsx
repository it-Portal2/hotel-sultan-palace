"use client";
import Image from "next/image";
import OffersCarousel from "@/components/home/OffersCarousel";
import TransfersSection from "@/components/shared/TransfersSection";
import ContactUsButton from "@/components/ui/ContactUsButton";
import { useEffect, useRef, useState } from "react";
import { useBookingEnquiry } from "@/context/BookingEnquiryContext";
import "@/styles/pages/offers.css";

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
          
          <div ref={cardsRef} className="relative z-10 max-w-[1596px] mx-auto px-4 md:px-6 py-16 pb-12 md:pb-16">
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

        <div ref={(el) => { if (el) sectionRefs.current['carousel-section'] = el; }} className={`offers-carousel-section ${sectionVisible['carousel-section'] ? 'offers-carousel-section-visible' : ''}`} style={{ marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}>
          <OffersCarousel />
        </div>

        <div ref={(el) => { if (el) sectionRefs.current['transfers-section'] = el; }} className={`offers-transfers-section ${sectionVisible['transfers-section'] ? 'offers-transfers-section-visible' : ''}`} style={{ marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}>
          <TransfersSection />
        </div>
      </main>
          </>
  );
}
