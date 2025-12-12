"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getRoomTypes, createRoomType, updateRoomType, deleteRoomType, RoomType, SuiteType } from '@/lib/firestoreService';
import { useToast } from '@/context/ToastContext';
import { useAdminRole } from '@/context/AdminRoleContext';
import RestrictedAction from '@/components/admin/RestrictedAction';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, BuildingOfficeIcon, HomeIcon } from '@heroicons/react/24/outline';

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

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
  const [formData, setFormData] = useState({ suiteType: 'Garden Suite' as SuiteType, roomName: '', isActive: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');
  const { showToast } = useToast();

  const loadRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await getRoomTypes();
      setRoomTypes(data);
    } catch (error) {
      console.error('Error loading room types:', error);
      showToast('Failed to load room types', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const filteredRoomTypes = useMemo(() => {
    let filtered = roomTypes;
    
    if (selectedSuite !== 'all') {
      filtered = filtered.filter(rt => rt.suiteType === selectedSuite);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rt => 
        rt.roomName.toLowerCase().includes(query) ||
        rt.suiteType.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [roomTypes, selectedSuite, searchQuery]);

  const groupedRoomTypes = useMemo(() => {
    return SUITE_TYPES.reduce((acc, suite) => {
      acc[suite] = filteredRoomTypes.filter(rt => rt.suiteType === suite);
      return acc;
    }, {} as Record<SuiteType, RoomType[]>);
  }, [filteredRoomTypes]);

  const stats = useMemo(() => {
    return {
      total: roomTypes.length,
      active: roomTypes.filter(rt => rt.isActive).length,
      inactive: roomTypes.filter(rt => !rt.isActive).length,
    };
  }, [roomTypes]);

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
      showToast("You don't have permission to modify room types", 'warning');
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
      showToast("You don't have permission to delete room types", 'warning');
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
      showToast("You don't have permission to modify room types", 'warning');
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
          <h1 className="text-2xl font-semibold text-gray-900">Room Types</h1>
          <p className="text-sm text-gray-500 mt-1">Manage room types for all suites • {currentDate}</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Inline Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold text-gray-900">{stats.active}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-gray-600">Inactive:</span>
              <span className="font-semibold text-gray-900">{stats.inactive}</span>
            </div>
          </div>
          
          {/* Add Button */}
          {isReadOnly ? (
            <RestrictedAction message="You don't have permission to add room types">
              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent">
                <PlusIcon className="h-4 w-4" />
                Add Type
              </div>
            </RestrictedAction>
          ) : (
            <button
              onClick={() => {
                setFormData({ suiteType: 'Garden Suite', roomName: '', isActive: true });
                setShowAddForm(true);
                setEditing(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#FF6A00] border-b-2 border-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Type
            </button>
          )}
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by room name or suite type..."
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => setSelectedSuite('all')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                selectedSuite === 'all'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            {SUITE_TYPES.map(suite => (
              <button
                key={suite}
                onClick={() => setSelectedSuite(suite)}
                className={`px-3 py-1 text-sm font-medium transition-colors ${
                  selectedSuite === suite
                    ? 'text-[#FF6A00] border-b-2 border-[#FF6A00] -mb-[2px]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {suite.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editing) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{editing ? 'Edit Room Type' : 'Add New Room Type'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suite Type</label>
                <select
                  value={formData.suiteType}
                  onChange={(e) => setFormData({ ...formData, suiteType: e.target.value as SuiteType })}
                  className="w-full border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent px-3 py-2 focus:outline-none"
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
                  className="w-full border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent px-3 py-2 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-[#FF6A00] focus:ring-[#FF6A00] border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-[#FF6A00] text-white rounded-lg hover:bg-[#FF6A00]/90 transition-colors"
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
                className="px-4 py-2 border-b-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
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
          <div key={suite} className="space-y-4">
            {/* Simple Suite Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <HomeIcon className="h-5 w-5 text-[#FF6A00]" />
                <h2 className="text-lg font-semibold text-gray-900">{suite}</h2>
                <span className="text-sm text-gray-500">({types.length})</span>
              </div>
              {missing.length > 0 && (
                isReadOnly ? (
                  <RestrictedAction message="You don't have permission to add room types">
                    <div className="px-3 py-1 text-sm text-gray-500 border-b-2 border-transparent">
                      Add Default ({missing.length})
                    </div>
                  </RestrictedAction>
                ) : (
                  <button
                    onClick={() => handleAddDefault(suite)}
                    className="px-3 py-1 text-sm font-medium text-[#FF6A00] border-b-2 border-[#FF6A00] hover:text-[#FF6A00]/80 transition-colors"
                  >
                    Add Default ({missing.length})
                  </button>
                )
              )}
            </div>
            
            {/* Room Types Grid */}
            {types.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">No room types for this suite yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {types.map(rt => (
                  <div
                    key={rt.id}
                    className={`p-3 rounded-lg border border-gray-200 hover:border-[#FF6A00] transition-all bg-white ${
                      !rt.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-gray-900 truncate flex-1 pr-1" title={rt.roomName}>
                        {rt.roomName}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {isReadOnly ? (
                          <div className="p-1 text-gray-400">
                            {rt.isActive ? <CheckIcon className="h-3 w-3" /> : <XMarkIcon className="h-3 w-3" />}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleActive(rt)}
                              className={`p-1 rounded transition-colors ${
                                rt.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={rt.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {rt.isActive ? <CheckIcon className="h-3 w-3" /> : <XMarkIcon className="h-3 w-3" />}
                            </button>
                            <button
                              onClick={() => handleEdit(rt)}
                              className="p-1 rounded text-[#FF6A00] hover:bg-orange-50 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(rt.id)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded text-center ${
                      rt.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rt.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
