"use client";
import Image from "next/image";

export default function StoryInPictures() {
  const images = [
    { src: "/story/story1.png", alt: "Wedding couple at the balcony" },
    { src: "/story/story2.png", alt: "Couple sitting on the beach" },
    { src: "/story/story3.png", alt: "Child at the pool stairs" },
  ];

  return (
    <section className="w-full bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
        <h2 className="font-kaisei text-center font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-[#202C3B]">
          The Story in Pictures
        </h2>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {images.map((image, index) => (
            <figure key={image.src} className="group relative w-full h-[320px] md:h-[460px]">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority={index === 0}
              />

              {/* Between-image arrows shown on the middle image (md+) */}
              {index === 1 && (
                <>
                  <button
                    aria-label="Previous"
                    className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded bg-white text-[#be8c53]"
                  >
                    <span className="text-3xl">←</span>
                  </button>
                  <button
                    aria-label="Next"
                    className="hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded bg-white text-[#be8c53]"
                  >
                    <span className="text-3xl">→</span>
                  </button>
                </>
              )}

              {/* Hover overlay with View → applied to ALL images */}
              <figcaption className="pointer-events-none absolute inset-0 flex items-end overflow-hidden">
                <div className="w-full translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                  {/* taller gradient so it feels like emerging from within the image */}
                  <div className="relative h-40 w-full">
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                      <span className="font-kaisei font-bold text-white text-lg md:text-xl">View →</span>
                    </div>
                  </div>
                </div>
              </figcaption>

              {/* subtle border to match figma spacing */}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-black/5" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}


