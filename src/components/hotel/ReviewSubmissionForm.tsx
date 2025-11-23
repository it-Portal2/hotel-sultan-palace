'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGuestReview, GuestReview } from '@/lib/firestoreService';
import { FaStar } from 'react-icons/fa';

interface ReviewFormData {
  name: string;
  country: string;
  type: string;
  rating: number;
  review: string;
  staffRating?: number;
  facilitiesRating?: number;
  cleanlinessRating?: number;
  comfortRating?: number;
  valueRating?: number;
  locationRating?: number;
  wifiRating?: number;
}

const ReviewSubmissionForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ReviewFormData>({
    name: '',
    country: '',
    type: '',
    rating: 0,
    review: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect to hotel page after 3 seconds
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        router.push('/hotel');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  const handleInputChange = (field: keyof ReviewFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStarClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleCategoryRating = (category: keyof ReviewFormData, rating: number) => {
    setFormData(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.review || formData.rating === 0) {
      setError('Please fill in Name, Rating, and Review fields');
      return;
    }

    setSubmitting(true);

    try {
      // Build review data object, only including defined values
      const reviewData: Omit<GuestReview, 'id' | 'createdAt' | 'updatedAt' | 'isApproved'> = {
        name: formData.name,
        rating: formData.rating,
        review: formData.review,
      };

      // Only add optional fields if they have values
      if (formData.country) reviewData.country = formData.country;
      if (formData.type) reviewData.type = formData.type;
      if (formData.staffRating) reviewData.staffRating = formData.staffRating;
      if (formData.facilitiesRating) reviewData.facilitiesRating = formData.facilitiesRating;
      if (formData.cleanlinessRating) reviewData.cleanlinessRating = formData.cleanlinessRating;
      if (formData.comfortRating) reviewData.comfortRating = formData.comfortRating;
      if (formData.valueRating) reviewData.valueRating = formData.valueRating;
      if (formData.locationRating) reviewData.locationRating = formData.locationRating;
      if (formData.wifiRating) reviewData.wifiRating = formData.wifiRating;

      const result = await createGuestReview(reviewData);

      if (result) {
        setSubmitted(true);
        // Reset form
        setFormData({
          name: '',
          country: '',
          type: '',
          rating: 0,
          review: '',
        });
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">Your review has been submitted successfully and is now live!</p>
          <p className="text-sm text-gray-500 mb-6">Thank you for sharing your experience with other guests.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => router.push('/hotel')}
              className="bg-[#1D69F9] text-white px-8 py-3 rounded-md font-medium hover:bg-[#1a5ae0] transition-colors"
            >
              Back to Hotel Page
            </button>
            <button
              onClick={() => router.push('/reviews')}
              className="bg-white border-2 border-[#1D69F9] text-[#1D69F9] px-8 py-3 rounded-md font-medium hover:bg-[#1D69F9]/5 transition-colors"
            >
              View All Reviews
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">Redirecting to hotel page in 3 seconds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">Share Your Experience</h1>
          <p className="text-gray-600">Help other guests by sharing your review</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                placeholder="e.g., United States"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Travel Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="Solo traveller">Solo traveller</option>
                <option value="Couple">Couple</option>
                <option value="Family">Family</option>
                <option value="Business">Business</option>
                <option value="Group">Group</option>
              </select>
            </div>
          </div>

          {/* Overall Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none"
                >
                  <FaStar
                    className={`text-3xl ${
                      star <= formData.rating
                        ? 'text-[#FFC400]'
                        : 'text-gray-300'
                    } transition-colors hover:text-[#FFC400]`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} out of 5
                </span>
              )}
            </div>
          </div>

          {/* Detailed Ratings (Optional) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-[#3F3F3F] mb-4">Detailed Ratings (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'staffRating' as const, label: 'Staff' },
                { key: 'facilitiesRating' as const, label: 'Facilities' },
                { key: 'cleanlinessRating' as const, label: 'Cleanliness' },
                { key: 'comfortRating' as const, label: 'Comfort' },
                { key: 'valueRating' as const, label: 'Value for Money' },
                { key: 'locationRating' as const, label: 'Location' },
                { key: 'wifiRating' as const, label: 'Free WiFi' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleCategoryRating(key, star)}
                        className="focus:outline-none"
                      >
                        <FaStar
                          className={`text-xl ${
                            star <= (formData[key] || 0)
                              ? 'text-[#FFC400]'
                              : 'text-gray-300'
                          } transition-colors hover:text-[#FFC400]`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.review}
              onChange={(e) => handleInputChange('review', e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
              placeholder="Share your experience with other guests..."
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#1D69F9] text-white px-8 py-3 rounded-md font-medium hover:bg-[#1a5ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewSubmissionForm;

