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
    setCurrentImageSet((prev) => (prev + 1) % (happyMomentsImages.length - 2));
  };

  const prevImage = () => {
    setCurrentImageSet((prev) => (prev - 1 + (happyMomentsImages.length - 2)) % (happyMomentsImages.length - 2));
  };

  return (
    <div className="w-full bg-[#FFFCF6]">
      {/* Hero Section */}
      <div className="relative h-[1319px] w-full">
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
          <div className="text-center max-w-4xl mt-50">
            <div className="mb-6">
              <h1 className="text-[#FFEAD3] text-[25px] font-bold uppercase tracking-[3.25px] mb-4">
                about us
              </h1>
            </div>
            <h2 className="text-white text-[40px] font-bold uppercase leading-[1.475] tracking-[0.8px] mb-8">
              About Sultan Palace Hotel
            </h2>
            <p className="text-white text-[18px] font-normal leading-[1.5] tracking-[0.72px] max-w-[879px]">
              Welcome to Sultan Palace Hotel, a hidden sanctuary on the breathtaking south-east coast of Zanzibar. 
              Nestled between white sandy beaches and turquoise waters, our resort is a blend of timeless elegance, 
              Swahili charm, and modern luxury — designed for travelers who seek peace, beauty, and personalized comfort.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          {/* YouTube Video */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[800px]">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <iframe
                width="100%"
                height="400"
                src="https://www.youtube.com/embed/YSJ7RyybG48?si=TQhhlDo8GBaMOVOC"
                title="Sultan Palace Hotel Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
              
              {/* Custom Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Top Bar Overlay */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-black/70 to-transparent flex items-center justify-between px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                   
                  </div>
                 
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-2xl hover:bg-red-700 transition-colors cursor-pointer">
                    <FaPlay className="w-4 h-4 text-white" />
                  </div>
                </div>

               
              </div>
            </div>
          </div>
          
          <div 
            className="w-full  h-[400px]"
            style={{
              background: 'linear-gradient(180deg, rgba(30, 91, 78, 0) 0%, rgba(21, 91, 76, 0.23) 23%, rgba(24, 91, 76, 0.35) 35%, rgba(30, 91, 78, 0.46) 46%, rgba(88, 133, 124, 0.60) 60%, #DAE4E2 82%, #ffffff 100%)'
            }}
          />
        </div>
      </div>

     
      <div className="relative bg-[#FFFCF6] pt-32 pb-16 lg:pt-40 lg:pb-24">
        <div className="container mx-auto max-w-[1623px]">
          <div className="relative w-full h-[982px]">
            
          
            <div className="absolute left-[30px] -top-5 w-[630px] h-[50px] flex items-start">
              <h3 className="text-[#242424]  text-[40px] font-semibold leading-[1.25] font-['Quicksand']">
                Welcome to Sultan Palace Hotel
              </h3>
            </div>
            
           
            <div 
              className="absolute left-0 top-[92px] w-[600px] h-[500px] rounded-r-[14px] overflow-hidden"
              style={{
                backgroundImage: 'url(/about-content-left-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            <div className="absolute right-0 top-[92px] w-[620px] h-auto pr-16">
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-['Quicksand']">
                  Where Timeless Elegance Meets the Ocean Breeze
                </h3>
                <p className="text-[#353026] text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                  More than a destination, Sultan Palace Hotel is a feeling — a sanctuary where every sunrise brings a sense of renewal and every sunset whispers stories of the sea. Nestled along Zanzibar&apos;s unspoiled coastline, our resort embodies the island&apos;s royal heritage, blending traditional Swahili architecture with modern luxury.
                </p>
                <p className="text-[#353026]  text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                  Here, time slows down. You&apos;ll wake to the sound of waves, walk barefoot on soft white sands, and rediscover what it means to truly unwind. Every detail, from handcrafted interiors to personalized service, is designed to offer you freedom, warmth, and connection — with yourself and with the beauty that surrounds you.
                </p>
              </div>
            </div>
            
            <div 
              className="absolute right-0 top-[501px] w-[620px] h-[420px] rounded-l-[14px] overflow-hidden"
              style={{
                backgroundImage: 'url(/about-content-right-bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            <div className="absolute left-[50px] top-[630px] w-[500px]  h-auto">
              <div className="flex flex-col gap-[10px]">
                <h3 className="text-[#2D2922] text-[26px] font-semibold leading-[1.25] font-['Quicksand']">
                  Our Philosophy
                </h3>
                <p className="text-[#353026] text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
                  At Sultan Palace Hotel, we believe that true luxury is about experience, not excess. We invite our guests to embrace spontaneity — to follow the rhythm of their own hearts. Whether that means a sunrise yoga session overlooking the ocean, an afternoon of adventure exploring coral reefs, or a moonlit dinner by the shore — the choice is always yours.
                </p>
                <p className="text-[#353026] text-[16px] font-normal leading-[1.6875] tracking-[0.01em] font-['Quicksand']">
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
          <div className="container -mt-90 mx-auto max-w-[915px] text-center flex flex-col gap-[30px]">
            <h3 className="text-[#212121] text-[40px] font-semibold leading-[0.675] tracking-[0.01em] font-['Quicksand']">
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
      <div className="relative py-16 lg:py-24 bg-[#FFFCF6]">
        <div className="container mx-auto max-w-[1880px] px-4">
          {/* Main Container - Column layout with center alignment and 57px gap */}
          <div className="flex flex-col items-center gap-[57px]">
            
            {/* Header Frame - Happy Moments text and line */}
            <div className="flex flex-col items-center gap-[17px] w-[495px]">
              <h3 className="text-[#353535] text-[36px] font-semibold leading-[0.694] text-center font-['Quicksand']">
                Happy Moments
              </h3>
              <div 
                className="w-full h-px"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(0, 80, 108, 1) 48%, rgba(255, 255, 255, 1) 100%)'
                }}
              ></div>
            </div>
            
            {/* Image Gallery Frame - Row layout with 25px gap */}
            <div className="flex items-center gap-[25px] w-full justify-center">
              {/* Previous Button */}
              <button
                onClick={prevImage}
                className="w-[49px] h-[49px] bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
                style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
              >
                <FaChevronLeft className="text-[#FF6A00] text-lg" />
              </button>

              {/* Image Gallery Container */}
              <div className="flex gap-[25px] justify-center">
                {happyMomentsImages.slice(currentImageSet, currentImageSet + 3).map((image, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[356px] h-[368px] rounded-lg overflow-hidden shadow-lg"
                    style={{ boxShadow: '0px 4px 11.1px 0px rgba(0, 0, 0, 0.25)' }}
                  >
                    <img
                      src={image}
                      alt={`Happy Moment ${currentImageSet + index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={nextImage}
                className="w-[49px] h-[49px] bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
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