"use client";
import React, { useState } from 'react';
import { createContactForm } from '@/lib/firestoreService';

interface ContactFormProps {
    onSuccess?: () => void;
    className?: string;
}

export default function ContactForm({ onSuccess, className = "" }: ContactFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; message?: string }>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation
        const nextErrors: { name?: string; phone?: string; email?: string; message?: string } = {};
        if (!formData.name.trim()) nextErrors.name = 'Required';
        if (!formData.phone.trim()) nextErrors.phone = 'Required';
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = 'Valid email required';
        if (!formData.message.trim()) nextErrors.message = 'Required';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const result = await createContactForm({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                subject: 'Website Inquiry',
                message: formData.message
            });

            if (result) {
                setSubmitStatus('success');
                // Reset form after successful submission
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    message: ''
                });

                // Hide success message after 5 seconds
                setTimeout(() => setSubmitStatus('idle'), 5000);

                // Trigger onSuccess callback if provided
                if (onSuccess) {
                    setTimeout(onSuccess, 2000); // Wait a bit to show success message before closing/redirecting
                }
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 sm:space-y-6 ${className}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-[83px]">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-[17px]">
                    {/* Name Field */}
                    <div className="space-y-1 sm:space-y-[-1px]">
                        <label className="text-white text-[12px] sm:text-[14px] font-medium leading-[1.8] sm:leading-[2.07] block font-['Kaisei_Decol']">
                            Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className={`w-full h-8 sm:h-8 bg-white/8 border ${errors.name ? 'border-red-400' : 'border-white'} rounded-[5px] px-3 text-white placeholder-white/50 focus:outline-none focus:border-orange-400`}
                            placeholder=""
                        />
                        {errors.name && <p className="text-red-300 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-1 sm:space-y-[-1px]" style={{ transitionDelay: '0.1s' }}>
                        <label className="text-white text-[12px] sm:text-[14px] font-medium leading-[1.8] sm:leading-[2.07] block font-['Kaisei_Decol']">
                            Phone No.
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className={`w-full h-8 sm:h-8 bg-white/8 border ${errors.phone ? 'border-red-400' : 'border-white'} rounded-[5px] px-3 text-white placeholder-white/50 focus:outline-none focus:border-orange-400`}
                            placeholder=""
                        />
                        {errors.phone && <p className="text-red-300 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-1 sm:space-y-[-1px]" style={{ transitionDelay: '0.2s' }}>
                        <label className="text-white text-[12px] sm:text-[14px] font-medium leading-[1.8] sm:leading-[2.07] block font-['Kaisei_Decol']">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className={`w-full h-8 sm:h-8 bg-white/8 border ${errors.email ? 'border-red-400' : 'border-white'} rounded-[5px] px-3 text-white placeholder-white/50 focus:outline-none focus:border-orange-400`}
                            placeholder=""
                        />
                        {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-[14px]">
                    {/* Message Field */}
                    <div className="space-y-1 sm:space-y-[-1px]" style={{ transitionDelay: '0.3s' }}>
                        <label className="text-white text-[12px] sm:text-[14px] font-medium leading-[1.8] sm:leading-[2.07] block font-['Kaisei_Decol']">
                            Message
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            rows={3}
                            required
                            className={`w-full h-[80px] sm:h-[100px] lg:h-[119px] bg-white/8 border ${errors.message ? 'border-red-400' : 'border-white'} rounded-[5px] px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-orange-400 resize-none`}
                            placeholder=""
                        />
                        {errors.message && <p className="text-red-300 text-xs mt-1">{errors.message}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="" style={{ transitionDelay: '0.4s' }}>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-[35px] sm:h-[39px] bg-[#F96406] text-white text-[12px] sm:text-[14px] font-medium rounded-[5px] hover:bg-[#E55A05] transition-colors font-['Kaisei_Decol'] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
                        </button>
                    </div>

                    {/* Success/Error Messages */}
                    {submitStatus === 'success' && (
                        <div className="text-green-400 text-sm font-medium">
                            ✓ Your message has been sent successfully!
                        </div>
                    )}
                    {submitStatus === 'error' && (
                        <div className="text-red-400 text-sm font-medium">
                            ✗ Something went wrong. Please try again.
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
