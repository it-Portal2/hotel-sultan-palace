"use client";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useState, useRef } from "react";
import { getGalleryImages, GalleryType } from "@/lib/firestoreService";

const FILTERS: { label: string; value: GalleryType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Villas", value: "villas" },
  { label: "Pool", value: "pool" },
  { label: "Spa", value: "spa" },
  { label: "Beach", value: "beach" },
  { label: "Water Sports", value: "water_sports" },
  { label: "Restaurant & Bars", value: "restaurant_bars" },
  { label: "FACILITIES", value: "facilities" },
];

export default function GalleryPage() {
  const [active, setActive] = useState<GalleryType | "all">("all");
  const [extra, setExtra] = useState<{ imageUrl: string; type: GalleryType }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('section-visible');
        }
      });
    }, observerOptions);

    [heroRef, filterRef, galleryRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    (async () => {
      const items = await getGalleryImages();
      setExtra(items.map((i) => ({ imageUrl: i.imageUrl, type: i.type })));
    })();
  }, []);

  const filtered = extra.filter((i) => active === "all" || i.type === active).map((i) => i.imageUrl);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        {/* Hero Section */}
        <section className="relative w-full h-[680px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image src="/gallery/hero-main-6ecfac.png" alt="Gallery Hero Background" fill priority className="object-cover gallery-hero-bg" />
          <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-end pb-90 px-4">
            <div className="text-center max-w-[680px]">
              <h1 className={`text-[#FFFFFF] text-3xl md:text-4xl lg:text-[48px] font-semibold leading-[0.56] tracking-[0.05em] mb-10 drop-shadow-[0px_4px_26.4px_rgba(0,0,0,0.69)] gallery-hero-title ${isVisible ? 'gallery-hero-title-visible' : ''}`}>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.1s' }}>G</span>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.2s' }}>a</span>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.3s' }}>l</span>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.4s' }}>l</span>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.5s' }}>e</span>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.6s' }}>r</span>
                <span className="inline-block gallery-word" style={{ animationDelay: '0.7s' }}>y</span>
              </h1>
              <p className={`text-[#FFFFFF] text-lg md:text-[22px] font-semibold leading-[1.35] tracking-[0.05em] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)] gallery-hero-description ${isVisible ? 'gallery-hero-description-visible' : ''}`}>
                Discover the beauty and elegance of Sultan Palace Hotel through our stunning collection of images
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section ref={filterRef} className="py-8 mt-10 bg-[#FFFCF6]">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
              {FILTERS.map((f, index) => (
                <button
                  key={f.value}
                  onClick={() => setActive(f.value)}
                  className={`px-4 py-2 rounded-lg text-lg font-semibold font-quicksand gallery-filter-btn relative overflow-hidden ${
                    active === f.value
                      ? "bg-[#FF6A00] text-white"
                      : "border border-[#655D4E] text-[#655D4E] hover:bg-[#655D4E] hover:text-white transition-colors"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="relative z-10">{f.label}</span>
                  {active === f.value && (
                    <span className="absolute inset-0 bg-white/20 gallery-filter-active"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section ref={galleryRef} className="py-10 md:py-16 bg-[#FFFCF6] relative gallery-section">
          {/* Background */}
          <div className="absolute top-1/2 left-0 right-0 bottom-0 z-0">
            <Image src="/gallery/bg.png" alt="Gallery Background" fill className="object-cover gallery-bg-image" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            <div className="max-w-9xl mx-auto px-4 md:px-6">
              {/* Row 1 - mixed static + dynamic */}
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                  {["/gallery/gallery-1.png", "/gallery/gallery-2.png", "/gallery/gallery-3.png", "/gallery/gallery-4.png", ...filtered]
                    .slice(0, 8)
                    .map((src, idx) => (
                      <div key={src + idx} className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group gallery-image-card">
                        <Image src={src} alt="Gallery" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-0 gallery-shimmer opacity-0 group-hover:opacity-100"></div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Full width */}
              <div className="mb-8 gallery-full-image">
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group">
                  <Image src="/gallery/gallery-full-1.png" alt="Full Width Image" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 gallery-shimmer opacity-0 group-hover:opacity-100"></div>
                </div>
              </div>

              {/* Row 2 - dynamic */}
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                  {filtered.slice(0, 8).map((src, idx) => (
                    <div key={src + idx} className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group gallery-image-card">
                      <Image src={src} alt="Gallery" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 gallery-shimmer opacity-0 group-hover:opacity-100"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full width */}
              <div className="mb-8 gallery-full-image">
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group">
                  <Image src="/gallery/gallery-full-2.png" alt="Full Width Image" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 gallery-shimmer opacity-0 group-hover:opacity-100"></div>
                </div>
              </div>

              {/* Row 3 - static showcase */}
              <div className="mb-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                  {["/gallery/gallery-3.png", "/gallery/gallery-4.png", "/gallery/gallery-5.png", "/gallery/gallery-6.png", "/gallery/gallery-7.png", "/gallery/gallery-1.png", "/gallery/gallery-2.png", "/gallery/gallery-3.png"]
                    .map((src, idx) => (
                      <div key={src + idx} className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group gallery-image-card">
                        <Image src={src} alt="Gallery" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-0 gallery-shimmer opacity-0 group-hover:opacity-100"></div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Final full width */}
              <div className="mb-8 gallery-full-image">
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group">
                  <Image src="/gallery/gallery-full-1.png" alt="Final Full Width Image" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-0 gallery-shimmer opacity-0 group-hover:opacity-100"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx global>{`
        /* Hero Section Animations */
        .gallery-hero-bg {
          transition: transform 20s ease-out;
        }
        .gallery-hero-title-visible .gallery-hero-bg {
          transform: scale(1.1);
        }
        .gallery-hero-title {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .gallery-hero-title-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .gallery-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(30px) rotateY(90deg);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .gallery-hero-title-visible .gallery-word {
          opacity: 1;
          transform: translateY(0) rotateY(0deg);
        }
        .gallery-hero-description {
          opacity: 0;
          transform: translateY(40px) scale(0.9);
          transition: all 1s ease-out 0.8s;
        }
        .gallery-hero-description-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Filter Section Animations */
        .gallery-filter-btn {
          opacity: 0;
          transform: translateY(-20px) scale(0.9);
          transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .section-visible .gallery-filter-btn,
        .gallery-filter-btn.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .gallery-filter-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(255, 106, 0, 0.3);
        }
        .gallery-filter-active {
          animation: galleryFilterPulse 2s ease-in-out infinite;
        }
        @keyframes galleryFilterPulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }

        /* Gallery Section Animations */
        .gallery-section {
          opacity: 0;
          transform: translateY(60px);
          transition: all 1.2s ease-out;
        }
        .section-visible .gallery-section,
        .gallery-section.section-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .gallery-bg-image {
          transition: transform 30s ease-out;
        }
        .section-visible .gallery-bg-image,
        .gallery-bg-image.section-visible {
          transform: scale(1.15);
        }
        .gallery-image-card {
          opacity: 0;
          transform: translateY(80px) scale(0.85) rotateY(10deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .section-visible .gallery-image-card,
        .gallery-image-card.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1) rotateY(0deg);
        }
        .gallery-image-card:nth-child(1) {
          transition-delay: 0.1s;
        }
        .gallery-image-card:nth-child(2) {
          transition-delay: 0.2s;
        }
        .gallery-image-card:nth-child(3) {
          transition-delay: 0.3s;
        }
        .gallery-image-card:nth-child(4) {
          transition-delay: 0.4s;
        }
        .gallery-image-card:nth-child(5) {
          transition-delay: 0.5s;
        }
        .gallery-image-card:nth-child(6) {
          transition-delay: 0.6s;
        }
        .gallery-image-card:nth-child(7) {
          transition-delay: 0.7s;
        }
        .gallery-image-card:nth-child(8) {
          transition-delay: 0.8s;
        }
        .gallery-full-image {
          opacity: 0;
          transform: translateY(100px) scale(0.9);
          transition: all 1s ease-out 0.5s;
        }
        .section-visible .gallery-full-image,
        .gallery-full-image.section-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* Shimmer Effect */
        .gallery-shimmer {
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          background-size: 200% 200%;
          animation: galleryShimmer 4s ease-in-out infinite;
        }
        @keyframes galleryShimmer {
          0%, 100% {
            background-position: -200% 0;
          }
          50% {
            background-position: 200% 0;
          }
        }

        /* Additional hover effects */
        .section-visible .gallery-image-card:hover,
        .gallery-image-card.section-visible:hover {
          transform: translateY(-5px) scale(1.05) rotateY(0deg);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .section-visible .gallery-full-image:hover,
        .gallery-full-image.section-visible:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </>
  );
}
