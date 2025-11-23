'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GuestExperienceForm from '@/components/hotel/GuestExperienceForm';

export default function GuestExperiencePage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <div className="pt-20 md:pt-24">
        <GuestExperienceForm />
      </div>
      <Footer />
    </div>
  );
}

