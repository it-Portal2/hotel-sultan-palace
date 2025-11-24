'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaStar } from 'react-icons/fa';
import { getAllGuestReviews, GuestReview } from '@/lib/firestoreService';

interface ReviewCardProps {
  avatarUrl?: string;
  flagUrl?: string;
  name: string;
  country?: string;
  type?: string;
  review: string;
  rating: number;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ avatarUrl, flagUrl, name, country, type, review, rating }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAvatarUrl = () => {
    if (avatarUrl) return avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=BE8C53&color=fff&size=128`;
  };
  
  // Simple check: if review has more than ~250 characters, it's likely more than 5 lines
  const shouldTruncate = review.length > 250;
  const displayText = isExpanded || !shouldTruncate ? review : review.substring(0, 250) + '...';

  return (
    <div className="bg-white rounded-[4px] border border-[#EBEBEB] p-4 sm:p-6 flex flex-col h-full">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image 
              src={getAvatarUrl()} 
              alt={name} 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 40px, 48px"
              unoptimized
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#1A1A1A] break-words">
              {name} {type && <span className="font-normal">- {type}</span>}
            </h4>
            {country && (
              <div className="flex items-center gap-1 mt-1">
                {flagUrl && (
                  <div className="relative w-5 h-3 flex-shrink-0">
                    <Image 
                      src={flagUrl} 
                      alt={country} 
                      fill
                      className="object-cover border border-gray-200"
                      sizes="20px"
                      unoptimized
                    />
                  </div>
                )}
                <span className="text-[12px] sm:text-[13px] text-[#636363] truncate">{country}</span>
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <FaStar 
                  key={i} 
                  className={`text-[12px] ${
                    i < rating ? 'text-[#FFC400]' : 'text-gray-300'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
        <div className="relative">
          <p 
            className={`text-[13px] sm:text-[14px] text-[#3A3A3A] leading-[1.6] italic ${
              !isExpanded && shouldTruncate ? 'line-clamp-5' : ''
            }`}
          >
            &quot;{displayText}&quot;
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#0088FF] text-[12px] sm:text-[13px] font-medium mt-2 hover:underline focus:outline-none"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const GuestReviewsSection: React.FC = () => {
  const router = useRouter();
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 3;

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

  // Calculate average ratings from reviews
  const calculateAverageRatings = () => {
    const staffRatings = reviews.filter(r => r.staffRating).map(r => r.staffRating!);
    const facilitiesRatings = reviews.filter(r => r.facilitiesRating).map(r => r.facilitiesRating!);
    const cleanlinessRatings = reviews.filter(r => r.cleanlinessRating).map(r => r.cleanlinessRating!);
    const comfortRatings = reviews.filter(r => r.comfortRating).map(r => r.comfortRating!);
    const valueRatings = reviews.filter(r => r.valueRating).map(r => r.valueRating!);
    const locationRatings = reviews.filter(r => r.locationRating).map(r => r.locationRating!);
    const wifiRatings = reviews.filter(r => r.wifiRating).map(r => r.wifiRating!);
    const overallRatings = reviews.map(r => r.rating);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const scaleTo10 = (val: number | null) => (val !== null ? (val / 5) * 10 : null);
    const normalize = (val: number | null) => (val !== null ? Number(val.toFixed(1)) : null);

    return {
      staff: normalize(scaleTo10(avg(staffRatings))),
      facilities: normalize(scaleTo10(avg(facilitiesRatings))),
      cleanliness: normalize(scaleTo10(avg(cleanlinessRatings))),
      comfort: normalize(scaleTo10(avg(comfortRatings))),
      value: normalize(scaleTo10(avg(valueRatings))),
      location: normalize(scaleTo10(avg(locationRatings))),
      wifi: normalize(scaleTo10(avg(wifiRatings))),
      overall: normalize(scaleTo10(avg(overallRatings))),
    };
  };

  const averageRatings = calculateAverageRatings();
  
  // Pagination logic
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const displayedReviews = reviews.slice(startIndex, endIndex);
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of reviews section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of reviews section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const ratingCategories = [
    { label: 'Staff+', score: averageRatings.staff },
    { label: 'Facilities', score: averageRatings.facilities },
    { label: 'Cleanliness', score: averageRatings.cleanliness },
    { label: 'Comfort', score: averageRatings.comfort },
    { label: 'Value for money', score: averageRatings.value },
    { label: 'Location', score: averageRatings.location },
    { label: 'Free WiFi', score: averageRatings.wifi },
  ].filter(
    (category): category is { label: string; score: number } =>
      typeof category.score === 'number' && !Number.isNaN(category.score)
  );

  const formattedOverallScore =
    typeof averageRatings.overall === 'number' && !Number.isNaN(averageRatings.overall)
      ? averageRatings.overall.toFixed(1)
      : '0.0';

  const hasCategoryRatings = ratingCategories.length > 0;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-[114px] py-8 sm:py-12 md:py-16 lg:py-[117px] bg-white mt-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-[114px] py-8 sm:py-12 md:py-16 lg:py-[117px] space-y-6 sm:space-y-8 md:space-y-[50px] bg-white mt-8">
      
      {/* Overall Rating Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 pb-6 sm:pb-8 border-b border-[#EBEBEB]">
        <div className="w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A1A]">({formattedOverallScore})</h2>
            <span className="text-[14px] sm:text-[15px] text-[#333333] font-medium">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className="text-[#FFC400] text-[16px] sm:text-[18px]" />
            ))}
            <span 
              onClick={() => router.push('/reviews/submit')}
              className="text-[14px] sm:text-[15px] text-[#0088FF] ml-2 cursor-pointer hover:underline"
            >
              Write a review
            </span>
          </div>
        </div>
        <button 
          onClick={() => router.push('/hotel')}
          className="w-full sm:w-auto bg-transparent border border-[#1D69F9] text-[#1D69F9] font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1D69F9] hover:text-white transition-colors"
        >
          Check Availability
        </button>
      </div>

      {/* Categories Section */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <h3 className="text-[20px] sm:text-[22px] md:text-[24px] font-semibold text-[#3F3F3F]">Categories:</h3>
        {hasCategoryRatings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 md:gap-x-12 gap-y-4 sm:gap-y-6">
            {ratingCategories.map((category) => (
              <div key={category.label} className="space-y-1">
                <span className="text-[13px] sm:text-[14px] text-[#1A1A1A]">{category.label}</span>
                <div className="w-full bg-[#EBEBEB] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#3F8406] h-full rounded-full" 
                    style={{ width: `${Math.min(100, (category.score / 10) * 100)}%` }}
                  ></div>
                </div>
                <span className="text-[11px] sm:text-[12px] text-[#636363] font-medium">{category.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Category ratings will appear once guests start rating specific aspects of their stay.</p>
        )}
      </div>

      {/* Guest Reviews Section */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] sm:text-[22px] md:text-[24px] font-semibold text-[#3F3F3F]">Hear from Our Guests</h3>
          {reviews.length > reviewsPerPage && (
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        {displayedReviews.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {displayedReviews.map((review) => (
                <ReviewCard 
                  key={review.id}
                  avatarUrl={review.avatarUrl}
                  flagUrl={review.flagUrl}
                  name={review.name}
                  country={review.country}
                  type={review.type}
                  review={review.review}
                  rating={review.rating}
                />
              ))}
            </div>
            
            {/* Pagination and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EBEBEB]">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-[4px] text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  {startIndex + 1}-{Math.min(endIndex, reviews.length)} of {reviews.length}
                </span>
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-[4px] text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Next
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => router.push('/reviews/submit')}
                  className="bg-white border border-[#1D69F9] text-[#1D69F9] font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1D69F9] hover:text-white transition-colors"
                >
                  Write a review
                </button>
                <button 
                  onClick={() => router.push('/reviews')}
                  className="bg-[#1D69F9] text-white font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1a5ae0] transition-colors"
                >
                  View all reviews ({reviews.length})
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No reviews yet. Be the first to share your experience!</p>
            <button 
              onClick={() => router.push('/reviews/submit')}
              className="bg-[#1D69F9] text-white font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1a5ae0] transition-colors"
            >
              Write the first review
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestReviewsSection;