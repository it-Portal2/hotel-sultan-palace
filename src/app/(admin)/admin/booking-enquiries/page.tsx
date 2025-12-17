"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAllBookingEnquiries, updateBookingEnquiryStatus, BookingEnquiry } from '@/lib/firestoreService';
import { MagnifyingGlassIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import EmailReplyModal from '@/components/admin/EmailReplyModal';

export default function AdminBookingEnquiriesPage() {
  const [items, setItems] = useState<BookingEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');

  // Email Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<BookingEnquiry | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getAllBookingEnquiries();
      setItems(data);
      setLoading(false);
    })();
  }, []);

  const setStatus = async (id: string, status: BookingEnquiry['status']) => {
    setUpdating(id);
    const ok = await updateBookingEnquiryStatus(id, status);
    if (ok) setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    setUpdating(null);
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.phone.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q) ||
        (i.website && i.website.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [items, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      new: items.filter(i => i.status === 'new').length,
      read: items.filter(i => i.status === 'read').length,
      replied: items.filter(i => i.status === 'replied').length,
    };
  }, [items]);

  const openReplyModal = (enquiry: BookingEnquiry) => {
    setSelectedEnquiry(enquiry);
    setReplyModalOpen(true);
  };

  const handleSendReply = async (subject: string, message: string): Promise<boolean> => {
    if (!selectedEnquiry) return false;

    try {
      const response = await fetch('/api/email/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedEnquiry.email,
          subject,
          message,
          referenceId: selectedEnquiry.id,
          type: 'booking',
          recipientName: selectedEnquiry.name
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state to show as replied
        setItems(prev => prev.map(i => i.id === selectedEnquiry.id ? { ...i, status: 'replied' } : i));
        return true;
      } else {
        console.error(data.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6A00]"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8">
      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Booking Enquiries</h1>
          <p className="text-sm text-gray-500 mt-1">Leads from booking enquiry form • {currentDate}</p>
        </div>

        {/* Inline Stats - No boxes */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">New:</span>
            <span className="font-semibold text-gray-900">{stats.new}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Read:</span>
            <span className="font-semibold text-gray-900">{stats.read}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Replied:</span>
            <span className="font-semibold text-gray-900">{stats.replied}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar - Same style */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, message..."
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'all'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'new'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              New
            </button>
            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'read'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Read
            </button>
            <button
              onClick={() => setStatusFilter('replied')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'replied'
                ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Replied
            </button>
          </div>
        </div>
      </div>

      {/* Clean Table - No heavy boxes */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <EnvelopeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No enquiries found</p>
          <p className="text-lg font-medium text-gray-600">No enquiries found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{i.name}</div>
                      {i.website && (
                        <a
                          href={i.website.startsWith('http') ? i.website : `https://${i.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-[#FF6A00] block mt-1 truncate max-w-[150px]"
                        >
                          {i.website}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <a href={`mailto:${i.email}`} className="text-sm text-[#FF6A00] hover:underline flex items-center gap-1">
                          <EnvelopeIcon className="h-3 w-3" /> {i.email}
                        </a>
                        <div className="text-xs text-gray-500">{i.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 col-span-2">
                      <div className="text-sm text-gray-700 min-w-[300px] max-w-lg whitespace-pre-wrap">{i.message}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={i.status}
                        onChange={(e) => setStatus(i.id, e.target.value as BookingEnquiry['status'])}
                        disabled={updating === i.id}
                        className={`text-sm border-b-2 bg-transparent focus:outline-none focus:border-[#FF6A00] disabled:opacity-50 cursor-pointer py-1 ${i.status === 'new' ? 'border-blue-200 text-blue-700' :
                          i.status === 'read' ? 'border-yellow-200 text-yellow-700' :
                            'border-green-200 text-green-700'
                          }`}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openReplyModal(i)}
                        className="text-sm font-medium text-[#FF6A00] hover:text-[#e55f00] hover:underline"
                      >
                        Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedEnquiry && (
        <EmailReplyModal
          isOpen={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          recipientName={selectedEnquiry.name}
          recipientEmail={selectedEnquiry.email}
          initialSubject={`Re: Booking Inquiry from ${selectedEnquiry.name}`}
          onSend={handleSendReply}
        />
      )}
    </div>
  );
}
