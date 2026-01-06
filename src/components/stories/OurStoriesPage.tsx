'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { GrLinkNext } from "react-icons/gr";
import { GrLinkPrevious } from "react-icons/gr";
import { getStoryImages, StoryImage } from '@/lib/firestoreService';
import AboutZanzibar from '@/components/home/about_zanzibar';
import '@/styles/animations/ourStories.css';

export default function OurStoriesPage() {
  const [stories, setStories] = useState<StoryImage[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const testimonialCardRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const [sectionVisible, setSectionVisible] = useState<{ [key: string]: boolean }>({});
  const v1Ref = useRef<HTMLVideoElement | null>(null);
  const v2Ref = useRef<HTMLVideoElement | null>(null);
  const v3Ref = useRef<HTMLVideoElement | null>(null);
  const [v1Playing, setV1Playing] = useState(false);
  const [v2Playing, setV2Playing] = useState(false);
  const [v3Playing, setV3Playing] = useState(false);
  const v2ContainerRef = useRef<HTMLDivElement | null>(null);
  const [, setV2Height] = useState<number | null>(null);
  const v4Ref = useRef<HTMLVideoElement | null>(null);
  const [v4Playing, setV4Playing] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    (async () => {
      const data = await getStoryImages();
      setStories(data);
    })();

    const testimonialObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('media-visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    if (testimonialCardRef.current) {
      testimonialObserver.observe(testimonialCardRef.current);
    }

    const videoElements = document.querySelectorAll('.media-item');
    videoElements.forEach((el) => videoObserver.observe(el));

    const testimonialCard = testimonialCardRef.current;
    return () => {
      if (testimonialCard) {
        testimonialObserver.unobserve(testimonialCard);
      }
      videoElements.forEach((el) => videoObserver.unobserve(el));
    };
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const observedElements = new Set<HTMLElement>();

    const setupObservers = () => {
      const sectionKeys = ['testimonials-section', 'media-section'];

      sectionKeys.forEach((key) => {
        const element = sectionRefs.current[key];
        if (element && !observedElements.has(element)) {
          observedElements.add(element);

          const rect = element.getBoundingClientRect();
          const isVisibleNow = rect.top < window.innerHeight && rect.bottom > 0;

          if (isVisibleNow) {
            setTimeout(() => {
              setSectionVisible((prev) => ({ ...prev, [key]: true }));
              element.classList.add(`stories-${key}-visible`);
            }, 100);
          } else {
            const observer = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting) {
                    setSectionVisible((prev) => ({ ...prev, [key]: true }));
                    entry.target.classList.add(`stories-${key}-visible`);
                    observer.unobserve(entry.target);
                  }
                });
              },
              { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
            );
            observer.observe(element);
            observers.push(observer);
          }
        }
      });
    };

    setupObservers();
    const timeoutId = setTimeout(setupObservers, 200);
    const timeoutId2 = setTimeout(setupObservers, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  useEffect(() => {
    const video = v2Ref.current;
    const container = v2ContainerRef.current;
    if (!container) return;

    const computeHeight = () => {
      if (!video) return;
      const cw = container.clientWidth;
      const vw = video.videoWidth || 16;
      const vh = video.videoHeight || 9;
      const aspect = vw / vh;
      const ch = Math.round(cw / aspect);
      setV2Height(ch);
    };

    const handleLoaded = () => computeHeight();
    video?.addEventListener('loadedmetadata', handleLoaded);

    const ro = new ResizeObserver(() => computeHeight());
    ro.observe(container);

    return () => {
      video?.removeEventListener('loadedmetadata', handleLoaded);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleEndV1 = () => setV1Playing(false);
    const handleEndV2 = () => setV2Playing(false);
    const handleEndV3 = () => setV3Playing(false);
    const handleEndV4 = () => setV4Playing(false);

    const v1 = v1Ref.current; const v2 = v2Ref.current; const v3 = v3Ref.current; const v4 = v4Ref.current;
    v1?.addEventListener('ended', handleEndV1);
    v2?.addEventListener('ended', handleEndV2);
    v3?.addEventListener('ended', handleEndV3);
    v4?.addEventListener('ended', handleEndV4);

    return () => {
      v1?.removeEventListener('ended', handleEndV1);
      v2?.removeEventListener('ended', handleEndV2);
      v3?.removeEventListener('ended', handleEndV3);
      v4?.removeEventListener('ended', handleEndV4);
    };
  }, []);

  const totalPages = Math.max(stories.length, 1);
  const defaultText = `From the moment I arrived at Sultan Palace Hotel, I felt the world slow down. The ocean breeze, gentle smiles, and golden light made everything feel calm and effortless. My villa opened to the turquoise sea — every morning began with the sound of waves and the scent of salt in the air.

Days flowed beautifully — snorkeling in clear waters, relaxing at the spa, and dining under starlit skies. Every detail felt personal, every moment peaceful. Sultan Palace wasn't just a hotel; it was where I found my calm again — a place I'll always carry in my heart.`;

  const fallbackImages: StoryImage[] = [
    { id: 'f1', imageUrl: '/story/story1.png', alt: 'Story image', title: 'Where I Found My Calm Again', text: defaultText, author: '', location: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'f2', imageUrl: '/story/story2.png', alt: 'Story image', title: 'Where I Found My Calm Again', text: defaultText, author: '', location: '', createdAt: new Date(), updatedAt: new Date() },
    { id: 'f3', imageUrl: '/story/story3.png', alt: 'Story image', title: 'Where I Found My Calm Again', text: defaultText, author: '', location: '', createdAt: new Date(), updatedAt: new Date() },
  ];

  let effectiveStories: StoryImage[] = stories;
  if (effectiveStories.length === 0) {
    effectiveStories = fallbackImages;
  } else if (effectiveStories.length < 3) {
    const pad = fallbackImages.filter(f => !effectiveStories.some(s => s.imageUrl === f.imageUrl));
    effectiveStories = [...effectiveStories, ...pad].slice(0, Math.max(3, effectiveStories.length));
  }

  const testimonialIndex = currentTestimonial % effectiveStories.length;

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % totalPages);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const renderPagination = () => {
    const visiblePages = [0, 1, 2, 3, 4];

    return (
      <div className="flex items-center space-x-1 md:space-x-2 text-[16px] md:text-[20px] font-normal leading-[1.35] tracking-[0.05em] md:tracking-[0.1em] h-full font-playpen-sans flex-shrink-0">
        {visiblePages.map((index) => (
          <button
            key={index}
            onClick={() => setCurrentTestimonial(index)}
            className={`px-1 ${currentTestimonial === index ? 'text-[#000000] font-bold' : 'text-[#000000] font-normal'
              }`}
          >
            {index + 1}
          </button>
        ))}

        <span className="text-[#000000] px-1">...</span>

        <button
          onClick={() => setCurrentTestimonial(totalPages - 1)}
          className={`px-1 ${currentTestimonial === totalPages - 1 ? 'text-[#000000] font-bold' : 'text-[#000000] font-normal'
            }`}
        >
          {totalPages}
        </button>
      </div>
    );
  };


  return (
    <div className="w-full bg-white overflow-x-hidden">
      <div className="relative h-[600px] md:h-[928px] w-full overflow-hidden">
        <Image
          src="/our-story/hero.png"
          alt="Hero Background"
          fill
          priority
          loading="eager"
          fetchPriority="high"
          quality={90}
          sizes="100vw"
          className="object-cover"
          style={{ opacity: 1 }}
        />

        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0) 71%, rgba(255, 255, 255, 0.67) 85%, rgba(255, 255, 255, 1) 98%)"
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(0deg, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 1) 100%)"
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-end px-4 sm:px-6 md:px-8 w-full ">
          <h1
            className="relative z-10 text-[#FFFFFF] text-[32px] sm:text-[42px] md:text-[56px] lg:text-[72px] xl:text-[96px] font-moon-dance leading-[1.2] tracking-[0.05em] text-center w-full max-w-full px-2"
            style={{
              textShadow: '0px 2px 8px rgba(0, 0, 0, 0.9), 0px 4px 10px rgba(0, 0, 0, 0.7), 0px 8px 20px rgba(0, 0, 0, 0.5), 0px 0px 30px rgba(0, 0, 0, 0.3)',
              WebkitTextStroke: '2px rgba(0, 0, 0, 0.5)',
              filter: 'drop-shadow(0 0 3px rgba(0, 0, 0, 0.8))'
            }}
          >
            <span className="flex flex-wrap justify-center gap-x-1 sm:gap-x-2 gap-y-1 w-full">
              {"Voices from Our Guests".split(" ").map((word, index) => (
                <span
                  key={index}
                  className={`inline-block hero-word ${isVisible ? "hero-word-visible" : ""
                    }`}
                  style={{
                    animationDelay: `${index * 0.15}s`,
                  }}
                >
                  <span className="relative inline-block px-1 text-animate">
                    {word.split("").map((char, charIndex) => (
                      <span
                        key={charIndex}
                        className="inline-block char-animate"
                        style={{
                          animationDelay: `${index * 0.15 + charIndex * 0.05}s`,
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          </h1>
        </div>
      </div>

      <div ref={(el) => { if (el) sectionRefs.current['testimonials-section'] = el; }} className={`bg-white py-12 md:py-16 lg:py-20 w-full overflow-x-hidden stories-testimonials-section ${sectionVisible['testimonials-section'] ? 'stories-testimonials-section-visible' : ''}`}>
        <div className="mx-auto px-4 md:px-4 lg:px-6 w-full max-w-full" style={{ maxWidth: '1500px' }}>
          <div
            ref={testimonialCardRef}
            className="bg-white rounded-lg w-full p-8 md:p-12 lg:p-16 stories-testimonial-card"
            style={{
              boxShadow: '0px 4px 42.5px rgba(121, 201, 233, 0.21)'
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

              <div className="flex flex-col justify-center order-2 lg:order-1 group stories-testimonial-content">
                <div className="space-y-[64px] mb-[52px]">
                  <h3 className="text-[#000000] text-[28px] md:text-[30px] lg:text-[32px] font-moon-dance leading-[0.84375] tracking-[0.1em] transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#FF6A00] stories-testimonial-title">
                    {effectiveStories[testimonialIndex]?.title || 'Where I Found My Calm Again'}
                  </h3>

                  <div className="space-y-[32px] stories-testimonial-text">
                    <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] leading-[1.35] font-moon-dance tracking-[0.05em] whitespace-pre-line transition-all duration-300 group-hover:translate-x-1">
                      {effectiveStories[testimonialIndex]?.text || defaultText}
                    </p>
                  </div>
                </div>

                <p className="text-[#000000] text-[18px] md:text-[19px] lg:text-[20px] font-moon-dance leading-[1.35] tracking-[0.1em] mb-8 lg:mb-0 transition-all duration-300 group-hover:translate-x-2 group-hover:text-[#BE8C53] stories-testimonial-author">
                  {[effectiveStories[testimonialIndex]?.author, effectiveStories[testimonialIndex]?.location].filter(Boolean).join(', ')}
                </p>

                <div className="flex items-center gap-4 md:gap-[97px] justify-start mt-8 w-full overflow-x-auto pb-2 stories-testimonial-pagination">
                  <button
                    onClick={prevTestimonial}
                    className="w-[38px] h-[37px] rounded-[43px] bg-[#FF6A00] text-white hover:opacity-90 hover:scale-110 transition-all duration-300 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg"
                    aria-label="Previous testimonial"
                  >
                    <GrLinkPrevious className="w-4 h-4 transition-transform duration-300 hover:-translate-x-1" />
                  </button>

                  <div className="flex items-center h-[37px] flex-shrink-0">
                    {renderPagination()}
                  </div>

                  <button
                    onClick={nextTestimonial}
                    className="w-[38px] h-[37px] rounded-[43px] bg-[#FF6A00] text-white hover:opacity-90 hover:scale-110 transition-all duration-300 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg"
                    aria-label="Next testimonial"
                  >
                    <GrLinkNext className="w-4 h-4 transition-transform duration-300 hover:translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="relative h-[400px] md:h-[550px] lg:h-[698px] w-full order-1 lg:order-2 group/image overflow-hidden rounded stories-testimonial-image">
                <Image
                  src={effectiveStories[testimonialIndex]?.imageUrl || '/our-story/story1.png'}
                  alt={effectiveStories[testimonialIndex]?.alt || 'Hotel guest and staff'}
                  fill
                  quality={85}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover rounded transition-transform duration-700 ease-out group-hover/image:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={(el) => { if (el) sectionRefs.current['media-section'] = el; }} className={`relative w-full overflow-x-hidden stories-media-section ${sectionVisible['media-section'] ? 'stories-media-section-visible' : ''}`}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/our-story/marissa.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <div className="relative z-10 pt-16 md:pt-20 pb-8 md:pb-12 w-full">
          <div className="mx-auto px-4 md:px-4 lg:px-6 w-full max-w-full" style={{ maxWidth: '1500px' }}>
            <div className="flex flex-col md:flex-row gap-4 md:gap-4 items-start justify-center w-full">

              <div className="w-full md:w-1/2 flex flex-col">
                <div
                  className="media-item relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[700px] xl:h-[965px] w-full flex-shrink-0 group cursor-pointer overflow-hidden rounded stories-media-left bg-black"
                >
                  <video
                    ref={v1Ref}
                    src="/story/v1.mp4"
                    className="absolute inset-0 w-full h-full object-cover rounded"
                    muted
                    playsInline
                    controls={false}
                  />
                  <button
                    aria-label={v1Playing ? 'Pause video' : 'Play video'}
                    onClick={() => {
                      const v = v1Ref.current;
                      if (!v) return;
                      if (v1Playing) { v.pause(); setV1Playing(false); } else { v.play(); setV1Playing(true); }
                    }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                      {v1Playing ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="5" width="4" height="14" fill="#242424" />
                          <rect x="14" y="5" width="4" height="14" fill="#242424" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5v14l11-7L8 5z" fill="#242424" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                </div>

                <div
                  className="media-item relative mt-4 h-[280px] sm:h-[320px] md:h-[360px] lg:h-[420px] w-full flex-shrink-0 group cursor-pointer overflow-hidden rounded"
                >
                  <video
                    ref={v3Ref}
                    src="/story/v3.mp4"
                    className="absolute inset-0 w-full h-full object-contain"
                    muted
                    playsInline
                    controls={false}
                  />
                  <button
                    aria-label={v3Playing ? 'Pause video' : 'Play video'}
                    onClick={() => {
                      const v = v3Ref.current;
                      if (!v) return;
                      if (v3Playing) { v.pause(); setV3Playing(false); } else { v.play(); setV3Playing(true); }
                    }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                      {v3Playing ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="5" width="4" height="14" fill="#242424" />
                          <rect x="14" y="5" width="4" height="14" fill="#242424" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5v14l11-7L8 5z" fill="#242424" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <div
                  className="media-item relative w-full  h-[300px] sm:h-[400px] md:h-[500px] lg:h-[700px] xl:h-[965px] group cursor-pointer overflow-hidden rounded stories-media-item-1"
                >
                  <video
                    ref={v2Ref}
                    src="/story/v2.mp4"
                    className="absolute inset-0 w-full h-full object-contain"
                    muted
                    playsInline
                    controls={false}
                  />
                  <button
                    aria-label={v2Playing ? 'Pause video' : 'Play video'}
                    onClick={() => {
                      const v = v2Ref.current;
                      if (!v) return;
                      if (v2Playing) { v.pause(); setV2Playing(false); } else { v.play(); setV2Playing(true); }
                    }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                      {v2Playing ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="5" width="4" height="14" fill="#242424" />
                          <rect x="14" y="5" width="4" height="14" fill="#242424" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5v14l11-7L8 5z" fill="#242424" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>

                <div className="media-item relative mt-4 w-full h-[260px] sm:h-[340px] md:h-[420px] lg:h-[500px] xl:h-[560px] group cursor-pointer overflow-hidden rounded">
                  <video
                    ref={v4Ref}
                    src="/story/v4.mp4"
                    className="absolute inset-0 w-full h-full object-contain"
                    muted
                    playsInline
                    controls={false}
                  />
                  <button
                    aria-label={v4Playing ? 'Pause video' : 'Play video'}
                    onClick={() => {
                      const v = v4Ref.current;
                      if (!v) return;
                      if (v4Playing) { v.pause(); setV4Playing(false); } else { v.play(); setV4Playing(true); }
                    }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                  >
                    <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] rounded-full bg-white/90 flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                      {v4Playing ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="5" width="4" height="14" fill="#242424" />
                          <rect x="14" y="5" width="4" height="14" fill="#242424" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 5v14l11-7L8 5z" fill="#242424" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative z-20 -mt-12 md:-mt-6 lg:mt-0"
        style={{
          marginTop: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          position: 'relative',
          zIndex: 20,
        }}
      >
        <AboutZanzibar compact />
      </div>
    </div>
  );
}