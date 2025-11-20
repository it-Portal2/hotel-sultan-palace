'use client';


import { FaStar } from 'react-icons/fa';

interface ReviewCardProps {
  avatarUrl: string;
  flagUrl: string;
  name: string;
  country: string;
  type: string;
  review: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ avatarUrl, flagUrl, name, country, type, review }) => (
  <div className="bg-white rounded-[4px] border border-[#EBEBEB] p-4 sm:p-6 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center gap-3 mb-3 sm:mb-4">
        <img src={avatarUrl} alt={name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#1A1A1A] break-words">{name} - <span className="font-normal">{type}</span></h4>
          <div className="flex items-center gap-1 mt-1">
            <img src={flagUrl} alt={country} className="w-5 h-3 object-cover border border-gray-200 flex-shrink-0" />
            <span className="text-[12px] sm:text-[13px] text-[#636363] truncate">{country}</span>
          </div>
        </div>
      </div>
      <p className="text-[13px] sm:text-[14px] text-[#3A3A3A] leading-[1.6] italic">&quot;{review}&quot;</p>
    </div>
  </div>
);

const GuestReviewsSection: React.FC = () => {
  const ratingCategories = [
    { label: 'Staff+', score: 9.2 },
    { label: 'Facilities', score: 9.2 },
    { label: 'Cleanliness', score: 8.9 },
    { label: 'Comfort', score: 9.3 },
    { label: 'Value for money', score: 9.2 },
    { label: 'Location', score: 8.8 },
    { label: 'Free WiFi', score: 9.0 },
  ];

  const guestReviews: ReviewCardProps[] = [
    {
      avatarUrl: "https://placehold.co/100x100/A3E635/FFFFFF?text=Renee",
      flagUrl: "https://placehold.co/100x100/F0F0F0/000000?text=AE",
      name: "Renee",
      country: "United Arab Emirates",
      type: "Solo traveller",
      review: "Very isolated, peaceful, serene, and quiet. The staff was exceptional. I didn't get everyone's name (apologies) but Angel and Pradeep and his wife were just lovely, always attentive and made sure I was looked after."
    },
    {
      avatarUrl: "https://placehold.co/100x100/FACC15/FFFFFF?text=Shlomi",
      flagUrl: "https://placehold.co/100x100/000000/FFFFFF?text=IL",
      name: "Shlomi",
      country: "Israel",
      type: "Family",
      review: "Superb location! A beautiful and quiet beach. Perfect for spending lazy days on the beach * Very spacious rooms * Wonderful staff!"
    },
    {
      avatarUrl: "https://placehold.co/100x100/FB923C/FFFFFF?text=Nakundwa",
      flagUrl: "https://placehold.co/100x100/F0F0F0/000000?text=ZA",
      name: "Nakundwa",
      country: "South Africa",
      type: "Family",
      review: "The space : a few bungalows over a very big property The quietness : no disturbance from outside The very nice beach ; very well maintained The excellent breakfast : a lot of variety The staff : charming very caring, always present to help And many other things : it is close to heaven on earth"
    },
  ];

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-[114px] py-8 sm:py-12 md:py-16 lg:py-[117px] space-y-6 sm:space-y-8 md:space-y-[50px] bg-white mt-8">
      
      {/* Overall Rating Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 pb-6 sm:pb-8 border-b border-[#EBEBEB]">
        <div className="w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
            <h2 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A1A]">(8.7)</h2>
            <span className="text-[14px] sm:text-[15px] text-[#333333] font-medium">500 ratings & 106 reviews</span>
          </div>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className="text-[#FFC400] text-[16px] sm:text-[18px]" />
            ))}
            <span className="text-[14px] sm:text-[15px] text-[#0088FF] ml-2 cursor-pointer hover:underline">View all</span>
          </div>
        </div>
        <button className="w-full sm:w-auto bg-transparent border border-[#1D69F9] text-[#1D69F9] font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1D69F9] hover:text-white transition-colors">
          Check Availability
        </button>
      </div>

      {/* Categories Section */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <h3 className="text-[20px] sm:text-[22px] md:text-[24px] font-semibold text-[#3F3F3F]">Categories:</h3>
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
              <span className="text-[11px] sm:text-[12px] text-[#636363] font-medium">{category.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guest Reviews Section */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <h3 className="text-[20px] sm:text-[22px] md:text-[24px] font-semibold text-[#3F3F3F]">Hear from Our Guests</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {guestReviews.map((review, index) => (
            <ReviewCard key={index} {...review} />
          ))}
        </div>
        <div className="flex justify-center sm:justify-start pt-2 sm:pt-4">
          <button className="w-full sm:w-auto bg-white border border-[#1D69F9] text-[#1D69F9] font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1D69F9] hover:text-white transition-colors">
            Read all reviews
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestReviewsSection;