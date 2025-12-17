"use client";

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface EmailReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientEmail: string;
    initialSubject?: string;
    onSend: (subject: string, message: string) => Promise<boolean>;
}

export default function EmailReplyModal({
    isOpen,
    onClose,
    recipientName,
    recipientEmail,
    initialSubject = '',
    onSend
}: EmailReplyModalProps) {
    const [subject, setSubject] = useState(initialSubject);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens with new data
    useEffect(() => {
        if (isOpen) {
            setSubject(initialSubject);
            setMessage('');
            setError(null);
            setIsSending(false);
        }
    }, [isOpen, initialSubject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const success = await onSend(subject, message);
            if (success) {
                onClose();
            } else {
                setError('Failed to send email. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* The backdrop, rendered as a fixed sibling to the panel container */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            {/* Full-screen scrollable container */}
            <div className="fixed inset-0 w-screen overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <Dialog.Title className="text-lg font-semibold text-gray-900">
                                Reply to {recipientName}
                            </Dialog.Title>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* To Field (Read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="text"
                                    value={`${recipientName} <${recipientEmail}>`}
                                    disabled
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm focus:outline-none cursor-not-allowed"
                                />
                            </div>

                            {/* Subject Field */}
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all"
                                    placeholder="Re: Inquiry..."
                                />
                            </div>

                            {/* Message Field */}
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={8}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all resize-none"
                                    placeholder="Type your reply here..."
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    This message will be sent using the official Hotel Sultan Palace email template.
                                </p>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF6A00] rounded-lg hover:bg-[#e55f00] focus:outline-none focus:ring-2 focus:ring-[#FF6A00]/50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="h-4 w-4" />
                                            Send Reply
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}
