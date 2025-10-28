import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function FitnessGymStudioPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFFCF6] font-open-sans">
        {/* Hero */}
        <section className="relative w-full h-[680px] overflow-hidden">
          <Image src="/gym_hero_overlay.png" alt="Gym Hero" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FFFCF6]"></div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-full px-6 md:px-10">
            <div className="mx-auto max-w-[742px] text-center">
              <h1 className="text-[#554019] text-2xl md:text-[24px] font-semibold leading-[27px] mb-3">
                Elevate Your Energy in a World-Class Setting
              </h1>
              <p className="text-[#423B2D] text-[16px] leading-[27px]">
                Stay active during your stay at Sultan Palace Hotel, where our fully equipped fitness center blends
                cutting-edge technology with stunning ocean or garden views. Designed for both beginners and seasoned
                athletes, the gym inspires wellness, energy, and vitality.
              </p>
            </div>
          </div>
        </section>

      
       
        <section className="relative mt-[32px] overflow-hidden pb-[120px]">
          <Image src="/gym_hero_bg.png" alt="Section Background" fill className="object-cover opacity-35" style={{ objectPosition: 'center 20%' }} />
          <div className="absolute inset-0 bg-[#FFFCF6]/70" />

          <div className="relative z-10 px-6 md:px-16">
            {/* Cards row */}
            <div className=" flex flex-nowrap gap-[23px] justify-center overflow-x-auto" id="treatments">
              {[
                { title: "Cardio Zone", desc: "Treadmills, ellipticals, stationary bikes, and rowing machines for a full cardiovascular workout.", image: "/gym_cardio.png" },
                { title: "Strength & Conditioning", desc: "Free weights, resistance machines, and functional training equipment to tone and sculpt every muscle group.", image: "/gym_strength.png" },
                { title: "Personal Training", desc: "Certified trainers available for customized workouts, guidance, and wellness advice.", image: "/gym_personal-56fd99.png" },
                { title: "Yoga & Stretching Area", desc: "A quiet corner for mindful movement, stretching, or guided yoga sessions.", image: "/gym_yoga.png" }
              ].map((item, i) => (
                <div key={i} className="w-[341px] h-[628px] overflow-hidden">
                  <div className="relative w-full h-[380px]">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="px-[19px] py-[13px] flex flex-col items-center gap-[13px]">
                    <h3 className="text-[#2A2824] text-[20px] font-semibold leading-[27px] text-center">{item.title}</h3>
                    <p className="text-[#655D4E] text-[16px] leading-[27px] text-center max-w-[290px]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

           
            <div className=" grid grid-cols-1 md:grid-cols-2 items-center gap-10">
              <div className="relative w-full h-[700px] ">
                <Image src="/gym_portrait.png" alt="Gym Portrait" fill className="object-cover" />
              </div>
              <div className="relative max-w-[536px] mx-auto text-left">
                <h3 className="text-[#423B2D] text-[40px] font-semibold leading-[27px]">Strength Meets Luxury</h3>
                <div className="mt-[43px] space-y-5 text-black text-[18px] leading-[41px]">
                  <p>Combine your fitness routine with refreshing views, natural light, and motivational music. Whether you’re maintaining your workout schedule or exploring new fitness practices, the gym supports your health journey in style.</p>
                  <p className="text-[#FF6A00]">Stay active, stay inspired, and embrace wellness on every level.</p>
                </div>
                <Link href="/contact-us" className="inline-flex items-center gap-3 bg-[#FF6A00] text-white px-6 py-3 rounded-[6px] text-[18px] font-medium mt-[32px]">
                  Booking Enquiry
                  <svg width="23" height="12" viewBox="0 0 23 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 6h21M16 1l6 5-6 5" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Video banner */}
        <section className="relative ">
        <div className="relative w-full h-[672px]">
          <Image src="/gym_video_bg.png" alt="Video Background" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <button
          aria-label="Play Spa Video"
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2 w-[72px] h-[72px] rounded-full bg-white/90 grid place-items-center shadow-md"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7L8 5z" fill="#242424"/>
          </svg>
        </button>
      </section>
      
      </main>
      <Footer />
    </>
  );
}


