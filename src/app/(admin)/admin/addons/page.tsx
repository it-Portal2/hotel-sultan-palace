"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAddOns, deleteAddOn, AddOn } from '@/lib/firestoreService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAdminRole } from '@/context/AdminRoleContext';
import RestrictedAction from '@/components/admin/RestrictedAction';
import AddonsTable from '@/components/admin/addons/AddonsTable';

export default function AdminAddOnsPage() {
  const { isReadOnly } = useAdminRole();
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        setLoading(true);
        const data = await getAddOns();
        setAddOns(data);
      } catch (e) {
        console.error('Error fetching add-ons:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAddOns();
  }, []);

  const filteredAddOns = useMemo(() => {
    if (!searchQuery.trim()) return addOns;
    const q = searchQuery.toLowerCase();
    return addOns.filter(addon =>
      addon.name.toLowerCase().includes(q) ||
      addon.type.toLowerCase().includes(q) ||
      addon.description?.toLowerCase().includes(q)
    );
  }, [addOns, searchQuery]);

  const handleDelete = async (id: string) => setConfirmId(id);

  const confirmDelete = async () => {
    if (!confirmId) return;
    try {
      setDeleting(confirmId);
      const ok = await deleteAddOn(confirmId);
      if (ok) setAddOns(addOns.filter(a => a.id !== confirmId));
      else alert('Failed to delete add-on');
    } catch (e) {
      console.error('Error deleting add-on:', e);
      alert('Failed to delete add-on');
    } finally {
      setDeleting(null);
      setConfirmId(null);
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
          <h1 className="text-2xl font-semibold text-gray-900">Add-ons Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage upsell services and extras • {currentDate}</p>
        </div>

        <div className="flex items-center gap-6">
          {/* Inline Stats */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{addOns.length}</span>
          </div>

          {/* Add Button */}
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add add-ons">
              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent">
                <PlusIcon className="h-4 w-4" />
                Add Add-on
              </div>
            </RestrictedAction>
          ) : (
            <Link
              href="/admin/addons/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FF6A00] border-b-2 border-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Add-on
            </Link>
          )}
        </div>
      </div>

      {/* Simple Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, type, or description..."
          className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
        />
      </div>

      {/* Table View */}
      <AddonsTable
        addOns={filteredAddOns}
        isReadOnly={isReadOnly}
        onDelete={handleDelete}
        deletingId={deleting}
      />

      {/* Confirm Delete Modal */}
      <ConfirmationModal
        isOpen={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete add-on?"
        message="Are you sure you want to delete this add-on? This action cannot be undone."
        confirmText={deleting === confirmId ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
      />
    </div>
  );
}
