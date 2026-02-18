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

  // Hero Animation - Run immediately on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Data Loading
  useEffect(() => {
    let mounted = true;
    async function fetchOffers() {
      try {
        // Add a timeout to the fetch to prevent hanging indefinitely
        const fetchPromise = getSpecialOffers();
        const timeoutPromise = new Promise<SpecialOffer[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );

        const data = await Promise.race([fetchPromise, timeoutPromise]);

        if (mounted) {
          const now = new Date();
          // Filter valid only
          const valid = data.filter(o => o.isActive && isSpecialOfferValid(o, { now }));
          setOffers(valid);
        }
      } catch (e) {
        console.error("Failed to fetch offers", e);
      } finally {
        if (mounted) {
          setLoadingOffers(false);
        }
      }
    }
    fetchOffers();
    return () => { mounted = false; };
  }, []);

  // Intersection Observers - Run when loading is done
  useEffect(() => {
    if (loadingOffers) return;

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
              { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
            );
            observer.observe(element);
            observers.push(observer);
          }
        }
      });

      // Observe individual cards with different animations
      const cards = document.querySelectorAll(".offer-card");
      if (cards.length > 0) {
        cards.forEach((card, index) => {
          if (!observedElements.has(card as HTMLElement)) {
            observedElements.add(card as HTMLElement);

            // Initial check if already visible
            const rect = card.getBoundingClientRect();
            // Expanded check: if it's near the viewport
            if (rect.top < window.innerHeight + 100) {
              card.classList.add("card-visible");
              const animationType = index % 4;
              card.classList.add(`card-animation-${animationType}`);
            } else {
              const observer = new IntersectionObserver(
                (entries) => {
                  entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                      entry.target.classList.add("card-visible");
                      const animationType = index % 4;
                      entry.target.classList.add(`card-animation-${animationType}`);
                      observer.unobserve(entry.target);
                    }
                  });
                },
                { threshold: 0.01, rootMargin: '0px 0px 50px 0px' } // More forgiving threshold/margin
              );
              observer.observe(card);
              observers.push(observer);
            }
          }
        });
      }
    };

    // Run setup after a tick to allow DOM updates
    const timeoutId = setTimeout(setupObservers, 150);
    // Backup check
    const timeoutId2 = setTimeout(setupObservers, 800);
    // Final failsafe to ensure visibility
    const timeoutId3 = setTimeout(() => {
      const cards = document.querySelectorAll(".offer-card");
      cards.forEach((card) => {
        card.classList.add("card-visible");
      });
      setSectionVisible(prev => ({ ...prev, 'cards-section': true, 'carousel-section': true, 'transfers-section': true }));
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [loadingOffers]);

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

        <section ref={(el) => { if (el) sectionRefs.current['cards-section'] = el; }} className={`relative min-h-[631px] offers-cards-section ${sectionVisible['cards-section'] ? 'offers-cards-section-visible' : ''}`}>
          {/* Removed green gradient background to match Figma design (clean white/light background) */}

          <div ref={cardsRef} className="relative z-10 max-w-[1596px] mx-auto px-4 md:px-6 py-16 pb-12 md:pb-16">
            <div className="flex flex-col gap-[60px] md:gap-[100px]">
              {loadingOffers ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
                </div>
              ) : offers.map((offer, index) => {
                const isReverse = index % 2 !== 0;

                return (
                  <div
                    key={offer.id}
                    className={`offer-card flex flex-col ${isReverse ? "md:flex-row-reverse" : "md:flex-row"} items-center justify-between gap-8 md:gap-12 lg:gap-20 opacity-0 translate-y-8 transition-all duration-700 ease-out py-8 md:py-12 border-b border-gray-100 last:border-0`}
                  >
                    <div className="relative w-full md:w-[50%] lg:w-[540px] xl:w-[600px] h-[280px] md:h-[350px] lg:h-[400px] rounded-[15px] overflow-hidden flex-shrink-0 group cursor-pointer offer-card-image shadow-xl hover:shadow-2xl transition-shadow duration-500">
                      <Image
                        src={offer.imageUrl || '/offer-image.jpg'}
                        alt={offer.title}
                        fill
                        quality={95}
                        sizes="(max-width: 768px) 100vw, 600px"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        unoptimized
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/offer-image.jpg' }}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                    </div>

                    <div className="w-full md:w-[50%] flex flex-col justify-center items-start text-left lg:pl-4">
                      <h3 className="text-[#16130E] text-[26px] md:text-[32px] font-bold leading-tight mb-4 font-quicksand tracking-tight">
                        {offer.title}
                      </h3>

                      <div
                        className="text-[#4A4A4A] text-[15px] md:text-[16px] leading-[1.7] md:leading-[1.8] tracking-normal font-quicksand mb-6 md:mb-8"
                        dangerouslySetInnerHTML={{ __html: offer.description }}
                      />

                      <div className="mt-2">
                        <ContactUsButton
                          onClick={openModal}
                          text="Booking Enquiry"
                          width="w-[160px] md:w-[180px]"
                          bgColor="#FF6A00"
                          shadowColor="#E55F00"
                          rounded="rounded-[6px]"
                          textSize="text-[14px] md:text-[15px] font-bold"
                          height="h-[44px] md:h-[48px]"
                        />
                      </div>
                    </div>
                  </div>
                )
              })
              }
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
