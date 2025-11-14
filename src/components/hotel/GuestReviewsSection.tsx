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
  <div className="bg-white rounded-[4px] border border-[#EBEBEB] p-6 flex flex-col justify-between h-full">
    <div>
      <div className="flex items-center gap-3 mb-4">
        <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
        <div>
          <h4 className="text-[15px] font-semibold text-[#1A1A1A]">{name} - <span className="font-normal">{type}</span></h4>
          <div className="flex items-center gap-1 mt-1">
            <img src={flagUrl} alt={country} className="w-5 h-3 object-cover border border-gray-200" />
            <span className="text-[13px] text-[#636363]">{country}</span>
          </div>
        </div>
      </div>
      <p className="text-[14px] text-[#3A3A3A] leading-[1.6] italic">&quot;{review}&quot;</p>
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
    <div className="px-[114px] py-[117px] space-y-[50px] bg-white mt-8">
      
      {/* Overall Rating Section */}
      <div className="flex justify-between items-center pb-8 border-b border-[#EBEBEB]">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-[32px] font-bold text-[#1A1A1A]">(8.7)</h2>
            <span className="text-[15px] text-[#333333] font-medium">500 ratings & 106 reviews</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} className="text-[#FFC400] text-[18px]" />
            ))}
            <span className="text-[15px] text-[#0088FF] ml-2 cursor-pointer hover:underline">View all</span>
          </div>
        </div>
        <button className="bg-transparent border border-[#1D69F9] text-[#1D69F9] font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1D69F9] hover:text-white transition-colors">
          Check Availability
        </button>
      </div>

      {/* Categories Section */}
      <div className="space-y-8">
        <h3 className="text-[24px] font-semibold text-[#3F3F3F]">Categories:</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-6">
          {ratingCategories.map((category) => (
            <div key={category.label} className="space-y-1">
              <span className="text-[14px] text-[#1A1A1A]">{category.label}</span>
              <div className="w-full bg-[#EBEBEB] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#3F8406] h-full rounded-full" 
                  style={{ width: `${Math.min(100, (category.score / 10) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[12px] text-[#636363] font-medium">{category.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Guest Reviews Section */}
      <div className="space-y-8">
        <h3 className="text-[24px] font-semibold text-[#3F3F3F]">Hear from Our Guests</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {guestReviews.map((review, index) => (
            <ReviewCard key={index} {...review} />
          ))}
        </div>
        <div className="flex justify-start pt-4">
          <button className="bg-white border border-[#1D69F9] text-[#1D69F9] font-medium py-[10px] px-6 rounded-[4px] hover:bg-[#1D69F9] hover:text-white transition-colors">
            Read all reviews
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestReviewsSection;