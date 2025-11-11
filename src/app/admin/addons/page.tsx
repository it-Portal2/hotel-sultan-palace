"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { getAddOns, deleteAddOn, AddOn } from '@/lib/firestoreService';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';

export default function AdminAddOnsPage() {
  const { isReadOnly } = useAdminRole();
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton href="/admin" label="Back to Dashboard" />
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Add-ons Management</h1>
          <p className="mt-2 text-gray-600">Manage your upsell services and extras</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {isReadOnly ? (
            <div className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Add-on (Read-Only)
            </div>
          ) : (
            <Link href="/admin/addons/new" className="inline-flex items-center justify-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Add-on
            </Link>
          )}
        </div>
      </div>

      {addOns.length === 0 ? (
        <div className="text-center py-12">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No add-ons</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first service to upsell guests.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {addOns.map((a) => (
              <li key={a.id}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-lg object-cover"
                        src={a.image}
                        alt={a.name}
                        onError={(e) => { e.currentTarget.src = '/addons/romantic.png'; }}
                      />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{a.type.replace('_',' ')} • ${a.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
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
                        <Link href={`/admin/addons/edit/${a.id}`} className="text-orange-600 hover:text-orange-900">
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900">Delete add-on?</h3>
            <p className="mt-2 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting === confirmId} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{deleting === confirmId ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


