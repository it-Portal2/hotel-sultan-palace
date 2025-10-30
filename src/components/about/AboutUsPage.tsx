"use client";
import { FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useState } from 'react';
import Link from 'next/link';

export default function AboutUsPage() {
  const [currentImageSet, setCurrentImageSet] = useState(0);
  const happyMomentsImages = [
    '/Happy-Moment/img1.png',
    '/Happy-Moment/img2.png',
    '/Happy-Moment/img3.png',
    '/Happy-Moment/img4.png',
   
  ];

  const nextImage = () => {
    setCurrentImageSet((prev) => (prev + 1) % happyMomentsImages.length);
  };

  const prevImage = () => {
    setCurrentImageSet((prev) => (prev - 1 + happyMomentsImages.length) % happyMomentsImages.length);
  };

  return (
    <div className="w-full bg-[#FFFCF6]">
      {/* Hero Section */}
      <div className="relative h-[520px] sm:h-[800px] md:h-[1000px] lg:h-[1319px] w-full">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/about-main-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/60" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <div className="text-center max-w-4xl mt-24 md:mt-50">
            <div className="mb-3 md:mb-6">
              <h1 className="text-[#FFEAD3] text-[18px] sm:text-[20px] md:text-[25px] font-bold uppercase tracking-[2px] md:tracking-[3.25px] mb-2 md:mb-4">
                about us
              </h1>
            </div>
            <h2 className="text-white text-[24px] sm:text-[32px] md:text-[40px] font-bold uppercase leading-[1.3] md:leading-[1.475] tracking-[0.5px] md:tracking-[0.8px] mb-3 md:mb-8 px-2">
              About Sultan Palace Hotel
            </h2>
            <p className="text-white text-[14px] sm:text-[16px] md:text-[18px] font-normal leading-[1.6] tracking-[0.5px] md:tracking-[0.72px] max-w-[879px] px-2">
              Welcome to Sultan Palace Hotel, a hidden sanctuary on the breathtaking south-east coast of Zanzibar. 
              Nestled between white sandy beaches and turquoise waters, our resort is a blend of timeless elegance, 
              Swahili charm, and modern luxury — designed for travelers who seek peace, beauty, and personalized comfort.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div 
            className="w-full h-[180px] sm:h-[280px] md:h-[340px] lg:h-[400px]"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 91, 78, 0) 0%, rgba(21, 91, 76, 0.23) 23%, rgba(24, 91, 76, 0.35) 35%, rgba(30, 91, 78, 0.46) 46%, rgba(88, 133, 124, 0.60) 60%, #DAE4E2 82%, #ffffff 100%)'
            }}
          />
        </div>
      </div>

      {/* Mobile YouTube video below hero to avoid overlap */}
      <div className="md:hidden w-full px-4 mt-4">
        <div className="relative rounded-lg overflow-hidden shadow-2xl">
          <iframe
            width="100%"
            height="200"
            src="https://www.youtube.com/embed/YSJ7RyybG48?si=TQhhlDo8GBaMOVOC"
            title="Sultan Palace Hotel Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      </div>

     
      <div className="relative bg-[#FFFCF6] pt-12 md:pt-24 pb-10 md:pb-16 lg:pt-40 lg:pb-24">
        <div className="container mx-auto max-w-[1623px] px-4">
          <div className="relative w-full md:h-[982px] grid md:block gap-6">
            
          
            <div className="md:absolute left-4 md:left-[30px] -top-2 md:-top-5 w-full md:w-[630px] h-[50px] flex items-start">
              <h3 className="text-[#242424] text-[22px] sm:text-[28px] md:text-[40px] font-semibold leading-[1.25] font-['Quicksand']">
                Welcome to Sultan Palace Hotel
              </h3>
            </div>
            
           
            <div 
              className="md:absolute left-0 md:top-[92px] w-full md:w-[600px] h-[220px] sm:h-[300px] md:h-[500px] rounded-r-[14px] overflow-hidden"
              style={{
                backgroundImage: 'url(/about-content-left-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            <div className="md:absolute right-0 md:top-[92px] w-full md:w-[620px] h-auto px-2 md:px-0 md:pr-16 mt-4 md:mt-0">
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[#2D2922] text-[20px] sm:text-[22px] md:text-[26px] font-semibold leading-[1.25] font-['Quicksand']">
                  Where Timeless Elegance Meets the Ocean Breeze
                </h3>
                <p className="text-[#353026] text-[14px] sm:text-[15px] md:text-[16px] font-normal leading-[1.7] tracking-[0.01em] font-['Quicksand']">
                  More than a destination, Sultan Palace Hotel is a feeling — a sanctuary where every sunrise brings a sense of renewal and every sunset whispers stories of the sea. Nestled along Zanzibar&apos;s unspoiled coastline, our resort embodies the island&apos;s royal heritage, blending traditional Swahili architecture with modern luxury.
                </p>
                <p className="text-[#353026] text-[14px] sm:text-[15px] md:text-[16px] font-normal leading-[1.7] tracking-[0.01em] font-['Quicksand']">
                  Here, time slows down. You&apos;ll wake to the sound of waves, walk barefoot on soft white sands, and rediscover what it means to truly unwind. Every detail, from handcrafted interiors to personalized service, is designed to offer you freedom, warmth, and connection — with yourself and with the beauty that surrounds you.
                </p>
              </div>
            </div>
            
            <div 
              className="md:absolute right-0 md:top-[501px] w-full md:w-[620px] h-[220px] sm:h-[300px] md:h-[420px] rounded-l-[14px] overflow-hidden mt-4 md:mt-0"
              style={{
                backgroundImage: 'url(/about-content-right-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            <div className="md:absolute left-4 md:left-[50px] md:top-[630px] w-full md:w-[500px] h-auto px-2 mt-4 md:mt-0">
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[#2D2922] text-[20px] sm:text-[22px] md:text-[26px] font-semibold leading-[1.25] font-['Quicksand']">
                  Our Philosophy
                </h3>
                <p className="text-[#353026] text-[14px] sm:text-[15px] md:text-[16px] font-normal leading-[1.7] tracking-[0.01em] font-['Quicksand']">
                  At Sultan Palace Hotel, we believe that true luxury is about experience, not excess. We invite our guests to embrace spontaneity — to follow the rhythm of their own hearts. Whether that means a sunrise yoga session overlooking the ocean, an afternoon of adventure exploring coral reefs, or a moonlit dinner by the shore — the choice is always yours.
                </p>
                <p className="text-[#353026] text-[14px] sm:text-[15px] md:text-[16px] font-normal leading-[1.7] tracking-[0.01em] font-['Quicksand']">
                  Our mission is to create moments that stay with you long after you&apos;ve left our shores — moments of joy, discovery, and belonging.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment Section */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/image%2049.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-white/30" />
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 ">
          <div className="container mt-0 md:-mt-90 mx-auto max-w-[915px] text-center flex flex-col gap-[30px]">
            <h3 className="text-[#212121] text-[26px] sm:text-[32px] md:text-[40px] font-semibold leading-[1.2] tracking-[0.01em] font-['Quicksand']">
              Our Commitment to Zanzibar
            </h3>
            <div className="text-[#272218] text-[16px] font-medium leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
              <p className="mb-2">
                Proudly rooted in local culture, we are dedicated to uplifting the Zanzibari community through training, employment, and sustainability programs. From sourcing fresh island produce to supporting traditional artisans, we celebrate the spirit of Zanzibar in everything we do.
              </p>
              <p>
                Our team — many of whom have grown with us since the beginning — embodies the heart of Sultan Palace: warm, genuine, and ever welcoming.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Happy Moments Section */}
      <div className="relative py-10 sm:py-14 lg:py-24 bg-[#FFFCF6]">
        <div className="container mx-auto max-w-[1880px] px-4">
          {/* Main Container - Column layout with center alignment and 57px gap */}
          <div className="flex flex-col items-center gap-[57px]">
            
            {/* Header Frame - Happy Moments text and line */}
            <div className="flex flex-col items-center gap-[17px] w-full">
              <h3 className="text-[#353535] text-[24px] sm:text-[28px] md:text-[36px] font-semibold leading-[1.2] text-center font-['Quicksand']">
                Happy Moments
              </h3>
              <div 
                className="w-full h-px"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(0, 80, 108, 1) 48%, rgba(255, 255, 255, 1) 100%)'
                }}
              ></div>
            </div>
            
            {/* Image Gallery Frame - Buttons always visible; 1 image on mobile, 3 on md+ */}
            <div className="flex items-center gap-[16px] md:gap-[25px] w-full justify-center">
              {/* Previous Button */}
              <button
                onClick={prevImage}
                className="w-[42px] h-[42px] md:w-[49px] md:h-[49px] bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
                style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
              >
                <FaChevronLeft className="text-[#FF6A00] text-lg" />
              </button>

              {/* Image Gallery Container */}
              <div className="flex gap-[16px] md:gap-[25px] justify-center items-center">
                {([0,1,2] as const).map((offset, index) => {
                  const image = happyMomentsImages[(currentImageSet + offset) % happyMomentsImages.length];
                  const visibility = index === 0 ? '' : 'hidden md:block';
                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-[75vw] max-w-[300px] h-[260px] sm:h-[320px] md:h-[368px] rounded-lg overflow-hidden shadow-lg ${visibility}`}
                      style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
                    >
                      <img
                        src={image}
                        alt={`Happy Moment ${currentImageSet + index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={nextImage}
                className="w-[42px] h-[42px] md:w-[49px] md:h-[49px] bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
                style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
              >
                <FaChevronRight className="text-[#FF6A00] text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="relative  min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/anything.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Content */}
        <div className="relative z-10 px-4 py-16 lg:py-24">
          <div className="container mx-auto max-w-4xl text-center mt-50">
            <h3 className="text-[#212121] text-[40px] font-semibold leading-[0.675] tracking-[0.4px] mb-8">
              A Place to Belong
            </h3>
            <p className="text-[#423B2D] text-[20px] font-bold leading-[1.35] tracking-[0.2px] mb-6">
              Sultan Palace Hotel isn&apos;t just a place to stay — it&apos;s a place to connect. To breathe, to feel, to be.
            </p>
            <p className="text-[#0B0A07] text-[18px] font-medium leading-[1.833] tracking-[0.36px] mb-8">
              To begin your story, or perhaps, continue it — in a setting that inspires you to live more fully, love more deeply, and dream endlessly.
            </p>
            <Link href="/contact-us" className="inline-block">
              <button className="bg-[#F96406] text-white text-lg text-semibold px-6 py-2 rounded-full hover:bg-[#E55A05] transition-colors">
                Connect Us
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}