"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAddOns, deleteAddOn, AddOn } from '@/lib/firestoreService';
import { useAdminRole } from '@/context/AdminRoleContext';
import RestrictedAction from '@/components/admin/RestrictedAction';

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

      {/* Clean List */}
      {filteredAddOns.length === 0 ? (
        <div className="text-center py-16">
          <SparklesIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No add-ons found</p>
          <p className="text-sm text-gray-500 mt-2">
            {searchQuery ? 'Try adjusting your search' : 'Create your first service to upsell guests'}
          </p>
          {!isReadOnly && !searchQuery && (
            <div className="mt-6">
              <Link
                href="/admin/addons/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FF6A00] border-b-2 border-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add New Add-on
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAddOns.map((a) => (
              <div key={a.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <Image
                        className="object-cover"
                        src={a.image}
                        alt={a.name}
                        fill
                        sizes="64px"
                        unoptimized
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/addons/romantic.png'; }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {a.type.replace('_',' ')} • ${a.price}
                      </p>
                      {a.description && (
                        <p className="text-xs text-gray-400 mt-1 max-w-md truncate">{a.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isReadOnly ? (
                      <>
                        <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Editing disabled">
                          <PencilIcon className="h-5 w-5" />
                        </div>
                        <div className="text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                          <TrashIcon className="h-5 w-5" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Link 
                          href={`/admin/addons/edit/${a.id}`} 
                          className="text-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                        >
                          {deleting === a.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          ) : (
                            <TrashIcon className="h-5 w-5" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete add-on?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setConfirmId(null)} 
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={deleting === confirmId} 
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === confirmId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
