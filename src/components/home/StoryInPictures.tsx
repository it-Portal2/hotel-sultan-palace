"use client";
import Image from "next/image";
import { useEffect, useMemo, useState, useRef } from "react";
import { getStoryImages } from "@/lib/firestoreService";

export default function StoryInPictures() {
  const staticImages = [
    { src: "/story/story1.png", alt: "Wedding couple at the balcony" },
    { src: "/story/story2.png", alt: "Couple sitting on the beach" },
    { src: "/story/story3.png", alt: "Child at the pool stairs" },
  ];

  const [extra, setExtra] = useState<{src:string; alt:string}[]>([]);
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      setExtra(items.map(i => ({ src: i.imageUrl, alt: i.alt || "Story image" })));
    })();
  }, []);

  const allImages = useMemo(() => [...staticImages, ...extra], [extra]);
  const visible = useMemo(() => {
    if (allImages.length <= 3) return allImages;
    const arr: {src:string; alt:string}[] = [];
    for (let i = 0; i < 3; i++) {
      arr.push(allImages[(index + i) % allImages.length]);
    }
    return arr;
  }, [allImages, index]);

  return (
    <section ref={sectionRef} className="w-full bg-white py-12 md:py-16 lg:py-24 story-section">
      <div className="mx-auto w-full max-w-[1512px] px-2 md:px-4">
        <h2 className={`font-kaisei text-center font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-[#202C3B] mb-8 md:mb-10 story-heading ${isVisible ? 'story-heading-visible' : ''}`}>
          The Story in Pictures
        </h2>

        <div className="relative flex items-center justify-center gap-4 md:gap-[26px] overflow-x-auto scrollbar-hide pb-4">
          {visible.map((image, i) => (
            <figure key={image.src} className={`group relative w-full md:w-[459px] h-[320px] md:h-[576px] flex-shrink-0 story-image ${isVisible ? 'story-image-visible' : ''}`} style={{ transitionDelay: `${i * 0.2}s` }}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 459px"
                priority={i === 0}
              />

              {/* Navigation arrows on middle image */}
              {i === 1 && allImages.length > 3 && (
                <>
                  <button
                    aria-label="Previous"
                    className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded bg-white text-[#be8c53]"
                    onClick={() => setIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                  >
                    <span className="text-3xl">←</span>
                  </button>
                  <button
                    aria-label="Next"
                    className="hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded bg-white text-[#be8c53]"
                    onClick={() => setIndex((prev) => (prev + 1) % allImages.length)}
                  >
                    <span className="text-3xl">→</span>
                  </button>
                </>
              )}

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
            </figure>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .story-section {
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s ease-out;
        }
        .story-section.story-visible,
        .story-visible .story-section {
          opacity: 1;
          transform: translateY(0);
        }
        .story-heading {
          opacity: 0;
          transform: translateY(-30px);
          transition: all 1s ease-out 0.2s;
        }
        .story-heading-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .story-image {
          opacity: 0;
          transform: translateY(80px) scale(0.9) rotateX(15deg);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .story-image-visible {
          opacity: 1;
          transform: translateY(0) scale(1) rotateX(0deg);
        }
      `}</style>
    </section>
  );
}


