export default function Intro() {
  return (
    <section className="w-full bg-[#FFFCF6]">
      <div className="container-xl py-4">
        <div className="mx-auto w-full max-w-[1512px] px-6 py-8 md:px-12 md:py-14 lg:px-[82px] lg:pt-[56px] lg:pb-[24px]">
          <div className="inline-flex h-[32px] items-center rounded-[49px] bg-orange-600/10 px-[20px]">
            <span className="whitespace-nowrap font-quicksand text-[16px] font-semibold leading-[1.5] text-[#FF6A00]">
              Timeless Luxury
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 items-end gap-y-4 lg:grid-cols-[1fr_520px] lg:gap-x-[110px]">
            <h2 className="font-quicksand text-[32px] font-bold leading-[1.25] text-[#202C3B] md:text-[38px]">
              <span className="block whitespace-nowrap">Experience Zanzibar in Timeless</span>
              <span className="block">Luxury</span>
            </h2>
            <p className="font-quicksand text-left text-[18px] font-medium leading-[1.35] text-[#202C3B] md:text-[20px] lg:ml-[40px] lg:pt-[4px]">
              <span className="block">Where Tranquility Meets Timeless</span>
              <span className="block">Elegance</span>
            </p>
          </div>

          <div className="mt-5 flex max-w-[1320px] flex-col gap-3">
            <p className="font-quicksand text-[16px] leading-[1.6] text-[#202C3B]/[0.86]">
              Sultan Palace Hotel invites you to discover the art of refined relaxation. Nestled along the tranquil shores of Zanzibar&apos;s east coast, our resort blends elegant design, personalized hospitality, and breathtaking ocean vistas.
            </p>
            <p className="font-quicksand text-[16px] leading-[1.6] text-[#202C3B]/[0.86]">
              Whether you&apos;re celebrating love, exploring with family, or simply recharging, our all-inclusive experience surrounds you with indulgence and warmth.
            </p>
            <p className="font-quicksand text-[16px] leading-[1.6] text-[#202C3B]/[0.86]">
              From curated dining to ocean adventures — <span className="font-semibold text-[#202C3B]">every detail is crafted for your perfect getaway.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}