"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "Which airlines fly to Zanzibar?",
    answer:
      "Multiple international and regional airlines connect to Zanzibar (ZNZ). Check your preferred carrier or aggregator for current routes and schedules.",
  },
  {
    question: "What is the nearest airport to the hotel?",
    answer:
      "Abeid Amani Karume International Airport, Zanzibar (IATA: ZNZ) is the closest airport to the resort areas on the East Coast.",
  },
  {
    question: "How do I get from the airport to the hotel?",
    answer:
      "If you have booked via a travel agent, they can arrange ground services in Zanzibar. Otherwise, inform the hotel prior to arrival and they can organize transfers at an additional charge.",
  },
  {
    question: "Is the hotel located directly on the beach?",
    answer:
      "Yes. The properties are set right on the powder-soft white sand beaches of Zanzibar’s East Coast.",
  },
  {
    question: "Are the beaches tidal?",
    answer:
      "Like much of the Swahili Coast, the beaches are tidal and change seasonally. During low tide, you can enjoy a complimentary guided reef walk to discover marine life.",
  },
  {
    question: "Are pool towels provided?",
    answer:
      "Yes, pool towels are available at the poolside at no extra charge.",
  },
  {
    question: "What meal plan is offered?",
    answer:
      "Sultan Palace typically offers an all-inclusive meal plan, meaning all meals and house alcoholic and non-alcoholic beverages are included during your stay.",
  },
  {
    question: "Are drinks included?",
    answer:
      "Yes, house alcoholic and non-alcoholic beverages are included with the all-inclusive plan.",
  },
  {
    question: "Can I book Zanzibar excursions directly at the hotel?",
    answer:
      "Yes. The Guest Relations team can help you arrange a variety of local excursions and activities.",
  },
  {
    question: "What are some popular Zanzibar excursions?",
    answer:
      "Popular options include Stone Town tours, Spice Farm visits, Snorkeling at Mnemba, Jozani Forest (red colobus monkeys), and sunset dhow cruises.",
  },
  {
    question: "Does the hotel offer diving and is there a dive school?",
    answer:
      "Diving can be arranged through trusted local operators, and many resorts partner with nearby dive centers for courses and guided dives.",
  },
  {
    question: "Is complimentary Wi‑Fi available in my room/villa?",
    answer:
      "Yes, complimentary Wi‑Fi is available throughout the property, including rooms and villas.",
  },
  {
    question: "Are children allowed at the hotel?",
    answer:
      "Yes, families with children of all ages are welcome. Some facilities and activities may have age guidelines for safety.",
  },
];

type AboutZanzibarProps = {
  compact?: boolean;
};

export default function AboutZanzibar({ compact = false }: AboutZanzibarProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('about-zanzibar-visible');
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const paddingClasses = compact
    ? "pt-4 md:pt-6 lg:pt-8 pb-2 md:pb-6 lg:pb-10"
    : "pt-12 md:pt-16 lg:pt-20 pb-12 md:pb-16 lg:pb-20";

  return (
    <section
      id="about-zanzibar"
      ref={sectionRef}
      className={`w-full relative about-zanzibar-section ${paddingClasses}`}
      style={{ marginTop: 0, marginBottom: 0, position: 'relative', zIndex: 10 }}
    >
      {/* Background Pattern */}
      <div className={`absolute inset-0 z-0 about-zanzibar-bg ${isVisible ? 'about-zanzibar-bg-visible' : ''}`}>
        <Image
          src="/Pattern.png"
          alt="Background pattern"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-8xl px-4 sm:px-6 md:px-8 lg:px-10">
        <h2 className={`text-center font-kaisei text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-[#655D4E] mb-8 md:mb-12 px-2 about-zanzibar-title ${isVisible ? 'about-zanzibar-title-visible' : ''}`}>
          About Zanzibar as a Destination
        </h2>


        <div className="w-full max-w-[900px] mx-auto">
          {(showAll ? faqItems : faqItems.slice(0, 5)).map((item, index) => (
            <div key={index} className={`border-b border-[#CBBB9D] about-zanzibar-item ${isVisible ? 'about-zanzibar-item-visible' : ''}`} style={{ transitionDelay: `${index * 0.1}s` }}>
              <button
                onClick={() => toggleItem(index)}
                className="w-full py-3 md:py-4 flex items-center justify-between text-left gap-3"
              >
                <span className="font-kaisei text-[#655D4E] text-base sm:text-lg pr-2 md:pr-6 flex-1 text-left">
                  {item.question}
                </span>

                <div className="text-[#BE8C53] text-3xl md:text-4xl lg:text-5xl font-light transition-transform duration-300 ease-in-out flex-shrink-0"
                  style={{ transform: openItems.includes(index) ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </div>
              </button>


              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${openItems.includes(index) ? 'max-h-[500px]' : 'max-h-0'}`}
              >
                <div className="pt-2 pb-4 md:pb-6 pr-2 md:pr-8">
                  <p className="font-kaisei text-sm sm:text-base text-[#3D3D3D] leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {faqItems.length > 5 && (
            <div className={`text-center mt-6 about-zanzibar-button ${isVisible ? 'about-zanzibar-button-visible' : ''}`}>
              <button
                onClick={() =>
                  setShowAll(prev => {
                    const next = !prev;
                    if (prev) {
                      // Collapsing to fewer items; ensure we stay at this section
                      requestAnimationFrame(() => {
                        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      });
                    }
                    return next;
                  })
                }
                className="px-5 md:px-6 py-2 border border-[#BE8C53] text-[#BE8C53] hover:bg-[#BE8C53] hover:text-white transition-colors rounded text-sm md:text-base"
              >
                {showAll ? 'View less' : 'View more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}