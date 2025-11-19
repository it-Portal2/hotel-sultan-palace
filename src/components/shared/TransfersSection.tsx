"use client";
import Image from "next/image";
import Link from "next/link";
import ContactUsButton from "@/components/ui/ContactUsButton";

export default function TransfersSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/get-zanzibar/Group 4793.png"
          alt="Sunset background"
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-12 md:pb-20 flex flex-col items-center text-center">
        <h3 className="text-[#423B2D] font-quicksand font-semibold text-[28px] md:text-[36px]">Transfers to Sultan Palace Hotel</h3>
        <p className="mt-6 text-[#423B2D] font-quicksand text-[18px] leading-[1.83] max-w-3xl">
          From the airport or Zanzibar Port, enjoy a scenic 60-minute drive through the island&apos;s coastal beauty to reach Sultan Palace Hotel.
        </p>
        <div className="mt-4 text-[#FF6A00] font-quicksand text-[18px]">We can arrange</div>

        <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 lg:gap-[190px] w-full">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-[80px] w-[80px] rounded-full bg-white shadow-lg flex items-center justify-center p-4 group hover:scale-110 transition-transform duration-300">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-200 to-red-200 opacity-10 group-hover:opacity-25 transition-opacity duration-300 animate-pulse"></div>
              <Image src="/get-zanzibar/car-transfer.png" alt="Private air-conditioned car transfers" width={60} height={60} className="object-contain group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-[#262116] font-quicksand text-[18px] leading-[1.5] text-center">
              Private air-conditioned car transfers
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-[80px] w-[80px] rounded-full bg-white shadow-lg flex items-center justify-center p-4 group hover:scale-110 transition-transform duration-300">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-orange-200 to-pink-200 opacity-10 group-hover:opacity-25 transition-opacity duration-300 animate-pulse"></div>
              <Image src="/get-zanzibar/meet-greet-assistance.png" alt="Meet & greet assistance" width={60} height={60} className="object-contain group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-[#262116] font-quicksand text-[18px] leading-[1.5] text-center">
              Meet & Greet assistance
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-[80px] w-[80px] rounded-full bg-white shadow-lg flex items-center justify-center p-4 group hover:scale-110 transition-transform duration-300">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-200 to-yellow-200 opacity-10 group-hover:opacity-25 transition-opacity duration-300 animate-pulse"></div>
              <Image src="/get-zanzibar/luxury-vehicle.png" alt="Group or luxury vehicle transfers" width={60} height={60} className="object-contain group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="text-[#262116] font-quicksand text-[18px] leading-[1.5] text-center">
              Group or luxury vehicle options
            </div>
          </div>
        </div>

        <h4 className="mt-12 md:mt-16 text-[#322A19] font-quicksand font-semibold text-[28px] md:text-[32px]">Need Assistance?</h4>
        <p className="mt-3 md:mt-4 text-[#433C2D] font-quicksand text-[16px] md:text-[18px] max-w-3xl">
          Our reservations team will be delighted to help you organize your transfers and travel arrangements.
        </p>
        <div className="mt-6 md:mt-8">
          <ContactUsButton />
        </div>
      </div>
    </section>
  );
}
