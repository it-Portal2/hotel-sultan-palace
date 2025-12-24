"use client";
import Image from "next/image";
import OffersCarousel from "@/components/home/OffersCarousel";
import TransfersSection from "@/components/shared/TransfersSection";
import ContactUsButton from "@/components/ui/ContactUsButton";
import { useEffect, useRef, useState } from "react";
import { useBookingEnquiry } from "@/context/BookingEnquiryContext";
import "@/styles/pages/offers.css";
import { getSpecialOffers, SpecialOffer } from "@/lib/firestoreService";
import { isSpecialOfferValid } from "@/lib/offers";

export default function OffersPage() {
  const { openModal } = useBookingEnquiry();
  const [isVisible, setIsVisible] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [sectionVisible, setSectionVisible] = useState<{ [key: string]: boolean }>({});

  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const data = await getSpecialOffers();
        const now = new Date();
        // Filter valid only
        const valid = data.filter(o => o.isActive && isSpecialOfferValid(o, { now }));
        setOffers(valid);
      } catch (e) {
        console.error("Failed to fetch offers", e);
      } finally {
        setLoadingOffers(false);
      }
    }
    fetchOffers();
  }, []);

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
                      className={`inline-block hero-word ${isVisible ? "hero-word-visible" : ""
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
                className={`text-[#FFFFFF] text-sm md:text-[22px] font-semibold leading-[1.4] tracking-[0.02em] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)] transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
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
              {loadingOffers ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60">
                  <p className="text-xl text-gray-600 font-quicksand">No active offers at the moment. Please check back later!</p>
                </div>
              ) : (
                offers.map((offer, index) => {
                  const isReverse = index % 2 !== 0;
                  // If unique, get from local storage or wait for user to click "Reveal"?
                  // For simplicity on public page with many cards, we show generic logic or allow copy if static.
                  const displayCode = offer.couponMode === 'static' ? offer.couponCode : (offer.couponCode || 'GET CODE');
                  const layoutClass = isReverse ? "md:flex-row-reverse" : "md:flex-row";

                  return (
                    <div
                      key={offer.id}
                      className={`offer-card flex flex-col ${layoutClass} items-center gap-[92px]`}
                    >
                      <div className="relative w-full md:w-[650px] h-[450px] rounded-[15px] overflow-hidden flex-shrink-0 group cursor-pointer offer-card-image">
                        <Image
                          src={offer.imageUrl}
                          alt={offer.title}
                          fill
                          quality={85}
                          sizes="(max-width: 768px) 100vw, 650px"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          unoptimized
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/offer-image.jpg' }}
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
                            <p className="transform transition-all duration-300 offer-desc-item group-hover:translate-x-1 whitespace-pre-wrap">
                              {offer.description}
                            </p>
                            {/* Discount Badge */}
                            <div className="pt-2 flex gap-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-sm font-bold">
                                {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`}
                              </span>
                              {offer.couponMode !== 'none' && (
                                <button
                                  onClick={() => {
                                    // Simple copy logic
                                    let codeToCopy = offer.couponCode;
                                    if (offer.couponMode === 'unique_per_user') {
                                      // Retrieve or generate
                                      if (typeof window !== 'undefined') {
                                        const key = `offer_code_${offer.id}`;
                                        let stored = localStorage.getItem(key);
                                        if (!stored) {
                                          const prefix = offer.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'OFF');
                                          const random = Math.floor(Math.random() * 9000 + 1000);
                                          stored = `${prefix}${random}`;
                                          localStorage.setItem(key, stored);
                                        }
                                        codeToCopy = stored;
                                      }
                                    }
                                    if (codeToCopy) {
                                      navigator.clipboard.writeText(codeToCopy);
                                      alert(`Coupon code copied: ${codeToCopy}`);
                                    }
                                  }}
                                  className="inline-flex items-center text-orange-600 font-semibold hover:text-orange-700"
                                >
                                  <span className="mr-2 border border-orange-200 bg-orange-50 px-2 py-0.5 rounded text-sm font-mono">
                                    {offer.couponMode === 'static' ? offer.couponCode : 'GET CODE'}
                                  </span>
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                  </svg>
                                </button>
                              )}
                            </div>
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
                  )
                })
              )}
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
