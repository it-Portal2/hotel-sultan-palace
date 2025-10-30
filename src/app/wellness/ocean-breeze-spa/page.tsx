import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function OceanBreezeSpaPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
      {/* Hero */}
      <section className="relative w-full h-[520px] md:h-[800px] lg:h-[1018px] overflow-hidden">
        <Image
          src="/spa_hero.png"
          alt="Spa Hero Background"
          fill
          priority
          className="object-cover"
        />
      
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 md:h-40 bg-gradient-to-t from-[#FFFCF6]/90 via-[#FFFCF6]/40 to-transparent"></div>

        <div className="absolute left-1/2 -translate-x-1/2 bottom-6 md:bottom-2 w-full px-4 md:px-10">
          <div className="mx-auto max-w-[700px] text-center">
            <h1 className="text-[#554019] text-lg md:text-2xl lg:text-[24px] font-semibold leading-[1.4] mb-2 md:py-[20px]">
              Where the Ocean Breeze Meets Total Relaxation
            </h1>
            <p className="text-[#423B2D] text-sm md:text-[16px] leading-[1.6] text-center px-2">
              Indulge in a sanctuary of calm at Sultan Palace Spa, where ancient Swahili
              wellness traditions blend with modern luxury. Each treatment is designed to
              restore balance, rejuvenate the body, and elevate the spirit.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mt-[24px] overflow-hidden pb-[80px] md:pb-[120px]">
        <Image src="/spa_hero_bg.png" alt="Section Background" fill className="object-cover opacity-40 filter brightness-[0.5] saturate-75 blur-[1px]" />
        <div className="absolute inset-0 bg-[#FFFCF6]/50" />

        <div className="relative z-10 px-6 md:px-16">
      
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-[23px] justify-items-center">
            {[
              { title: "Island Harmony Ritual", desc: "Mind and body renewal through aromatherapy and gentle rhythmic strokes.", image: "/spa_treatment_1.png" },
              { title: "Ocean Breeze Detox", desc: "Cleanse and rejuvenate your body with sea salt and herbal wraps.", image: "/spa_treatment_2-7c5567.png" },
              { title: "Tropical Rainforest Massage", desc: "Relax with exotic oils inspired by Zanzibar's lush forest aromas.", image: "/spa_treatment_3.png" },
              { title: "Golden Sunset Therapy", desc: "Warm stone massage infused with calming spices to ease tension.", image: "/spa_treatment_4.png" }
            ].map((treatment, i) => (
              <div key={i} className="w-full max-w-[341px] h-auto overflow-hidden bg-white/50 rounded">
                <div className="relative w-full h-[260px] md:h-[380px]">
                  <Image src={treatment.image} alt={treatment.title} fill className="object-cover" />
                </div>
                <div className="py-3 md:py-[10px] flex flex-col items-center">
                  <h3 className="text-[#2A2824] text-base md:text-[20px] font-semibold leading-[1.4] text-center py-[6px] px-2">{treatment.title}</h3>
                  <p className="text-[#655D4E] text-sm md:text-[16px] leading-[1.6] text-center max-w-[280px] md:max-w-[332px] px-3">{treatment.desc}</p>
                </div>
              </div>
            ))}
          </div>

        
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 md:gap-10 mt-8 md:mt-0 mt-[32px] md:mt-[64px]">
            <div className="relative w-full h-[320px] md:h-[700px] order-2 md:order-1">
              <Image src="/spa_portrait-62b712.png" alt="Spa Portrait" fill className="object-cover" />
            </div>
            <div className="relative max-w-[500px] mx-auto text-center order-1 md:order-2 px-4">
              <h1 className="text-[#2A2824] text-xl md:text-[36px] font-semibold leading-[1.3] text-center">Your Island Escape Awaits</h1>
              <div className="space-y-4 md:space-y-5 text-[#423B2D] text-sm md:text-[16px] leading-[1.6] items-center justify-center mt-[16px] md:mt-[25px]">
                <p className="text-center">exotic aromas, and luxurious treatments restore your body, calm your mind, and leave you feeling completely renewed in Zanzibar&apos;s serene beauty.</p>
              </div>
              <Link
                href="#treatments"
                className="inline-flex items-center gap-3 bg-[#FF6A00] hover:opacity-95 transition-opacity text-white px-5 py-3 rounded-[10px] text-sm md:text-[16px] font-semibold mt-[24px] md:mt-[32px] shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                aria-label="Explore Treatments"
              >
                Explore Treatments
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Video banner */}
      <section className="relative mt-0">
        <div className="relative w-full h-[260px] md:h-[672px]">
          <Image src="/spa_video_bg.png" alt="Video Background" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        <button
          aria-label="Play Spa Video"
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 w-[52px] h-[52px] md:w-[72px] md:h-[72px] rounded-full bg-white/90 grid place-items-center shadow-md"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7L8 5z" fill="#242424"/>
          </svg>
        </button>
      </section>

     
     
      </main>
      <Footer />
    </>
  );
}


