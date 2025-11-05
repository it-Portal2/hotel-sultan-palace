"use client";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OffersCarousel from "@/components/home/OffersCarousel";
import TransfersSection from "@/components/shared/TransfersSection";
import ContactUsButton from "@/components/ui/ContactUsButton";
import { useEffect, useRef, useState } from "react";

export default function OffersPage() {
  const [isVisible, setIsVisible] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer for cards
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("card-visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    const cards = document.querySelectorAll(".offer-card");
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
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
            className="object-cover"
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

        <section className="relative min-h-[631px] overflow-hidden">
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
                  className={`offer-card flex flex-col ${offer.layout} items-center gap-[92px] opacity-0 translate-y-12 transition-all duration-1000 ease-out`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="relative w-full md:w-[650px] h-[450px] rounded-[15px] overflow-hidden flex-shrink-0 group cursor-pointer">
                    <Image
                      src={offer.image}
                      alt={offer.title}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out">
                      <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between group">
                    <div className="space-y-[31px]">
                      <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand transform transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FF6A00]">
                        {offer.title}
                      </h3>
                      <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                        {offer.description.map((desc, i) => (
                          <p 
                            key={i}
                            className={`transform transition-all duration-300 ${
                              desc.includes("Not valid") || desc.includes("Blackout") || desc.includes("Offer not valid")
                                ? "text-[#FF6A00] group-hover:translate-x-1"
                                : "group-hover:translate-x-1"
                            }`}
                          >
                            {desc}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6">
                      <ContactUsButton 
                        href="/contact-us"
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

        <OffersCarousel />

        <TransfersSection />
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

        /* Card Animations */
        .offer-card.card-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .offer-card {
          will-change: transform, opacity;
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
      `}</style>
    </>
  );
}