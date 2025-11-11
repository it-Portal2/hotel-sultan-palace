"use client";

import React, { useEffect, useState } from 'react';
import { getRoomTypes, createRoomType, updateRoomType, deleteRoomType, RoomType, SuiteType } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { useAdminRole } from '@/context/AdminRoleContext';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

// Default room types from images
const DEFAULT_ROOM_TYPES: Record<SuiteType, string[]> = {
  'Garden Suite': ['ANANAS', 'DESERT ROSE', 'JASMINE', 'LYCHEE', 'MANGOSTEEN', 'TANGERINE'],
  'Imperial Suite': ['EUCALYPTUS', 'FLAMBOYANT', 'FRANGIPANI', 'HIBISCUS', 'PAPAYA'],
  'Ocean Suite': ['BOUGAINVILLEA', 'CITRONELLA', 'OLEANDER', 'PASSION FLOWER']
};

export default function AdminRoomTypesPage() {
  const { isReadOnly } = useAdminRole();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState<SuiteType>('Garden Suite');
  const [formData, setFormData] = useState({ suiteType: 'Garden Suite' as SuiteType, roomName: '', isActive: true });
  const { showToast } = useToast();

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await getRoomTypes();
      setRoomTypes(data);
    } catch (e) {
      console.error('Error loading room types:', e);
      showToast('Failed to load room types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDefault = async (suiteType: SuiteType) => {
    if (isReadOnly) {
      showToast('Read-only mode: Cannot add room types', 'error');
      return;
    }
    try {
      const defaults = DEFAULT_ROOM_TYPES[suiteType];
      const existing = roomTypes.filter(rt => rt.suiteType === suiteType).map(rt => rt.roomName);
      const toAdd = defaults.filter(name => !existing.includes(name));

      if (toAdd.length === 0) {
        showToast('All default room types already exist for this suite', 'info');
        return;
      }

      for (const roomName of toAdd) {
        await createRoomType({ suiteType, roomName, isActive: true });
      }

      showToast(`Added ${toAdd.length} room type(s) for ${suiteType}`, 'success');
      await loadRoomTypes();
    } catch (e) {
      console.error('Error adding default room types:', e);
      showToast('Failed to add default room types', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('Read-only mode: Cannot modify room types', 'error');
      return;
    }
    if (!formData.roomName.trim()) {
      showToast('Room name is required', 'warning');
      return;
    }

    try {
      if (editing) {
        await updateRoomType(editing, formData);
        showToast('Room type updated successfully', 'success');
        setEditing(null);
      } else {
        await createRoomType(formData);
        showToast('Room type created successfully', 'success');
        setShowAddForm(false);
      }
      setFormData({ suiteType: 'Garden Suite', roomName: '', isActive: true });
      await loadRoomTypes();
    } catch (e) {
      console.error('Error saving room type:', e);
      showToast('Failed to save room type', 'error');
    }
  };

  const handleEdit = (roomType: RoomType) => {
    setEditing(roomType.id);
    setFormData({
      suiteType: roomType.suiteType,
      roomName: roomType.roomName,
      isActive: roomType.isActive
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      showToast('Read-only mode: Cannot delete room types', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this room type?')) return;
    try {
      await deleteRoomType(id);
      showToast('Room type deleted successfully', 'success');
      await loadRoomTypes();
    } catch (e) {
      console.error('Error deleting room type:', e);
      showToast('Failed to delete room type', 'error');
    }
  };

  const handleToggleActive = async (roomType: RoomType) => {
    if (isReadOnly) {
      showToast('Read-only mode: Cannot modify room types', 'error');
      return;
    }
    try {
      await updateRoomType(roomType.id, { isActive: !roomType.isActive });
      showToast(`Room type ${!roomType.isActive ? 'activated' : 'deactivated'}`, 'success');
      await loadRoomTypes();
    } catch (e) {
      console.error('Error toggling room type:', e);
      showToast('Failed to update room type', 'error');
    }
  };

  const groupedRoomTypes = SUITE_TYPES.reduce((acc, suite) => {
    acc[suite] = roomTypes.filter(rt => rt.suiteType === suite);
    return acc;
  }, {} as Record<SuiteType, RoomType[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Room Types Management</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">
          Manage room types for Garden Suite, Imperial Suite, and Ocean Suite
        </p>
      </div>

      {/* Add Form */}
      {(showAddForm || editing) && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">{editing ? 'Edit Room Type' : 'Add New Room Type'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suite Type</label>
              <select
                value={formData.suiteType}
                onChange={(e) => setFormData({ ...formData, suiteType: e.target.value as SuiteType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                {SUITE_TYPES.map(suite => (
                  <option key={suite} value={suite}>{suite}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
              <input
                type="text"
                value={formData.roomName}
                onChange={(e) => setFormData({ ...formData, roomName: e.target.value.toUpperCase() })}
                placeholder="e.g., DESERT ROSE, EUCALYPTUS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditing(null);
                  setFormData({ suiteType: 'Garden Suite', roomName: '', isActive: true });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suite Sections */}
      {SUITE_TYPES.map(suite => {
        const types = groupedRoomTypes[suite];
        const defaults = DEFAULT_ROOM_TYPES[suite];
        const existing = types.map(rt => rt.roomName);
        const missing = defaults.filter(name => !existing.includes(name));

        return (
          <div key={suite} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-white to-[#FFFCF6] px-6 py-4 border-b border-[#be8c53]/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#202c3b]">{suite}</h2>
                <p className="text-sm text-[#202c3b]/70 mt-1">{types.length} room type(s)</p>
              </div>
              <div className="flex gap-2">
                {missing.length > 0 && (
                  isReadOnly ? (
                    <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Add Default Types ({missing.length}) (Read-Only)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddDefault(suite)}
                      className="px-4 py-2 bg-[#be8c53] text-white rounded-lg hover:bg-[#be8c53]/90 transition-colors text-sm flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Default Types ({missing.length})
                    </button>
                  )
                )}
                {isReadOnly ? (
                  <div className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Custom (Read-Only)
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedSuite(suite);
                      setFormData({ suiteType: suite, roomName: '', isActive: true });
                      setShowAddForm(true);
                      setEditing(null);
                    }}
                    className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors text-sm flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Custom
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {types.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No room types for this suite yet.</p>
                  {isReadOnly ? (
                    <div className="mt-4 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm inline-block">
                      Add Default Types (Read-Only)
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddDefault(suite)}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Add Default Types
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {types.map(rt => (
                    <div
                      key={rt.id}
                      className={`p-4 rounded-lg border-2 ${
                        rt.isActive
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{rt.roomName}</h3>
                        <div className="flex gap-1">
                          {isReadOnly ? (
                            <>
                              <div className="p-1 rounded text-gray-400 cursor-not-allowed" title="Read-only mode: Cannot modify">
                                {rt.isActive ? (
                                  <CheckIcon className="h-5 w-5" />
                                ) : (
                                  <XMarkIcon className="h-5 w-5" />
                                )}
                              </div>
                              <div className="p-1 rounded text-gray-400 cursor-not-allowed" title="Read-only mode: Editing disabled">
                                <PencilIcon className="h-4 w-4" />
                              </div>
                              <div className="p-1 rounded text-gray-400 cursor-not-allowed" title="Read-only mode: Deletion disabled">
                                <TrashIcon className="h-4 w-4" />
                              </div>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleToggleActive(rt)}
                                className={`p-1 rounded ${
                                  rt.isActive
                                    ? 'text-green-600 hover:bg-green-100'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={rt.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {rt.isActive ? (
                                  <CheckIcon className="h-5 w-5" />
                                ) : (
                                  <XMarkIcon className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleEdit(rt)}
                                className="p-1 rounded text-blue-600 hover:bg-blue-100"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(rt.id)}
                                className="p-1 rounded text-red-600 hover:bg-red-100"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{rt.suiteType}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

