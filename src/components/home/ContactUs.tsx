"use client";
import { MdEmail, MdPhone, MdAccessTime, MdLocationOn, MdPerson, MdAlternateEmail, MdLanguage, MdMessage } from "react-icons/md";

const info = [
  { icon: MdEmail, text: "portaholdingsznz@gmail.com" },
  { icon: MdPhone, text: "+91 89409+255 777 085 630 / +255 657 269 674" },
  { icon: MdAccessTime, text: "WORKING HOURS Monday - Saturday\n08:00a.m - 6:00p.m" },
  { icon: MdLocationOn, text: "Dongwe, East Coast, Zanzibar" },
];

export default function ContactUs() {
  return (
    <section className="w-full">
      {/* Top Section: Contact Form */}
      <div className="w-full bg-[#2C2B28] py-12 px-15">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
          <p className="font-kaisei text-base text-[#BE8C53]">Contact Us</p>
          <h2 className="mt-2 font-kaisei font-bold text-3xl md:text-4xl text-white">Find Out More</h2>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-10">
            {/* Left: contact details */}
            <div className="space-y-6">
              {info.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-5">
                  <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#BE8C53] text-white">
                    <Icon className="text-2xl" />
                  </div>
                  <p className="whitespace-pre-line pt-2 font-kaisei text-sm text-white/90">{text}</p>
                </div>
              ))}
            </div>

            {/* Right: form */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 px-2 md:px-4 -mt-20 z-10 mx-15">
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10" placeholder="Your name" />
                <MdPerson className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
              </div>
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10" placeholder="Enter email" />
                <MdAlternateEmail className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
              </div>
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10" placeholder="Phone No." />
                <MdPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
              </div>
              <div className="relative">
                <input className="w-full bg-[#BE8C  53]/10 text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10" placeholder="Website" />
                <MdLanguage className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-lg" />
              </div>
              <div className="relative md:col-span-2">
                <textarea rows={5} className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10" placeholder="Message" />
                <MdMessage className="absolute right-4 top-4 text-white/50 text-lg" />
              </div>

              <div className="md:col-span-2 mt-2">
                <button type="button" className="w-full bg-[#BE8C53] text-white font-kaisei py-3 tracking-wider text-base rounded-md">SEND MESSAGE</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Bottom Section: Subscribe */}
      <div className="w-full bg-[#1F1F1E] py-10">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
          <div className="text-center">
            <h3 className="font-kaisei text-white text-xl md:text-2xl">Get Timely Updates</h3>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <input className="w-[320px] bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10" placeholder="Enter Your Email Address" />
              <button className="bg-[#BE8C53] text-white font-kaisei px-10 py-2 text-sm rounded-md">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}