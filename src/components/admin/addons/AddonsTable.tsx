import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { AddOn } from '@/lib/firestoreService';
import RestrictedAction from '@/components/admin/RestrictedAction';

interface AddonsTableProps {
    addOns: AddOn[];
    isReadOnly: boolean;
    onDelete: (id: string) => void;
    deletingId: string | null;
}

export default function AddonsTable({ addOns, isReadOnly, onDelete, deletingId }: AddonsTableProps) {
    if (addOns.length === 0) {
        return (
            <div className="text-center py-12 bg-white border border-gray-100 shadow-sm rounded-lg">
                <p className="text-gray-500">No add-ons found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Service / Item</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {addOns.map((addon) => (
                            <tr key={addon.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                            <Image
                                                src={addon.image || '/placeholder-addon.jpg'}
                                                alt={addon.name}
                                                fill
                                                className="object-cover"
                                                sizes="48px"
                                                onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100?text=No+Image'; }}
                                            />
                                        </div>
                                        <div className="text-sm font-bold text-gray-900">{addon.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                        {addon.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 max-w-xs truncate" title={addon.description}>
                                        {addon.description || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-sm font-bold text-gray-900">${addon.price.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isReadOnly ? (
                                            <RestrictedAction message="Edit disabled">
                                                <button className="p-2 text-gray-300 cursor-not-allowed">
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                            </RestrictedAction>
                                        ) : (
                                            <>
                                                <Link
                                                    href={`/admin/addons/edit/${addon.id}`}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => onDelete(addon.id)}
                                                    disabled={deletingId === addon.id}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === addon.id ? (
                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent animate-spin"></div>
                                                    ) : (
                                                        <TrashIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
