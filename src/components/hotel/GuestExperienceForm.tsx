'use client';

import React, { useState } from 'react';
import { createGuestExperienceForm, type GuestExperienceForm as GuestExperienceFormType } from '@/lib/firestoreService';

interface RatingOption {
  value: number;
  label: string;
}

const ratingOptions: RatingOption[] = [
  { value: 1, label: 'N/A' },
  { value: 2, label: 'Below Expectation' },
  { value: 3, label: 'Met Expectation' },
  { value: 4, label: 'Excellent' },
];

interface FormData {
  name: string;
  email: string;
  suiteNo: string;
  arrivalDate: string;
  departureDate: string;
  reservationInformative?: number;
  reservationPrompt?: number;
  checkInEfficient?: number;
  checkInWelcoming?: number;
  barService?: number;
  waiterService?: number;
  breakfastExperience?: number;
  lunchExperience?: number;
  dinnerExperience?: number;
  loungeArea?: number;
  roomExperience?: number;
  roomCleanliness?: number;
  memorableMoment: string;
  otherComments: string;
  wouldRecommend: boolean | null;
}

// Rating Field Component
const RatingField: React.FC<{ label: string; value?: number; onChange: (value: number) => void; required?: boolean }> = ({ label, value, onChange, required = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex flex-wrap gap-3">
      {ratingOptions.map((option) => (
        <label
          key={option.value}
          className={`flex items-center gap-2 px-4 py-2 border-2 rounded-md cursor-pointer transition-colors ${
            value === option.value
              ? 'border-[#1D69F9] bg-[#1D69F9]/10'
              : 'border-gray-300 hover:border-[#1D69F9]/50'
          }`}
        >
          <input
            type="radio"
            name={label}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
            required={required}
          />
          <span className="text-sm font-medium">{option.value}</span>
          <span className="text-xs text-gray-600">({option.label})</span>
        </label>
      ))}
    </div>
  </div>
);

const GuestExperienceForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    suiteNo: '',
    arrivalDate: '',
    departureDate: '',
    memorableMoment: '',
    otherComments: '',
    wouldRecommend: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRatingChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name || !formData.suiteNo || !formData.arrivalDate || !formData.departureDate) {
      setError('Please fill in all required fields (Name, Suite No., Arrival Date, Departure Date)');
      return;
    }

    if (formData.wouldRecommend === null) {
      setError('Please indicate if you would recommend us to a friend');
      return;
    }

    setSubmitting(true);

    try {
      // Build form data object, only including defined values
      const formDataToSubmit: Omit<GuestExperienceFormType, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        name: formData.name,
        suiteNo: formData.suiteNo,
        arrivalDate: formData.arrivalDate,
        departureDate: formData.departureDate,
        wouldRecommend: formData.wouldRecommend,
      };

      // Only add optional fields if they have values
      if (formData.email) formDataToSubmit.email = formData.email;
      if (formData.reservationInformative) formDataToSubmit.reservationInformative = formData.reservationInformative;
      if (formData.reservationPrompt) formDataToSubmit.reservationPrompt = formData.reservationPrompt;
      if (formData.checkInEfficient) formDataToSubmit.checkInEfficient = formData.checkInEfficient;
      if (formData.checkInWelcoming) formDataToSubmit.checkInWelcoming = formData.checkInWelcoming;
      if (formData.barService) formDataToSubmit.barService = formData.barService;
      if (formData.waiterService) formDataToSubmit.waiterService = formData.waiterService;
      if (formData.breakfastExperience) formDataToSubmit.breakfastExperience = formData.breakfastExperience;
      if (formData.lunchExperience) formDataToSubmit.lunchExperience = formData.lunchExperience;
      if (formData.dinnerExperience) formDataToSubmit.dinnerExperience = formData.dinnerExperience;
      if (formData.loungeArea) formDataToSubmit.loungeArea = formData.loungeArea;
      if (formData.roomExperience) formDataToSubmit.roomExperience = formData.roomExperience;
      if (formData.roomCleanliness) formDataToSubmit.roomCleanliness = formData.roomCleanliness;
      if (formData.memorableMoment) formDataToSubmit.memorableMoment = formData.memorableMoment;
      if (formData.otherComments) formDataToSubmit.otherComments = formData.otherComments;

      const result = await createGuestExperienceForm(formDataToSubmit);

      if (result) {
        setSubmitted(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          suiteNo: '',
          arrivalDate: '',
          departureDate: '',
          memorableMoment: '',
          otherComments: '',
          wouldRecommend: null,
        });
      } else {
        setError('Failed to submit form. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your feedback has been submitted successfully. We appreciate your time!</p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-[#1D69F9] text-white px-6 py-2 rounded-md hover:bg-[#1a5ae0] transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-10">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Sultan Palace Guest Experience Card</h1>
            <p className="text-sm md:text-base text-gray-600 mt-2">Your feedback helps us improve</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Guest Information */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Guest Information</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suite No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.suiteNo}
                  onChange={(e) => handleInputChange('suiteNo', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Rating Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Rating Scale:</strong> Enter score 1 for N/A, score 2 for Below Expectation, score 3 for Met Expectation, and score 4 for Excellent (or Exceed Expectation).
            </p>
          </div>

          {/* Reservation Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Reservation</h2>
            <RatingField
              label="How informative & courteous was the reservation team?"
              value={formData.reservationInformative}
              onChange={(value) => handleRatingChange('reservationInformative', value)}
            />
            <RatingField
              label="Was your booking completed in a prompt manner?"
              value={formData.reservationPrompt}
              onChange={(value) => handleRatingChange('reservationPrompt', value)}
              required
            />
          </div>

          {/* Check In Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Check In</h2>
            <RatingField
              label="How informative and efficient was your check in process?"
              value={formData.checkInEfficient}
              onChange={(value) => handleRatingChange('checkInEfficient', value)}
              required
            />
            <RatingField
              label="How warm and welcoming were the staff and management during your stay?"
              value={formData.checkInWelcoming}
              onChange={(value) => handleRatingChange('checkInWelcoming', value)}
              required
            />
          </div>

          {/* Service Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Service</h2>
            <RatingField
              label="How friendly and efficient was the bar service?"
              value={formData.barService}
              onChange={(value) => handleRatingChange('barService', value)}
              required
            />
            <RatingField
              label="How friendly and efficient was the waiter service?"
              value={formData.waiterService}
              onChange={(value) => handleRatingChange('waiterService', value)}
              required
            />
          </div>

          {/* Meal Experience Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Meal Experience</h2>
            <RatingField
              label="How would you rate your breakfast experience?"
              value={formData.breakfastExperience}
              onChange={(value) => handleRatingChange('breakfastExperience', value)}
              required
            />
            <RatingField
              label="How would you rate your lunch experience?"
              value={formData.lunchExperience}
              onChange={(value) => handleRatingChange('lunchExperience', value)}
              required
            />
            <RatingField
              label="How would you rate your dinner experience?"
              value={formData.dinnerExperience}
              onChange={(value) => handleRatingChange('dinnerExperience', value)}
              required
            />
          </div>

          {/* Main Area Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Main Area</h2>
            <RatingField
              label="How would you rate the comfort and style of the lounge area?"
              value={formData.loungeArea}
              onChange={(value) => handleRatingChange('loungeArea', value)}
              required
            />
          </div>

          {/* Room Experience Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Room Experience</h2>
            <RatingField
              label="How would you rate your in-room experience and comfort?"
              value={formData.roomExperience}
              onChange={(value) => handleRatingChange('roomExperience', value)}
              required
            />
            <RatingField
              label="How was the cleanliness of your room throughout your stay?"
              value={formData.roomCleanliness}
              onChange={(value) => handleRatingChange('roomCleanliness', value)}
              required
            />
          </div>

          {/* General Comments Section */}
          <div className="space-y-4 border-b pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">General Comments</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What was the most memorable moment of your stay with us? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.memorableMoment}
                onChange={(e) => handleInputChange('memorableMoment', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Any Other Comments? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.otherComments}
                onChange={(e) => handleInputChange('otherComments', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#1D69F9] focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Recommendation Section */}
          <div className="space-y-4 pb-6">
            <h2 className="text-xl font-semibold text-[#3F3F3F] mb-4">Recommendation</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you recommend us to a friend? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 px-6 py-3 border-2 rounded-md cursor-pointer transition-colors ${
                  formData.wouldRecommend === true
                    ? 'border-[#1D69F9] bg-[#1D69F9]/10'
                    : 'border-gray-300 hover:border-[#1D69F9]/50'
                }`}>
                  <input
                    type="radio"
                    name="recommend"
                    checked={formData.wouldRecommend === true}
                    onChange={() => handleInputChange('wouldRecommend', true)}
                    className="sr-only"
                    required
                  />
                  <span className="font-medium">Yes</span>
                </label>
                <label className={`flex items-center gap-2 px-6 py-3 border-2 rounded-md cursor-pointer transition-colors ${
                  formData.wouldRecommend === false
                    ? 'border-[#1D69F9] bg-[#1D69F9]/10'
                    : 'border-gray-300 hover:border-[#1D69F9]/50'
                }`}>
                  <input
                    type="radio"
                    name="recommend"
                    checked={formData.wouldRecommend === false}
                    onChange={() => handleInputChange('wouldRecommend', false)}
                    className="sr-only"
                    required
                  />
                  <span className="font-medium">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#1D69F9] text-white px-8 py-3 rounded-md font-medium hover:bg-[#1a5ae0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestExperienceForm;

