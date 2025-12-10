"use client";
import Image from "next/image";
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect, useState, useRef } from "react";
import { getGalleryImages, GalleryType } from "@/lib/firestoreService";
import "@/styles/pages/gallery.css";

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
  const [extra, setExtra] = useState<{ imageUrl: string; type: GalleryType }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Reset zoom and position when lightbox opens/closes
  useEffect(() => {
    if (lightboxOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [lightboxOpen]);

  // Mouse wheel zoom
  useEffect(() => {
    if (!lightboxOpen || !containerRef.current || !imageRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(1, Math.min(5, zoom + delta));
      
      if (newZoom !== zoom) {
        const rect = containerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const zoomChange = newZoom / zoom;
        let newX = x - (x - position.x) * zoomChange;
        let newY = y - (y - position.y) * zoomChange;
        
        // Apply boundaries
        if (newZoom > 1 && imageRef.current) {
          const imgRect = imageRef.current.getBoundingClientRect();
          const imgWidth = imgRect.width * newZoom;
          const imgHeight = imgRect.height * newZoom;
          const maxX = Math.max(0, (imgWidth - window.innerWidth) / 2);
          const maxY = Math.max(0, (imgHeight - window.innerHeight) / 2);
          newX = Math.max(-maxX, Math.min(maxX, newX));
          newY = Math.max(-maxY, Math.min(maxY, newY));
        } else {
          newX = 0;
          newY = 0;
        }
        
        setZoom(newZoom);
        setPosition({ x: newX, y: newY });
      }
    };

    containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
    const container = containerRef.current;
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [lightboxOpen, zoom, position]);

  // Touch pinch zoom
  useEffect(() => {
    if (!lightboxOpen || !imageRef.current) return;

    let initialDistance = 0;
    let initialZoom = 1;

    const getDistance = (touch1: Touch, touch2: Touch) => {
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialZoom = zoom;
      } else if (e.touches.length === 1 && zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(1, Math.min(5, initialZoom * scale));
        setZoom(newZoom);
      } else if (e.touches.length === 1 && isDragging && imageRef.current) {
        e.preventDefault();
        const rect = imageRef.current.getBoundingClientRect();
        const imgWidth = rect.width * zoom;
        const imgHeight = rect.height * zoom;
        const maxX = (imgWidth - window.innerWidth) / 2;
        const maxY = (imgHeight - window.innerHeight) / 2;
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, e.touches[0].clientX - dragStart.x)),
          y: Math.max(-maxY, Math.min(maxY, e.touches[0].clientY - dragStart.y))
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    const img = imageRef.current;
    img.addEventListener('touchstart', handleTouchStart);
    img.addEventListener('touchmove', handleTouchMove, { passive: false });
    img.addEventListener('touchend', handleTouchEnd);

    return () => {
      img.removeEventListener('touchstart', handleTouchStart);
      img.removeEventListener('touchmove', handleTouchMove);
      img.removeEventListener('touchend', handleTouchEnd);
    };
  }, [lightboxOpen, zoom, position, isDragging, dragStart]);

  // Mouse drag for panning when zoomed
  useEffect(() => {
    if (!lightboxOpen || zoom <= 1 || !imageRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && (e.target === imageRef.current || imageRef.current?.contains(e.target as Node))) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const imgWidth = rect.width * zoom;
        const imgHeight = rect.height * zoom;
        const maxX = (imgWidth - window.innerWidth) / 2;
        const maxY = (imgHeight - window.innerHeight) / 2;
        
        setPosition({
          x: Math.max(-maxX, Math.min(maxX, e.clientX - dragStart.x)),
          y: Math.max(-maxY, Math.min(maxY, e.clientY - dragStart.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const img = imageRef.current;
    img.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      img.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [lightboxOpen, zoom, position, isDragging, dragStart]);

  // Filter by active type and remove duplicates (by URL) while preserving order
  const filtered = (() => {
    const arr = extra.filter((i) => active === "all" || i.type === active).map((i) => i.imageUrl);
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const src of arr) {
      if (!seen.has(src)) { seen.add(src); uniq.push(src); }
    }
    return uniq;
  })();

  return (
    <>
      <Header />
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
              {/* Pattern: 8 images (4x2) then 1 full-width image, repeat */}
              {(() => {
                const sections: React.ReactElement[] = [];
                for (let i = 0; i < filtered.length; i += 9) {
                  const gridChunk = filtered.slice(i, i + 8);
                  const hero = filtered[i + 8];
                  if (gridChunk.length) {
                    sections.push(
                      <div key={`grid-${i}`} className="mb-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                          {gridChunk.map((src, idx) => (
                            <button onClick={()=>{setLightboxSrc(src); setLightboxOpen(true); setZoom(1); setPosition({x:0, y:0});}} key={`${src}-${i+idx}`} className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group gallery-image-card text-left rounded">
                              <Image src={src} alt="Gallery" fill className="object-cover transition-transform duration-300 ease-out" />
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
                  if (hero) {
                    sections.push(
                      <div key={`hero-${i}`} className="mb-8 gallery-full-image">
                        <button onClick={()=>{setLightboxSrc(hero); setLightboxOpen(true); setZoom(1); setPosition({x:0, y:0});}} className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group text-left rounded">
                          <Image src={hero} alt="Gallery Feature" fill className="object-cover transition-transform duration-300 ease-out" />
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
              })()}

              {/* No extra static rows; only data-driven grid above */}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {lightboxOpen && (
        <div 
          ref={containerRef}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing overflow-hidden" 
          onClick={()=>{if(zoom === 1) {setLightboxOpen(false); setZoom(1); setPosition({x:0, y:0});}}}
          style={{ userSelect: 'none' }}
        >
          {/* Close Button - Top Right Corner */}
          <button 
            onClick={(e)=>{
              e.stopPropagation(); 
              setLightboxOpen(false);
              setZoom(1);
              setPosition({x:0, y:0});
            }} 
            className="absolute top-4 right-4 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-[#242424] hover:text-red-600 shadow-xl transition-all duration-200 group"
            title="Close"
            aria-label="Close image"
          >
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Zoom Controls - Top Left */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
            <button 
              onClick={(e)=>{
                e.stopPropagation(); 
                const newZoom = Math.min(5, zoom + 0.25);
                if (newZoom !== zoom) {
                  setZoom(newZoom);
                  // Recalculate position boundaries when zooming in
                  if (newZoom > 1 && imageRef.current) {
                    setTimeout(() => {
                      if (imageRef.current) {
                        const imgRect = imageRef.current.getBoundingClientRect();
                        const imgWidth = imgRect.width * newZoom;
                        const imgHeight = imgRect.height * newZoom;
                        const maxX = Math.max(0, (imgWidth - window.innerWidth) / 2);
                        const maxY = Math.max(0, (imgHeight - window.innerHeight) / 2);
                        setPosition({
                          x: Math.max(-maxX, Math.min(maxX, position.x)),
                          y: Math.max(-maxY, Math.min(maxY, position.y))
                        });
                      }
                    }, 0);
                  }
                }
              }} 
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-white/90 hover:bg-white text-[#242424] text-xl md:text-2xl font-semibold shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
              title="Zoom In"
              aria-label="Zoom in"
            >
              +
            </button>
            <button 
              onClick={(e)=>{
                e.stopPropagation(); 
                const newZoom = Math.max(1, zoom - 0.25);
                if (newZoom !== zoom) {
                  setZoom(newZoom);
                  if (newZoom === 1) {
                    setPosition({ x: 0, y: 0 });
                  } else {
                    // Adjust position proportionally when zooming out
                    const scaleChange = newZoom / zoom;
                    setPosition({
                      x: position.x * scaleChange,
                      y: position.y * scaleChange
                    });
                  }
                }
              }} 
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-white/90 hover:bg-white text-[#242424] text-xl md:text-2xl font-semibold shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              −
            </button>
            <button 
              onClick={(e)=>{
                e.stopPropagation(); 
                setZoom(1); 
                setPosition({ x: 0, y: 0 });
              }} 
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg bg-white/90 hover:bg-white text-[#242424] text-xs md:text-sm font-semibold shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
              title="Reset Zoom"
              aria-label="Reset zoom"
            >
              ↻
            </button>
          </div>

          {/* Image Container */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              ref={imageRef}
              src={lightboxSrc} 
              alt="Gallery image" 
              style={{ 
                transform: `scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                maxWidth: '95vw', 
                maxHeight: '95vh',
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                touchAction: 'none'
              }} 
              className="object-contain select-none" 
              onClick={(e)=>{
                e.stopPropagation();
                if(zoom === 1) {
                  setLightboxOpen(false);
                  setZoom(1);
                  setPosition({x:0, y:0});
                }
              }}
              draggable={false}
            />
          </div>

          {/* Zoom Indicator */}
          {zoom > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-20 backdrop-blur-sm">
              Zoom: {Math.round(zoom * 100)}% • Drag to pan • Scroll to zoom
            </div>
          )}
        </div>
      )}
    </>
  );
}
