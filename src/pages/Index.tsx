import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { ActivitiesSection } from "@/components/sections/ActivitiesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTASection } from "@/components/sections/CTASection";
import { GallerySection } from "@/components/sections/GallerySection";
import { MeetingPointsSection } from "@/components/sections/MeetingPointsSection";
import { HomeSeoHead, LocalExpertiseSection, CONTENT_VISIBILITY } from "@/features/index";

const Index = () => {
  return (
    <>
      <HomeSeoHead />

      <Header />

      <main>
        {/* Above-fold content - No content-visibility delay */}
        <HeroSection />
        <WhyUsSection />

        {/* Below-fold content - Optimized with content-visibility */}
        <ActivitiesSection />

        {/* Expert Local Content Section - SEO 1500+ words */}
        <LocalExpertiseSection />

        <div
          className="content-visibility-gallery contain-layout"
          style={CONTENT_VISIBILITY.gallery}
        >
          <GallerySection />
        </div>
        <div
          className="content-visibility-testimonials contain-layout"
          style={CONTENT_VISIBILITY.testimonials}
        >
          <TestimonialsSection />
        </div>
        <div
          className="content-visibility-faq contain-layout"
          style={CONTENT_VISIBILITY.faq}
        >
          <FAQSection />
        </div>
        <MeetingPointsSection />
        <CTASection />
      </main>

      <Footer />
    </>
  );
};

export default Index;
