"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getAllContactForms, updateContactFormStatus, ContactForm } from '@/lib/firestoreService';
import { MagnifyingGlassIcon, EnvelopeIcon, FunnelIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAdminRole } from '@/context/AdminRoleContext';
import EmailReplyModal from '@/components/admin/EmailReplyModal';

export default function AdminContactsPage() {
  const { isReadOnly } = useAdminRole();
  const [forms, setForms] = useState<ContactForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'read' | 'replied'>('all');
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Email Reply Modal State
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getAllContactForms();
        setForms(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredForms = useMemo(() => {
    let result = forms;

    if (filterStatus !== 'all') {
      result = result.filter(f => f.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        (f.subject || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [forms, filterStatus, searchQuery]);

  // Determine stats
  const stats = useMemo(() => {
    return {
      total: forms.length,
      new: forms.filter(f => f.status === 'new').length,
      pending: forms.filter(f => f.status === 'read').length
    };
  }, [forms]);

  const handleStatusChange = async (id: string, newStatus: 'new' | 'read' | 'replied') => {
    if (isReadOnly) return;
    const ok = await updateContactFormStatus(id, newStatus);
    if (ok) {
      setForms(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    }
  };

  const openReplyModal = (form: ContactForm) => {
    if (isReadOnly) return;
    setSelectedForm(form);
    setReplyModalOpen(true);
  };

  const handleSendReply = async (subject: string, message: string): Promise<boolean> => {
    if (!selectedForm) return false;

    try {
      const response = await fetch('/api/email/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedForm.email,
          subject,
          message,
          referenceId: selectedForm.id,
          type: 'contact',
          recipientName: selectedForm.name
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state to show as replied
        setForms(prev => prev.map(f => f.id === selectedForm.id ? { ...f, status: 'replied' } : f));
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

  if (loading) return <div className="flex justify-center items-center h-64"><div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" /></div>;

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage customer messages and support requests • {currentDate}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Inquiries</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="h-10 w-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400"><EnvelopeIcon className="h-6 w-6" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">New Messages</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.new}</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 relative z-10"><SparklesIcon className="h-6 w-6" /></div>
          <div className="absolute right-0 bottom-0 opacity-10"><SparklesIcon className="h-24 w-24 text-blue-500 transform translate-x-4 translate-y-4" /></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Review</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
          </div>
          <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center text-[#FF6A00]"><ClockIcon className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 sticky top-0 z-10 bg-[#fafafa]/95 backdrop-blur-sm py-4 -my-4 border-b border-gray-100/50">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 bg-white transition-all outline-none text-sm placeholder:text-gray-400 SHADOW-SM"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['all', 'new', 'read', 'replied'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${filterStatus === status
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredForms.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <EnvelopeIcon className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No inquiries found</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              {searchQuery ? "We couldn't find any messages matching your search." : "No inquiries have been received yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sender</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredForms.map((form) => {
                  const isExpanded = viewingId === form.id;

                  return (
                    <React.Fragment key={form.id}>
                      <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50 hover:bg-blue-50/50' : ''}`} onClick={() => setViewingId(isExpanded ? null : form.id)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-semibold border border-gray-200">
                                {form.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{form.name}</div>
                              <div className="text-xs text-gray-500">{form.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">{form.subject}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{form.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900">{new Date(form.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">{new Date(form.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${form.status === 'new' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            form.status === 'read' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            }`}>
                            {form.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>}
                            {form.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={form.status}
                            onChange={(e) => handleStatusChange(form.id, e.target.value as any)}
                            disabled={isReadOnly}
                            className={`text-xs rounded-lg border-gray-300 py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                          </select>
                        </td>
                      </tr>
                      {/* Expanded Details View */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={5} className="px-6 py-6 sm:px-12">
                            <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6 relative">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Message Details</h4>
                              <div className="prose prose-sm max-w-none text-gray-700">
                                <p className="whitespace-pre-wrap leading-relaxed">{form.message}</p>
                              </div>
                              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                  onClick={() => openReplyModal(form)}
                                  disabled={isReadOnly}
                                  className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6A00] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <EnvelopeIcon className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
                                  Reply via Email
                                </button>
                                {form.status !== 'replied' && !isReadOnly && (
                                  <button
                                    onClick={() => handleStatusChange(form.id, 'replied')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Mark as Replied
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedForm && (
        <EmailReplyModal
          isOpen={replyModalOpen}
          onClose={() => setReplyModalOpen(false)}
          recipientName={selectedForm.name}
          recipientEmail={selectedForm.email}
          initialSubject={`Re: ${selectedForm.subject}`}
          onSend={handleSendReply}
        />
      )}
    </div>
  );
}
