import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OurStoriesPage from "@/components/stories/OurStoriesPage";

export default function OurStories() {
  return (
    <main className="w-full overflow-x-hidden">
      <Header />
      <OurStoriesPage />
      <Footer />
    </main>
  );
}

