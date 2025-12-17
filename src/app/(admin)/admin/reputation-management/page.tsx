"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { StarIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { getAllGuestReviews, GuestReview, updateGuestReviewApproval, deleteGuestReview } from '@/lib/firestoreService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import { useAdminRole } from '@/context/AdminRoleContext';

type FilterStatus = 'all' | 'approved' | 'pending';
type FilterRating = 'all' | '5' | '4' | '3' | '2' | '1';

export default function ReputationManagementPage() {
  const { isReadOnly } = useAdminRole();
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<FilterRating>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getAllGuestReviews(false); // Get all reviews, not just approved
        setReviews(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Format date for search
  const formatDateForSearch = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Check if search query matches a date format
  const isDateQuery = (query: string): boolean => {
    // Check for common date formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const datePatterns = [
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{2}\.\d{2}\.\d{4}$/,
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      /^\d{1,2}-\d{1,2}-\d{4}$/,
    ];
    return datePatterns.some(pattern => pattern.test(query.trim()));
  };

  // Filter reviews based on search, status, and rating
  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Filter by status
    if (statusFilter === 'approved') {
      filtered = filtered.filter(r => r.isApproved);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(r => !r.isApproved);
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(r => r.rating === rating);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const isDate = isDateQuery(q);

      filtered = filtered.filter(review => {
        // Search in text fields
        const textMatch =
          (review.name || '').toLowerCase().includes(q) ||
          (review.country || '').toLowerCase().includes(q) ||
          (review.review || '').toLowerCase().includes(q) ||
          (review.type || '').toLowerCase().includes(q);

        // Search by date if query looks like a date
        if (isDate) {
          const reviewDate = formatDateForSearch(review.createdAt);
          return textMatch || reviewDate.includes(q);
        }

        return textMatch;
      });
    }

    return filtered;
  }, [reviews, searchQuery, statusFilter, ratingFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newReviews = reviews.filter(r => {
      const reviewDate = new Date(r.createdAt);
      return reviewDate >= thirtyDaysAgo && reviewDate <= now;
    });

    const positiveRatings = reviews.filter(r => r.rating >= 4).length;
    const negativeRatings = reviews.filter(r => r.rating <= 2).length;
    const averageRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0';

    return {
      newReviews: newReviews.length,
      positiveRatings,
      negativeRatings,
      averageRating,
      totalRatings: reviews.length
    };
  }, [reviews]);

  const handleApprovalToggle = async (id: string, currentStatus: boolean) => {
    if (isReadOnly) return;
    try {
      const success = await updateGuestReviewApproval(id, !currentStatus);
      if (success) {
        setReviews(prev => prev.map(r =>
          r.id === id ? { ...r, isApproved: !currentStatus } : r
        ));
      }
    } catch (error) {
      console.error('Error updating review approval:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId || isReadOnly) return;
    try {
      setDeleting(confirmDeleteId);
      const success = await deleteGuestReview(confirmDeleteId);
      if (success) {
        setReviews(prev => prev.filter(r => r.id !== confirmDeleteId));
        setConfirmDeleteId(null);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-12 w-12 border-b-2 border-[#FF6A00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">


      {/* Simple Header with Inline Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reputation Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage guest reviews and ratings • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{reviews.length}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-4xl font-bold text-[#1D69F9] mb-2">{stats.newReviews}</div>
          <div className="text-sm text-gray-600">New Reviews</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-4xl font-bold text-[#1D69F9] mb-2">{stats.positiveRatings}</div>
          <div className="text-sm text-gray-600">Positive Ratings</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-4xl font-bold text-[#1D69F9] mb-2">{stats.negativeRatings}</div>
          <div className="text-sm text-gray-600">Negative Ratings</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-4xl font-bold text-[#1D69F9] mb-2">{stats.averageRating}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, country, feedback, or date (DD/MM/YYYY)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as FilterRating)}
            className="px-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none text-sm"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'all' || ratingFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRatingFilter('all');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-[#FF6A00] transition-colors border-b-2 border-transparent hover:border-[#FF6A00] flex items-center gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-lg font-medium text-gray-600">No Review Found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'No reviews available'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left Section - User Info & Rating */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#EBDDCC] text-[#BE8C53] font-kaisei text-lg flex-shrink-0">
                        {review.name[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{review.name}</h3>
                          {review.country && (
                            <span className="text-sm text-gray-500">({review.country})</span>
                          )}
                          {review.type && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {review.type}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${review.isApproved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {review.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {star <= review.rating ? (
                                <StarIconSolid className="h-5 w-5 text-yellow-400" />
                              ) : (
                                <StarIcon className="h-5 w-5 text-gray-300" />
                              )}
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                        </div>

                        {/* Review Feedback */}
                        <p className="text-gray-700 mb-3 leading-relaxed">{review.review}</p>

                        {/* Detailed Ratings */}
                        {(review.staffRating || review.facilitiesRating || review.cleanlinessRating ||
                          review.comfortRating || review.valueRating || review.locationRating || review.wifiRating) && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-200">
                              {review.staffRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Staff:</span>
                                  <span className="ml-1 font-medium">{review.staffRating}/5</span>
                                </div>
                              )}
                              {review.facilitiesRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Facilities:</span>
                                  <span className="ml-1 font-medium">{review.facilitiesRating}/5</span>
                                </div>
                              )}
                              {review.cleanlinessRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Cleanliness:</span>
                                  <span className="ml-1 font-medium">{review.cleanlinessRating}/5</span>
                                </div>
                              )}
                              {review.comfortRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Comfort:</span>
                                  <span className="ml-1 font-medium">{review.comfortRating}/5</span>
                                </div>
                              )}
                              {review.valueRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Value:</span>
                                  <span className="ml-1 font-medium">{review.valueRating}/5</span>
                                </div>
                              )}
                              {review.locationRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">Location:</span>
                                  <span className="ml-1 font-medium">{review.locationRating}/5</span>
                                </div>
                              )}
                              {review.wifiRating && (
                                <div className="text-xs">
                                  <span className="text-gray-500">WiFi:</span>
                                  <span className="ml-1 font-medium">{review.wifiRating}/5</span>
                                </div>
                              )}
                            </div>
                          )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  {!isReadOnly && (
                    <div className="flex items-start gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprovalToggle(review.id, review.isApproved)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${review.isApproved
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                      >
                        {review.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(review.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Review?"
        message="This action cannot be undone. The review will be permanently deleted."
        confirmText={deleting === confirmDeleteId ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
