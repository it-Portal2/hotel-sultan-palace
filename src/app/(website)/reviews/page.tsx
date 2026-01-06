'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAllGuestReviews, GuestReview } from '@/lib/firestoreService';
import { FaStar } from 'react-icons/fa';

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const toggleReview = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const approvedReviews = await getAllGuestReviews(true);
        setReviews(approvedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const getAvatarUrl = (review: GuestReview) => {
    if (review.avatarUrl) return review.avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=BE8C53&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="px-4 sm:px-6 md:px-8 lg:px-[114px] py-8 sm:py-12 md:py-16 lg:py-[117px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 mt-24 md:mt-32">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Guest Reviews</h1>
              <p className="text-gray-600">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} from our guests
              </p>
            </div>
            <button
              onClick={() => router.push('/reviews/submit')}
              className="bg-[#1D69F9] text-white px-6 py-3 rounded-md font-medium hover:bg-[#1a5ae0] transition-colors"
            >
              Write a Review
            </button>
          </div>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600 mb-4">No reviews yet. Be the first to share your experience!</p>
              <button
                onClick={() => router.push('/reviews/submit')}
                className="bg-[#1D69F9] text-white px-6 py-3 rounded-md font-medium hover:bg-[#1a5ae0] transition-colors"
              >
                Write the first review
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm border border-[#EBEBEB] p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={getAvatarUrl(review)}
                        alt={review.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#1A1A1A]">{review.name}</h3>
                        {review.country && (
                          <span className="text-sm text-gray-600">({review.country})</span>
                        )}
                        {review.type && (
                          <span className="text-sm text-gray-500">- {review.type}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`text-lg ${i < review.rating ? 'text-[#FFC400]' : 'text-gray-300'
                              }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">{review.rating} / 5</span>
                      </div>
                      <div className="mb-4">
                        <p
                          className={`text-gray-700 leading-relaxed italic ${!expandedReviews.has(review.id) && review.review.length > 250
                              ? 'line-clamp-5'
                              : ''
                            }`}
                        >
                          &quot;{review.review}&quot;
                        </p>
                        {review.review.length > 250 && (
                          <button
                            onClick={() => toggleReview(review.id)}
                            className="text-[#0088FF] text-sm font-medium mt-2 hover:underline focus:outline-none"
                          >
                            {expandedReviews.has(review.id) ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </div>

                      {/* Detailed Ratings */}
                      {(review.staffRating || review.facilitiesRating || review.cleanlinessRating ||
                        review.comfortRating || review.valueRating || review.locationRating || review.wifiRating) && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 pt-4 border-t border-gray-200">
                            {review.staffRating && (
                              <div>
                                <strong>Staff:</strong> {review.staffRating}/5
                              </div>
                            )}
                            {review.facilitiesRating && (
                              <div>
                                <strong>Facilities:</strong> {review.facilitiesRating}/5
                              </div>
                            )}
                            {review.cleanlinessRating && (
                              <div>
                                <strong>Cleanliness:</strong> {review.cleanlinessRating}/5
                              </div>
                            )}
                            {review.comfortRating && (
                              <div>
                                <strong>Comfort:</strong> {review.comfortRating}/5
                              </div>
                            )}
                            {review.valueRating && (
                              <div>
                                <strong>Value:</strong> {review.valueRating}/5
                              </div>
                            )}
                            {review.locationRating && (
                              <div>
                                <strong>Location:</strong> {review.locationRating}/5
                              </div>
                            )}
                            {review.wifiRating && (
                              <div>
                                <strong>WiFi:</strong> {review.wifiRating}/5
                              </div>
                            )}
                          </div>
                        )}

                      <div className="text-xs text-gray-500 mt-4">
                        {review.createdAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


