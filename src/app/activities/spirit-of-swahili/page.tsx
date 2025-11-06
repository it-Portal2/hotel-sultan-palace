"use client";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FiArrowRight } from "react-icons/fi";
import { useEffect } from "react";

export default function SpiritOfSwahiliPage() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".so-animate"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("so-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans w-full max-w-full overflow-x-hidden">
        {/* Hero */}
        <section className="relative w-full h-[560px] md:h-[700px] lg:h-[928px] overflow-hidden">
        
          <Image 
            src="/spirit/spirit-hero-2.png" 
            alt="Spirit of Swahili" 
            fill 
            priority 
            loading="eager"
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover" 
            style={{ opacity: 1 }}
          />
         
          <div className="absolute inset-0 pointer-events-none">
            <Image src="/spirit/spirit-top-mask.svg" alt="Mask" fill className="object-cover" />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,252,246,0) 78%, rgba(255,252,246,1) 100%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(0deg, rgba(255,252,246,0) 77%, rgba(255,252,246,1) 100%)",
            }}
          />
        
          <div className="absolute inset-0 z-10 flex items-end justify-center pb-3 md:pb-4 lg:pb-8">
            <div className="w-full max-w-[1120px] px-6 text-center space-y-4 so-animate so-delay-1">
              <h1 className="text-[#554019] text-[22px] md:text-[24px] lg:text-[24px] font-semibold leading-[1.125] font-open-sans">
                Where Culture Meets Coastal Elegance
              </h1>
              <p className="text-[#423B2D] text-[14px] md:text-[16px] lg:text-[16px] font-normal leading-[1.6875] font-open-sans max-w-[742px] mx-auto">
                Welcome to Sultan Palace Hotel Zanzibar, where timeless Swahili traditions blend with royal island luxury.
                Every corner tells a story — of spice, sea, and soul — inviting you to experience Zanzibar not just as a
                destination, but as a living heritage.
              </p>
            </div>
          </div>
        
        </section>

        <section aria-hidden className="h-12 md:h-20 lg:h-24"></section>

        <section className="relative z-30 py-2 md:py-4 mb-10 md:mb-16 lg:mb-20">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <h2 className="text-[#2C271D] text-[24px] md:text-[24px] font-semibold -mt-20 font-open-sans text-center so-animate">
              Experience the Spirit of Swahili
            </h2>
          </div>
        </section>

       
        <section className="relative z-20 -mt-12 md:-mt-16 lg:-mt-20 pb-20 md:pb-26">
          <div className="w-full px-2 md:px-3 lg:px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
              <div className="relative  overflow-hidden so-animate">
                <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[360px] xl:h-[520px]">
                  <Image src="/spirit/spirit-strip-1.png" alt="Spirit Image 1" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
              <div className="relative  overflow-hidden so-animate so-delay-1">
                <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[360px] xl:h-[520px]">
                  <Image src="/spirit/spirit-strip-2.png" alt="Spirit Image 2" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
              <div className="relative  overflow-hidden so-animate so-delay-2">
                <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[360px] xl:h-[520px]">
                  <Image src="/spirit/spirit-strip-3.png" alt="Spirit Image 3" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
              <div className="relative  overflow-hidden so-animate so-delay-3">
                <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] lg:h-[360px] xl:h-[520px]">
                  <Image src="/spirit/spirit-strip-4.png" alt="Spirit Image 4" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-20 pt-2 md:pt-3 pb-1">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6">
            <h2 className="text-[#FF4D00] text-[22px] md:text-[30px] lg:text-[36px] font-semibold leading-[1.25] text-center font-quicksand">
              Where Culture Meets Nature
            </h2>
          </div>
        </section>

         
        <section className="relative z-10 py-12 overflow-visible">
          <div className="absolute left-0 right-0 -top-[400px] bottom-150 z-0 opacity-25 pointer-events-none">
            <Image src="/spirit/spirit-hero-2.png" alt="bg" fill className="object-cover" style={{ objectPosition: "70% 28%" }} />
          </div>
          <div className="relative z-10 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
              <div className="relative rounded-r-[14px] overflow-hidden so-animate">
                <div className="relative w-full h-[400px] md:h-[500px] lg:h-[524px]">
                  <Image src="/spirit/spirit-card1-left-2a13ac.png" alt="Red Colobus Monkeys" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
              <div className="flex items-center so-animate so-delay-1">
                <div className="p-6 md:p-8">
                  <h3 className="text-[#2D2922] text-[30px] font-semibold leading-[1.25] font-quicksand mb-4 md:mb-5">Spice Island Adventures</h3>
                  <p className="text-[#1A1711] text-[16px] font-medium leading-[1.85] font-quicksand max-w-[546px]">
                    Zanzibar’s world-famous spice plantations offer a sensory journey through cloves, cinnamon, nutmeg, and
                    cardamom. Guests can stroll fragrant gardens, learn traditional cultivation, and taste freshly harvested
                    spices — a living tribute to the island’s centuries-old trade and culinary heritage.
                  </p>
                  <Link href="#" className="mt-6 inline-flex items-center gap-4">
                    <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">Begin Adventure</span>
                    <FiArrowRight className="text-[#FF6A00]" size={22} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
              <div className="flex items-center order-2 lg:order-1 so-animate so-delay-1">
                <div className="p-6 md:p-8">
                  <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand mb-4 md:mb-5">Red Colobus Monkeys & Forest Trails</h3>
                  <p className="text-[#1A1711] text-[16px] font-medium leading-[1.85] font-quicksand max-w-[546px]">
                    Explore lush Jozani Forest, home to the rare Red Colobus monkeys. Walk guided trails shaded by giant
                    mangroves and tropical trees, discovering native flora and fauna while witnessing the playful, vibrant
                    life of Zanzibar’s endemic primates in their natural jungle habitat.
                  </p>
                  <Link href="#" className="mt-6 inline-flex items-center gap-4">
                    <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">Begin Adventure</span>
                    <FiArrowRight className="text-[#FF6A00]" size={22} />
                  </Link>
                </div>
              </div>
              <div className="relative rounded-l-[14px] overflow-hidden order-1 lg:order-2 lg:-mt-[120px] so-animate">
                <div className="relative w-full h-[400px] md:h-[500px] lg:h-[524px]">
                  <Image src="/spirit/spirit-card1-right.png" alt="Traditional Art" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 overflow-hidden ">
          {/*  background  */}
          <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
            <Image src="/spirit/spirit-hero-1.png" alt="bg" fill className="object-cover" />
          </div>
          <div className="relative z-10 w-full ">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-15 lg:mb-20">
              <div className="relative rounded-r-[14px] overflow-hidden lg:-mt-[60px] so-animate">
                <div className="relative w-full h-[400px] md:h-[500px] lg:h-[524px]">
                  <Image src="/spirit/spirit-card2-left-c71919.png" alt="Spice Island Adventures" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
              <div className="flex items-center so-animate so-delay-1">
              <div className="flex items-center order-2 lg:order-1">
                <div className="p-6 md:p-8">
                  <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand mb-4 md:mb-5">Swahili Culinary Heritage</h3>
                  <p className="text-[#1A1711] text-[16px] font-medium leading-[1.85] font-quicksand max-w-[546px]">
                    Immerse in the flavors of Swahili cuisine — rich curries, tropical fruits, and freshly caught seafood
                    infused with exotic spices. Cooking workshops and chef-led tastings allow guests to experience the
                    authentic culinary traditions that define Zanzibar’s island lifestyle.
                  </p>
                  <Link href="#" className="mt-6 inline-flex items-center gap-4">
                    <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">Begin Adventure</span>
                    <FiArrowRight className="text-[#FF6A00]" size={22} />
                  </Link>
                </div>
              </div>
              </div>
            </div>

          

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
              <div className="flex items-center order-2 lg:order-1 so-animate so-delay-1">
                <div className="p-6 md:p-8">
                  <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-quicksand mb-4 md:mb-5">Traditional Handicrafts & Art</h3>
                    <p className="text-[#1A1711] text-[16px] font-medium leading-[1.85] font-quicksand max-w-[546px]">
                    Discover Zanzibar’s artistry through visits to local workshops. From intricately carved wooden doors and
                    woven mats to colorful pottery and jewelry, guests engage with artisans preserving generations-old
                    crafts, connecting deeply with the culture and creative spirit of the island.
                  </p>
                  <Link href="#" className="mt-6 inline-flex items-center gap-4">
                    <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">Begin Adventure</span>
                    <FiArrowRight className="text-[#FF6A00]" size={22} />
                  </Link>
                </div>
              </div>
              <div className="relative rounded-l-[14px] overflow-hidden order-1 lg:order-2 lg:-mt-[120px] so-animate">
                <div className="relative w-full h-[400px] md:h-[500px] lg:h-[524px]">
                  <Image src="/spirit/spirit-card2-right.png" alt="Traditional Handicrafts & Art" fill className="object-cover transition-transform duration-700 ease-out hover:scale-105" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="w-full max-w-full overflow-hidden">
            <Image src="/spirit/spirit-deco-1.svg" alt="Spirit Decorative" width={1512} height={769} className="w-full h-auto" />
          </div>
        </section>

      

        <section className="relative w-full max-w-full py-12 md:py-16 lg:py-20 -mt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src="/spirit/black.png" alt="Background" fill className="object-cover" />
          </div>
          <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center gap-5">
              <h3 className="text-white text-[28px] md:text-[32px] lg:text-[36px] font-semibold leading-[1.25] font-open-sans">
                Zanzibar Spice & Culinary Experience
              </h3>
              <p className="text-white/95 text-[16px] md:text-[18px] lg:text-[20px] leading-[1.7] max-w-[1200px] font-open-sans">
                Immerse yourself in the heart of Swahili culinary traditions. Join our chef to explore Zanzibari spices and
                craft authentic dishes inspired by African, Arabian, Indian, and Persian influences. Fresh seafood, tropical
                fruits, and fragrant herbs bring every creation to life. A memorable activity for families, couples, and
                culture enthusiasts seeking a true taste of Zanzibar.
              </p>
              <Link href="#" className="mt-4 inline-flex items-center gap-4">
                <span className="text-[#FF6A00] text-[16px] font-bold leading-[2.3125] font-quicksand">Begin Adventure</span>
                <FiArrowRight className="text-[#FF6A00]" size={22} />
              </Link>
            </div>
          </div>
        </section>
            

        <section className="relative w-full max-w-full h-[520px] md:h-[620px] lg:h-[769px] overflow-hidden">
          <Image src="/spirit/footer-1.jpg" alt="Pre-footer Background" fill className="object-cover" />
        </section>
      </main>
      <Footer />
      <style jsx global>{`
        .so-animate { opacity: 0; transform: translateY(40px); transition: opacity 700ms ease, transform 700ms ease; }
        .so-animate.so-delay-1 { transition-delay: 120ms; }
        .so-animate.so-delay-2 { transition-delay: 240ms; }
        .so-animate.so-delay-3 { transition-delay: 360ms; }
        .so-in { opacity: 1; transform: translateY(0); }
      `}</style>
    </>
  );
}


