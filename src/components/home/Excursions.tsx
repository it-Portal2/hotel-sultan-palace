import Image from "next/image";

const CARDS = [
  { title: "Jozani Forest", img: "/excursions/excursions_jozani.png" },
  { title: "Kizimkazi Dolphin", img: "/excursions/excursions_dolphin.png" },
  { title: "Sunset – Michamvi", img: "/excursions/excursions_sunset.png" },
  { title: "Horse Riding", img: "/excursions/excursions_horse.png" },
  { title: "Safari Blue", img: "/excursions/excursions_safari.png" },
];

export default function Excursions() {
  return (
    <section
      id="excursions"
      className="w-full bg-[#FFFCF6] py-12 md:py-20 font-sans"
    >
      <div className="container mx-auto max-w-screen-xl px-4 py-6 md:px-16 md:py-10">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-quicksand text-3xl md:text-4xl font-semibold text-[#202C3B]">
              Zanzibar Excursions
            </h2>
            <p className="mt-4 md:mt-10 text-base text-gray-500 font-quicksand">
              Discover the Island’s Most Memorable Adventures
            </p>
          </div>
          <a
            href="#"
            className="shrink-0 items-center gap-2 text-xl font-normal font-jomolhari text-[#FF6A00] transition-transform hover:scale-105 inline-flex md:inline-flex"
          >
            View All <span aria-hidden>→</span>
          </a>
        </div>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="group relative h-[200px] w-full overflow-hidden rounded-lg shadow-lg"
            >
              <Image
                width={100}
                height={100}
                src={card.img}
                alt={card.title}
                className="h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-150"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                <h3 className="text-lg font-normal font-jomolhari text-white drop-shadow-md">
                  {card.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
