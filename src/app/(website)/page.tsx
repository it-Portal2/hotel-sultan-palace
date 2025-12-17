import Hero from "@/components/home/Hero";
import Intro from "@/components/home/Intro";
import Discover from "@/components/home/Discover";
import Excursions from "@/components/home/Excursions";
import CuratedExcursions from "@/components/home/CuratedExcursions";
import RoomsVillas from "@/components/home/RoomsVillas";
import FeaturedCalm from "@/components/home/FeaturedCalm";
import OffersCarousel from "@/components/home/OffersCarousel";
import ExclusivelyYours from "@/components/home/ExclusivelyYours";
import ExperienceBars from "@/components/home/ExperienceBars";
import InRoomFacilities from "@/components/home/InRoomFacilities";
import StoryInPictures from "@/components/home/StoryInPictures";
import AppDownloadPromo from "@/components/home/AppDownloadPromo";
import Testimonials from "@/components/home/Testimonials";
import AboutZanzibar from "@/components/home/about_zanzibar";
import ContactUs from "@/components/home/ContactUs";
import "@/styles/home/index.css";


export default function Home() {
  return (
    <main className="w-full max-w-full overflow-x-hidden">
            <Hero />
      <Intro />
      <Discover />
      <Excursions />
      <CuratedExcursions />
      <RoomsVillas />
      <FeaturedCalm />
      <OffersCarousel />
      <ExclusivelyYours />
      <ExperienceBars />
      <InRoomFacilities />
      <StoryInPictures />
      <AppDownloadPromo />
      <Testimonials />
      <AboutZanzibar />
      <ContactUs />
          </main>
  );
}

