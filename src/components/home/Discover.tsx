import Image from "next/image";
import BookNowButton from "../ui/BookNowButton";

export default function Discover() {
  return (
    <section className="w-full bg-[#F5D9A5] font-inter mt-12 md:mt-20">
      <div className="mx-auto flex max-w-screen-2xl flex-col lg:flex-row">
        <div className="group w-full lg:w-[47%] h-[400px] md:h-[590px] overflow-hidden">
          <Image
            width={1000}
            height={1000}
            src="/image1.png"
            alt="A few things to note at Sultan Palace"
            className="h-full w-full object-cover object-center transition-transform duration-300 ease-in-out group-hover:scale-110"
          />
        </div>

        <div className="w-full lg:w-1/2 flex items-center p-6 md:p-8 lg:p-12">
          <div className="flex flex-col">
            <p className="font-script text-2xl md:text-[30px] text-[#783A0C]">
              Discover Our Paradise
            </p>

            <h2 className="mt-3 text-3xl md:text-[35px] font-medium font-quicksand text-[#242F3C]">
              Endless Discoveries, Unforgettable Memories
            </h2>

            <p className="mt-6 text-base font-medium font-quicksand leading-relaxed text-[#5E5E5E]">
              Wake up to ocean whispers, walk barefoot on white sands, and let
              the rhythm of Zanzibar slow your world down. Sultan Palace Hotel
              isn&apos;t just a destination — it&apos;s a feeling.
            </p>

            <div className="mt-8">
              <BookNowButton
                size="sm"
                className="px-12 py-3 rounded-[9px] text-[14px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
