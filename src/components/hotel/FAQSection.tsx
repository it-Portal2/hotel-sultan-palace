import React, { useState } from 'react';
import { MdAdd as AddIcon, MdRemove as RemoveIcon, MdQuestionAnswer as QuestionIcon } from 'react-icons/md';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    question: 'Do they serve breakfast?',
    answer: 'Yes, breakfast is served daily from 07:30 to 10:00. Guests can choose between buffet and à la carte options.',
  },
  {
    question: 'Are there rooms with a balcony?',
    answer: 'Yes, all rooms and suites at Sultan Palace Zanzibar feature a private balcony or terrace.',
  },
  {
    question: 'Is the swimming pool open?',
    answer: 'Yes, the infinity swimming pool overlooking the ocean is open to guests year-round. There is also a separate children\'s pool.',
  },
  {
    question: 'Can I park there?',
    answer: 'Yes, free private parking is available on-site, and reservation is not needed.',
  },
  {
    question: 'Is the restaurant open?',
    answer: 'Yes, the main restaurant serves lunch and dinner daily, offering international, local, and various specialty cuisines.',
  },
  {
    question: 'How and when do I pay?',
    answer: 'The property accepts Mastercard, Visa, and cash payments. Payment is typically made at the property, and in many cases, no prepayment is needed (depending on the booking policy).',
  },
  {
    question: 'What restaurants, attractions, and public transport options are nearby?',
    answer: (
      <ul className="list-disc ml-5 space-y-2 text-sm text-[#4B4B4B]">
        <li>**Restaurants:** Door Restaurant (450m), The Rock Restaurant Zanzibar (3 km).</li>
        <li>**Attractions:** Michamvi Pingwe Beach (steps away), Jozani Forest (21 km).</li>
        <li>**Transport:** Airport shuttle service is available (additional charge).</li>
      </ul>
    ),
  },
  {
    question: 'Is there a spa?',
    answer: 'Yes, the hotel features spa facilities for relaxation and rejuvenation.',
  },
  {
    question: 'What are the check-in and check-out times?',
    answer: 'Check-in starts at 15:00, and check-out is between 11:00 and 12:00.',
  },
  {
    question: 'Are there rooms with a hot tub?',
    answer: 'While rooms may not have individual hot tubs, the spa facilities are available for guest use.',
  },
];

const FAQItemComponent: React.FC<{ item: FAQItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-300 py-4">
      <button
        className="flex justify-between items-center w-full text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-[#2B2B2B]">{item.question}</span>
        {isOpen ? (
          <RemoveIcon className="text-xl text-[#1D69F9]" />
        ) : (
          <AddIcon className="text-xl text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 text-[15px] text-[#4B4B4B] leading-relaxed pr-8 transition-all duration-300 ease-in-out">
          {item.answer}
        </div>
      )}
    </div>
  );
};

export default function FAQSection({ onContactClick }: { onContactClick?: () => void }) {
  return (
    <div className="bg-white rounded-[2px] mt-[40px]">
      <div className="max-w-[1600px] mx-auto px-[24px] md:px-[32px] lg:px-[114px] py-[117px] space-y-[40px]">
        <h2 className="text-[28px] font-semibold text-[#2B2B2B]">Frequently Asked Questions</h2>
        <p className="text-[15px] text-[#4B4B4B] leading-relaxed max-w-[780px]">
          Find quick answers to common questions about your stay at Sultan Palace Zanzibar.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-[70px]">
          <div className="lg:col-span-2 space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[40px]">
              {/* First half of FAQs */}
              {faqs.slice(0, 5).map((item, index) => (
                <FAQItemComponent key={index} item={item} />
              ))}
              {/* Second half of FAQs */}
              {faqs.slice(5).map((item, index) => (
                <FAQItemComponent key={index} item={item} />
              ))}
            </div>
          </div>

          {/* Connect Us Card */}
          <div className="hidden lg:block lg:col-span-1 border border-gray-200 rounded-lg p-6 h-fit mt-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <QuestionIcon className="text-4xl text-[#1D69F9]" />
              <h3 className="text-lg font-semibold text-[#2B2B2B]">Have a question?</h3>
              <p className="text-sm text-[#4B4B4B]">
                Can&apos;t find the answer you&apos;re looking for? Reach out to our customer support team.
              </p>
              <button onClick={onContactClick} className="w-full py-2 border border-[#1D69F9] text-[#1D69F9] rounded-md font-medium hover:bg-blue-50 transition-colors">
                Connect Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}