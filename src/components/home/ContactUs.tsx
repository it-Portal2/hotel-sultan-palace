"use client";
import { MdEmail, MdPhone, MdAccessTime, MdLocationOn, MdPerson, MdAlternateEmail, MdLanguage, MdMessage } from "react-icons/md";

const info = [
  { 
    icon: MdEmail, 
    items: [
      { text: "portaholdingsznz@gmail.com", link: "mailto:portaholdingsznz@gmail.com" },
      { text: "reservations@sultanpalacehotelznz.com", link: "mailto:reservations@sultanpalacehotelznz.com" }
    ]
  },
  { 
    icon: MdPhone, 
    items: [
      { text: "+255 684 888 111", link: "tel:+255684888111" },
      { text: "+255 777 085 630", link: "tel:+255777085630" },
      { text: "+255 657 269 674", link: "tel:+255657269674" }
    ]
  },
  { icon: MdAccessTime, text: "WORKING HOURS Monday - Saturday\n08:00a.m - 6:00p.m", link: "" },
  { icon: MdLocationOn, text: "Dongwe, East Coast, Zanzibar", link: "" },
];

export default function ContactUs() {
  return (
    <section className="w-full">
      {/* Top Section: Contact Form */}
      <div className="w-full bg-[#2C2B28] py-8 md:py-12 px-4 sm:px-6 md:px-8 lg:px-8 xl:px-12 2xl:px-20">
        <div className="w-full max-w-[1512px] mx-auto">
          <p className="font-kaisei text-sm md:text-base text-[#BE8C53]">Contact Us</p>
          <h2 className="mt-2 font-kaisei font-bold text-2xl sm:text-3xl md:text-4xl text-white">Find Out More</h2>

          <div className="mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-x-8 xl:gap-x-12">
            {/* Left: contact details */}
            <div className="space-y-5 md:space-y-6">
              {info.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 md:gap-5">
                  <div className="grid h-7 w-7 md:h-8 md:w-8 flex-shrink-0 place-items-center rounded-full bg-[#BE8C53] text-white">
                    <item.icon className="text-xl md:text-2xl" />
                  </div>
                  {item.items ? (
                    <div className="flex flex-col gap-1 pt-1 md:pt-2 flex-1 min-w-0">
                      {item.items.map((itemData, i) => (
                        <a 
                          key={i}
                          href={itemData.link} 
                          className="font-kaisei text-xs md:text-sm text-white/90 hover:underline transition-colors break-words"
                        >
                          {itemData.text}
                        </a>
                      ))}
                    </div>
                  ) : item.link ? (
                    <a href={item.link} className="whitespace-pre-line pt-1 md:pt-2 font-kaisei text-xs md:text-sm text-white/90 hover:underline transition-colors break-words">{item.text}</a>
                  ) : (
                    <p className="whitespace-pre-line pt-1 md:pt-2 font-kaisei text-xs md:text-sm text-white/90 break-words">{item.text}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Right: form */}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10 min-w-0">
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]" placeholder="Your name" />
                <MdPerson className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-white/50 text-base md:text-lg pointer-events-none" />
              </div>
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]" placeholder="Enter email" />
                <MdAlternateEmail className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-white/50 text-base md:text-lg pointer-events-none" />
              </div>
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]" placeholder="Phone No." />
                <MdPhone className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-white/50 text-base md:text-lg pointer-events-none" />
              </div>
              <div className="relative">
                <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]" placeholder="Website" />
                <MdLanguage className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-white/50 text-base md:text-lg pointer-events-none" />
              </div>
              <div className="relative md:col-span-2">
                <textarea rows={5} className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53] resize-none" placeholder="Message" />
                <MdMessage className="absolute right-3 md:right-4 top-4 text-white/50 text-base md:text-lg pointer-events-none" />
              </div>

              <div className="md:col-span-2 mt-2">
                <button type="button" className="w-full bg-[#BE8C53] hover:bg-[#A67948] text-white font-kaisei py-3 tracking-wider text-sm md:text-base rounded-md transition-colors">SEND MESSAGE</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Bottom Section: Subscribe */}
      <div className="w-full bg-[#1F1F1E] py-8 md:py-10">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
          <div className="text-center">
            <h3 className="font-kaisei text-white text-lg md:text-xl lg:text-2xl">Get Timely Updates</h3>
            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 w-full max-w-[420px] mx-auto">
              <input className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-3 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]" placeholder="Enter Your Email Address" />
              
              <button className="w-full sm:w-auto bg-[#BE8C53] hover:bg-[#A67948] text-white font-kaisei px-8 md:px-10 py-2.5 md:py-2 text-sm rounded-md transition-colors whitespace-nowrap">Subscribe</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}