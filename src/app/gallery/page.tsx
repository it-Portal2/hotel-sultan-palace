import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function GalleryPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        {/* Hero Section */}
        <section className="relative w-full h-[680px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/gallery/hero-main-6ecfac.png"
            alt="Gallery Hero Background"
            fill
            priority
            className="object-cover"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-90 px-4">
            <div className="text-center max-w-[680px]">
              <h1 className="text-[#FFFFFF] text-3xl md:text-4xl lg:text-[48px] font-semibold leading-[0.56] tracking-[0.05em] mb-10 drop-shadow-[0px_4px_26.4px_rgba(0,0,0,0.69)]">
                Gallery
              </h1>
              <p className="text-[#FFFFFF] text-lg md:text-[22px] font-semibold leading-[1.35] tracking-[0.05em] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
                Discover the beauty and elegance of Sultan Palace Hotel through our stunning collection of images
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="py-8 bg-[#FFFCF6]">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5">
              <button className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg text-lg font-semibold font-quicksand">
                All
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                Villas
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                Pool
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                Spa
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                Beach
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                Water Sports
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                Restaurant & Bars
              </button>
              <button className="px-4 py-2 border border-[#655D4E] text-[#655D4E] rounded-lg text-lg font-semibold font-quicksand hover:bg-[#655D4E] hover:text-white transition-colors">
                FACILITIES
              </button>
            </div>
          </div>
        </section>

        {/* Gallery  Section */}
        <section className="py-10 md:py-16 bg-[#FFFCF6] relative">
          {/* Background Image - covers half of gallery section */}
          <div className="absolute top-1/2 left-0 right-0 bottom-0 z-0">
            <Image
              src="/gallery/bg.png"
              alt="Gallery Background"
              fill
              className="object-cover"
            />
            </div>
          {/* Content */}
          <div className="relative z-10">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
          
            <div className="mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
             
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-1.png"
                  alt="Hotel Exterior View"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-2.png"
                  alt="Luxury Suite Interior"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-3.png"
                  alt="Ocean View Room"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-4.png"
                  alt="Spa Treatment Room"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-5.png"
                  alt="Restaurant Dining Area"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-6.png"
                  alt="Pool Area"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-7.png"
                  alt="Beach View"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-1.png"
                    alt="Hotel Exterior View"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

           
            <div className="mb-8">
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-full-1.png"
                  alt="Full Width Image"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              </div>

            <div className="mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-2.png"
                    alt="Luxury Suite Interior"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-3.png"
                    alt="Ocean View Room"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-4.png"
                    alt="Spa Treatment Room"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-5.png"
                    alt="Restaurant Dining Area"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-6.png"
                    alt="Pool Area"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-7.png"
                    alt="Beach View"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-1.png"
                    alt="Hotel Exterior View"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                    src="/gallery/gallery-2.png"
                    alt="Luxury Suite Interior"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

            <div className="mb-8">
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-full-2.png"
                  alt="Full Width Image"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-3.png"
                    alt="Ocean View Room"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-4.png"
                    alt="Spa Treatment Room"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-5.png"
                    alt="Restaurant Dining Area"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-6.png"
                    alt="Pool Area"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                  <Image
                    src="/gallery/gallery-7.png"
                    alt="Beach View"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                    src="/gallery/gallery-1.png"
                    alt="Hotel Exterior View"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                    src="/gallery/gallery-2.png"
                    alt="Luxury Suite Interior"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
                <div className="relative w-full h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden group">
                <Image
                    src="/gallery/gallery-3.png"
                    alt="Ocean View Room"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                </div>
              </div>
              </div>

            <div className="mb-8">
              <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden group">
                <Image
                  src="/gallery/gallery-full-1.png"
                  alt="Final Full Width Image"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
