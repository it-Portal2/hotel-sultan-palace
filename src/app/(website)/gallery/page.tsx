"use client";
import Image from "next/image";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { getGalleryImages, GalleryType } from "@/lib/firestoreService";
import "@/styles/pages/gallery.css";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/plugins/counter.css";

const FILTERS: { label: string; value: GalleryType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Villas", value: "villas" },
  { label: "Pool", value: "pool" },
  { label: "Spa", value: "spa" },
  { label: "Beach", value: "beach" },
  { label: "Restaurant & Bars", value: "restaurant_bars" },
  { label: "Facilities", value: "facilities" },
];

export default function GalleryPage() {
  const [active, setActive] = useState<GalleryType | "all">("all");
  const [allImages, setAllImages] = useState<{ imageUrl: string; type: GalleryType }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [index, setIndex] = useState(-1);

  // Refs for animation
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Initial load animation
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

  // Fetch images
  useEffect(() => {
    (async () => {
      const items = await getGalleryImages();
      setAllImages(items.map((i) => ({ imageUrl: i.imageUrl, type: i.type })));
    })();
  }, []);

  // Filter and deduplicate images
  const filtered = useMemo(() => {
    const arr = allImages.filter((i) => active === "all" || i.type === active).map((i) => i.imageUrl);
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const src of arr) {
      if (!seen.has(src)) { seen.add(src); uniq.push(src); }
    }
    return uniq;
  }, [allImages, active]);

  // Slides for lightbox
  const slides = useMemo(() => filtered.map((src) => ({ src })), [filtered]);

  // Render Grid
  const renderGrid = () => {
    const sections: React.ReactElement[] = [];
    let currentGlobalIndex = 0;

    for (let i = 0; i < filtered.length; i += 9) {
      const chunkStartIndex = i;
      const gridChunk = filtered.slice(i, i + 8);
      const hero = filtered[i + 8];

      // We need to capture the global index for each item to open the correct slide
      const chunkItems = gridChunk.map((src, idx) => ({
        src,
        globalIndex: chunkStartIndex + idx
      }));

      // Grid part
      if (chunkItems.length) {
        sections.push(
          <div key={`grid-${i}`} className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
              {chunkItems.map((item, idx) => (
                <button
                  key={`${item.src}-${idx}`}
                  onClick={() => setIndex(item.globalIndex)}
                  className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group gallery-image-card text-left rounded"
                >
                  <Image
                    src={item.src}
                    alt="Gallery"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                    className="object-cover transition-transform duration-300 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <span className="gallery-view-label text-white text-base md:text-lg font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300">View →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      }

      // Hero part
      if (hero) {
        const heroIndex = chunkStartIndex + 8;
        sections.push(
          <div key={`hero-${i}`} className="mb-8 gallery-full-image">
            <button
              onClick={() => setIndex(heroIndex)}
              className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group text-left rounded"
            >
              <Image
                src={hero}
                alt="Gallery Feature"
                fill
                unoptimized
                sizes="100vw"
                className="object-cover transition-transform duration-300 ease-out"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
              <div className="absolute inset-0 flex items-end justify-center pb-4">
                <span className="gallery-view-label text-white text-base md:text-lg font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300">View →</span>
              </div>
            </button>
          </div>
        );
      }
    }
    return sections;
  };

  return (
    <>
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans w-full max-w-full overflow-x-hidden" style={{ transform: 'none', willChange: 'auto' }}>
        {/* Hero Section */}
        <section className="relative w-full h-[680px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/gallery/hero-main-6ecfac.png"
            alt="Gallery Hero Background"
            fill
            priority
            loading="eager"
            fetchPriority="high"
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{ opacity: 1 }}
          />
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
                  className={`px-4 py-2 rounded-lg text-lg font-semibold font-quicksand gallery-filter-btn relative overflow-hidden ${active === f.value
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
              {renderGrid()}
            </div>
          </div>
        </section>
      </main>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={slides}
        plugins={[Zoom, Counter, Thumbnails]}
        zoom={{
          maxZoomPixelRatio: 5,
        }}
      />
    </>
  );
}
