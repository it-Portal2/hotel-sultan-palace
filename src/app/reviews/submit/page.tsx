'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ReviewSubmissionForm from '@/components/hotel/ReviewSubmissionForm';

export default function SubmitReviewPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <div className="pt-20 md:pt-24 mt-24 md:mt-32">
        <ReviewSubmissionForm />
      </div>
      <Footer />
    </div>
  );
}

