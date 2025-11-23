"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { getStoryImages } from "@/lib/firestoreService";

export default function StoryInPictures() {
  const staticImages = useMemo(() => [
    { src: "/story/story1.png", alt: "Wedding couple at the balcony" },
    { src: "/story/story2.png", alt: "Couple sitting on the beach" },
    { src: "/story/story3.png", alt: "Child at the pool stairs" },
  ], []);

  const [extra, setExtra] = useState<{src:string; alt:string}[]>([]);
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (sectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              entry.target.classList.add('story-visible');
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(sectionRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    (async () => {
      const items = await getStoryImages();
      let imgs = items.map(i => ({ src: i.imageUrl, alt: i.alt || "Story image" }));
      if (imgs.length === 0) {
        imgs = staticImages;
      } else if (imgs.length < 3) {
        // Pad with static images to always have at least 3 on desktop
        const pad = staticImages.filter(s => !imgs.some(i => i.src === s.src));
        imgs = [...imgs, ...pad].slice(0, Math.max(3, imgs.length));
      }
      setExtra(imgs);
    })();
  }, [staticImages]);

  // Use computed images (padded to 3 when needed)
  const allImages = useMemo(() => (extra.length > 0 ? extra : staticImages), [extra, staticImages]);
  const visible = useMemo(() => {
    // On mobile, show only 1 image at a time. On desktop, show 3.
    if (isMobile) {
      return [allImages[index % allImages.length]];
    }
    if (allImages.length <= 3) return allImages;
    const arr: {src:string; alt:string}[] = [];
    for (let i = 0; i < 3; i++) {
      arr.push(allImages[(index + i) % allImages.length]);
    }
    return arr;
  }, [allImages, index, isMobile]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && allImages.length > 1) {
      setIndex((prev) => (prev + 1) % allImages.length);
    }
    if (isRightSwipe && allImages.length > 1) {
      setIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  return (
    <section ref={sectionRef} className="w-full bg-white py-12 md:py-16 lg:py-24 story-section overflow-hidden md:overflow-visible">
      <div className="mx-auto w-full max-w-[1512px] px-4 md:px-6 lg:px-8 xl:px-4 2xl:px-4">
        <h2 className={`font-kaisei text-center font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-[#202C3B] mb-8 md:mb-10 story-heading ${isVisible ? 'story-heading-visible' : ''}`}>
          The Story in Pictures
        </h2>

        <div 
          className="relative flex items-center justify-center gap-4 md:gap-6 lg:gap-[26px] overflow-visible"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {allImages.length > 1 && (
            <>
              <button
                aria-label="Previous"
                className="absolute -left-16 md:-left-20 lg:-left-25 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-white text-[#be8c53] shadow-xl hover:bg-[#be8c53] hover:text-white active:bg-[#be8c53] active:text-white transition-all duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                }}
              >
                <span className="text-3xl md:text-4xl lg:text-5xl">←</span>
              </button>
              <button
                aria-label="Next"
                className="absolute -right-16 md:-right-20 lg:-right-25 top-1/2 -translate-y-1/2 z-50 flex h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-full bg-white text-[#be8c53] shadow-xl hover:bg-[#be8c53] hover:text-white active:bg-[#be8c53] active:text-white transition-all duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex((prev) => (prev + 1) % allImages.length);
                }}
              >
                <span className="text-3xl md:text-4xl lg:text-5xl">→</span>
              </button>
            </>
          )}

          {visible.map((image, i) => (
            <Link href="/our-stories" key={`${image.src}-${i}`} className={`group relative w-full md:w-[280px] lg:w-[380px] xl:w-[460px] 2xl:w-[490px] h-[350px] md:h-[400px] lg:h-[480px] xl:h-[540px] 2xl:h-[576px] flex-shrink-0 story-image ${isVisible ? 'story-image-visible' : ''}`} style={{ transitionDelay: `${i * 0.2}s`, overflow: 'visible' }}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-contain md:object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 280px, (max-width: 1280px) 380px, (max-width: 1536px) 460px, 490px"
                priority={i === 0}
              />

              {/* Hover overlay with View → */}
              <figcaption className="pointer-events-none absolute inset-0 flex items-end overflow-hidden">
                <div className="w-full translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                  <div className="relative h-40 w-full">
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                      <span className="font-kaisei font-bold text-white text-lg md:text-xl">View →</span>
                    </div>
                  </div>
                </div>
              </figcaption>

              <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


