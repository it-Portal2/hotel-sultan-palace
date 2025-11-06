"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MdPerson, MdAlternateEmail, MdPhone, MdLanguage, MdMessage, MdClose } from "react-icons/md";
import { createBookingEnquiry } from "@/lib/firestoreService";

interface BookingEnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingEnquiryModal({ isOpen, onClose }: BookingEnquiryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    message: ''
  });
  const [errors, setErrors] = useState<{name?:string; email?:string; phone?:string; message?:string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: {name?:string; email?:string; phone?:string; message?:string} = {};
    if (!formData.name.trim()) nextErrors.name = 'Required';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = 'Valid email required';
    if (!formData.phone.trim()) nextErrors.phone = 'Required';
    if (!formData.message.trim()) nextErrors.message = 'Required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      console.log('BookingEnquiryModal: Submitting booking enquiry form');
      const enquiryData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim() || undefined,
        message: formData.message.trim()
      };
      console.log('BookingEnquiryModal: Data to save:', enquiryData);
      const result = await createBookingEnquiry(enquiryData);
      console.log('BookingEnquiryModal: Result from createBookingEnquiry:', result);
      if (result) {
        console.log('BookingEnquiryModal: Success! Saved to bookingEnquiries collection');
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', website: '', message: '' });
        setTimeout(() => {
          setSubmitStatus('idle');
          onClose();
        }, 2000);
      } else {
        console.error('BookingEnquiryModal: Failed to save - result is null');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('BookingEnquiryModal: Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', email: '', phone: '', website: '', message: '' });
      setErrors({});
      setSubmitStatus('idle');
      onClose();
    }
  };

  if (!isMounted || !isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-[#2C2B28] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#2C2B28] border-b border-white/20 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-kaisei text-sm md:text-base text-[#BE8C53]">Booking Enquiry</p>
            <h2 className="mt-1 font-kaisei font-bold text-xl sm:text-2xl text-white">Get In Touch</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border ${errors.name ? 'border-red-400' : 'border-white'} rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]`} 
                placeholder="Your name" 
              />
              <MdPerson className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-lg pointer-events-none" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="relative">
              <input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className={`w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border ${errors.email ? 'border-red-400' : 'border-white'} rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]`} 
                placeholder="Enter email" 
              />
              <MdAlternateEmail className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-lg pointer-events-none" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="relative">
              <input 
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className={`w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border ${errors.phone ? 'border-red-400' : 'border-white'} rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]`} 
                placeholder="Phone No." 
              />
              <MdPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-lg pointer-events-none" />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div className="relative">
              <input 
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border border-white rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53]" 
                placeholder="Website" 
              />
              <MdLanguage className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-lg pointer-events-none" />
            </div>
          </div>
          <div className="relative">
            <textarea 
              rows={5}
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              className={`w-full bg-[#2C2B26] text-sm text-white/80 placeholder-white/80 border ${errors.message ? 'border-red-400' : 'border-white'} rounded-md py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#BE8C53] resize-none`} 
              placeholder="Message" 
            />
            <MdMessage className="absolute right-3 top-4 text-white/50 text-lg pointer-events-none" />
            {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
          </div>
          <div className="space-y-2 pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#BE8C53] hover:bg-[#A67948] text-white font-kaisei py-3 tracking-wider text-sm md:text-base rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
            {submitStatus === 'success' && (
              <p className="text-green-400 text-sm text-center">✓ Message sent successfully!</p>
            )}
            {submitStatus === 'error' && (
              <p className="text-red-400 text-sm text-center">✗ Error sending message. Please try again.</p>
            )}
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

