import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OffersCarousel from "@/components/home/OffersCarousel";
import TransfersSection from "@/components/shared/TransfersSection";

export default function OffersPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        <section className="relative w-full h-[520px] md:h-[800px] lg:h-[951px] overflow-hidden">
          <Image
            src="/offers/hero.png"
            alt="Offers Hero Background"
            fill
            priority
            className="object-cover"
          />
        
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 md:pb-24 px-4">
            <div className="text-center max-w-[680px] px-2">
              <h1 className="text-[#FFFFFF] text-2xl md:text-4xl lg:text-[48px] font-semibold leading-[1.15] md:leading-[1.2] tracking-[0.02em] mb-3 md:mb-6 drop-shadow-[0px_4px_26.4px_rgba(0,0,0,0.69)]">
                Exclusive Offers & Packages
              </h1>
              <p className="text-[#FFFFFF] text-sm md:text-[22px] font-semibold leading-[1.4] tracking-[0.02em] drop-shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
                Special deals available only when booking directly through our official website
              </p>
            </div>
          </div>
        </section>

        <section className="relative min-h-[631px] overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              background: 'linear-gradient(180deg, #616C26 0%, #C8CCB3 31%, #F1F2EE 49%, #FFFFFF 62%, #FFFFFF 71%, #FFFFFF 100%)',
              opacity: 1
            }}
          ></div>
          
          <div className="relative z-10 max-w-[1268px] mx-auto px-4 md:px-6 py-16">
            <div className="flex flex-col gap-[40px]">
              <div className="flex flex-col md:flex-row items-center gap-[92px]">
                <div className="relative w-full md:w-[605px] h-[398px] rounded-[15px] overflow-hidden flex-shrink-0">
                  <Image
                    src="/offers/advance-escape-bg.png"
                    alt="Advance Escape Offer"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-[571px] flex flex-col justify-between">
                  <div className="space-y-[31px]">
                    <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Advance Escape Offer
                    </h3>
                    <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                      <p>Save 10% when you confirm your stay at least 5 months in advance.</p>
                      <p>Plan early, pay less, and look forward to your tropical dream.</p>
                      <p className="text-[#FF6A00]">Not valid during July, August & festive season.</p>
                    </div>
                  </div>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[5px] text-[16px] font-medium w-[163px] h-[41px] flex items-center justify-center font-quicksand mt-6 hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse items-center gap-[92px]">
                <div className="relative w-full md:w-[605px] h-[398px] rounded-[15px] overflow-hidden flex-shrink-0">
                  <Image
                    src="/offers/stay-more-bg.png"
                    alt="Stay More, Spend Less"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-[571px] flex flex-col justify-between">
                  <div className="space-y-[31px]">
                    <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Stay More, Spend Less
                    </h3>
                    <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                      <p>Stay 5 nights and pay for only 4!</p>
                      <p>Enjoy an extra night of ocean breeze, relaxation, and island luxury — on us.</p>
                      <p className="text-[#FF6A00]">Blackout dates: July, August & festive period.</p>
                    </div>
                  </div>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[5px] text-[16px] font-medium w-[163px] h-[41px] flex items-center justify-center font-quicksand mt-6 hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-[92px]">
                <div className="relative w-full md:w-[605px] h-[398px] rounded-[15px] overflow-hidden flex-shrink-0">
                  <Image
                    src="/offers/family-getaway-bg.png"
                    alt="Family Getaway Treat"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-[571px] flex flex-col justify-between">
                  <div className="space-y-[31px]">
                    <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Family Getaway Treat
                    </h3>
                    <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                      <p>Children under 12 years stay free when sharing with parents in Garden View Villas (up to 2 kids).</p>
                      <p>Perfect opportunity to make family memories that last forever.</p>
                      <p className="text-[#FF6A00]">Not valid during July, August & festive period.</p>
                    </div>
                  </div>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[5px] text-[16px] font-medium w-[163px] h-[41px] flex items-center justify-center font-quicksand mt-6 hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse items-center gap-[92px]">
                <div className="relative w-full md:w-[605px] h-[398px] rounded-[15px] overflow-hidden flex-shrink-0">
                  <Image
                    src="/offers/seventh-night-bg.png"
                    alt="Seventh Night on Us"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-[571px] flex flex-col justify-between">
                  <div className="space-y-[31px]">
                    <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Seventh Night on Us
                    </h3>
                    <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                      <p>Celebrate your love with our Honeymoon Indulgence Offer 💍</p>
                      <p>Stay 5 nights or more and enjoy:</p>
                      <p>• Complimentary 30-minute couple&apos;s massage</p>
                      <p>• Welcome bottle of wine & sunset cocktail for two</p>
                      <p>• 10% off scuba diving experiences</p>
                      <p>Valid within one year of your wedding (proof required).</p>
                      <p className="text-[#FF6A00]">Not valid during July, August & festive season.</p>
                    </div>
                   
                  </div>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[5px] text-[16px] font-medium w-[163px] h-[41px] flex items-center justify-center font-quicksand mt-6 hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-[92px]">
                <div className="relative w-full md:w-[605px] h-[398px] rounded-[15px] overflow-hidden flex-shrink-0">
                  <Image
                    src="/offers/family-getaway-bg.png"
                    alt="Romance by the Ocean"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-[571px] flex flex-col justify-between">
                  <div className="space-y-[31px]">
                    <h3 className="text-[#16130E] text-[26px] font-semibold leading-[1.25] font-quicksand">
                      Romance by the Ocean
                    </h3>
                    <div className="text-[#2C271E] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-quicksand space-y-3">
                      <p>Stay 7 nights, pay for only 5 — and receive:</p>
                      <p>• A bottle of sparkling wine upon arrival</p>
                      <p>• Sunset drinks at our beach bar</p>
                      <p>• 10% off all water activities</p>
                      <p className="text-[#FF6A00]">Offer not valid during July, August & festive period.</p>
                    </div>
                  </div>
                  <Link href="/contact-us" className="bg-[#FF6A00] text-white px-[10px] py-[10px] rounded-[5px] text-[16px] font-medium w-[163px] h-[41px] flex items-center justify-center font-quicksand mt-6 hover:opacity-90 transition-opacity">
                    Booking Enquiry
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <OffersCarousel />

        <TransfersSection />
      </main>
      <Footer />
    </>
  );
}