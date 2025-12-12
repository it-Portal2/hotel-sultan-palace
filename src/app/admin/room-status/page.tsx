"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getRoomStatuses, getRoomTypes, RoomStatus, SuiteType, RoomType } from '@/lib/firestoreService';
import { 
  HomeIcon, 
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

export default function RoomStatusPage() {
  const router = useRouter();
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statuses, types] = await Promise.all([
        getRoomStatuses(),
        getRoomTypes(),
      ]);
      setRoomStatuses(statuses);
      setRoomTypes(types);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
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

  const roomsBySuite = useMemo(() => {
    return filteredRooms.reduce((acc, roomType) => {
      if (!acc[roomType.suiteType]) {
        acc[roomType.suiteType] = [];
      }
      acc[roomType.suiteType].push(roomType);
      return acc;
    }, {} as Record<SuiteType, RoomType[]>);
  }, [filteredRooms]);

  const getStatusDot = (status: RoomStatus['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-blue-500';
      case 'maintenance':
        return 'bg-red-500';
      case 'cleaning':
        return 'bg-yellow-500';
      case 'reserved':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHousekeepingDot = (status?: RoomStatus['housekeepingStatus']) => {
    switch (status) {
      case 'clean':
      case 'inspected':
        return 'bg-green-500';
      case 'dirty':
      case 'needs_attention':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const stats = useMemo(() => {
    const available = roomStatuses.filter(r => r.status === 'available').length;
    const occupied = roomStatuses.filter(r => r.status === 'occupied').length;
    const cleaning = roomStatuses.filter(r => r.status === 'cleaning').length;
    const maintenance = roomStatuses.filter(r => r.status === 'maintenance').length;
    const reserved = roomStatuses.filter(r => r.status === 'reserved').length;
    
    const clean = roomStatuses.filter(r => r.housekeepingStatus === 'clean' || r.housekeepingStatus === 'inspected').length;
    const dirty = roomStatuses.filter(r => r.housekeepingStatus === 'dirty' || r.housekeepingStatus === 'needs_attention').length;
    
    return { available, occupied, cleaning, maintenance, reserved, clean, dirty, total: roomTypes.length };
  }, [roomStatuses, roomTypes.length]);

  const filteredSuites = selectedSuite === 'all' 
    ? SUITE_TYPES 
    : [selectedSuite];

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
          <h1 className="text-2xl font-semibold text-gray-900">Room Status</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time monitoring • {currentDate}</p>
        </div>
        
        {/* Inline Stats - No boxes */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Clean:</span>
            <span className="font-semibold text-gray-900">{stats.clean}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Dirty:</span>
            <span className="font-semibold text-gray-900">{stats.dirty}</span>
          </div>
          <div className="text-gray-400">|</div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Available:</span>
            <span className="font-semibold text-gray-900">{stats.available}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Occupied:</span>
            <span className="font-semibold text-gray-900">{stats.occupied}</span>
          </div>
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
            placeholder="Search rooms..."
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

      {/* Clean Room Grid - No heavy boxes */}
      <div className="space-y-8">
        {filteredSuites.map(suiteType => {
          const rooms = roomsBySuite[suiteType] || [];
          const suiteStatuses = roomStatuses.filter(rs => rs.suiteType === suiteType);
          
          if (rooms.length === 0) return null;
          
          return (
            <div key={suiteType} className="space-y-4">
              {/* Simple Suite Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <HomeIcon className="h-5 w-5 text-[#FF6A00]" />
                <h2 className="text-lg font-semibold text-gray-900">{suiteType}</h2>
                <span className="text-sm text-gray-500">({rooms.length})</span>
              </div>
              
              {/* Minimal Room Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {rooms.map(room => {
                  const status = suiteStatuses.find(s => s.roomName === room.roomName);
                  const currentStatus = status?.status || 'available';
                  const housekeepingStatus = status?.housekeepingStatus || 'clean';
                  const isClean = housekeepingStatus === 'clean' || housekeepingStatus === 'inspected';
                  const isDirty = housekeepingStatus === 'dirty' || housekeepingStatus === 'needs_attention';
                  
                  return (
                    <div
                      key={room.id}
                      className="group relative p-3 rounded-lg border border-gray-200 hover:border-[#FF6A00] hover:shadow-sm cursor-pointer transition-all bg-white"
                      onClick={() => {
                        router.push(`/admin/room-status/${room.roomName}`);
                      }}
                    >
                      {/* Status Dots - Top Left */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusDot(currentStatus)}`}></div>
                        <div className={`w-2 h-2 rounded-full ${getHousekeepingDot(housekeepingStatus)}`}></div>
                      </div>
                      
                      {/* Room Name */}
                      <div className="font-semibold text-sm text-gray-900 mb-1 truncate">
                        {room.roomName}
                      </div>
                      
                      {/* Status Text - Minimal */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 capitalize">{currentStatus}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`${isClean ? 'text-green-600' : isDirty ? 'text-red-600' : 'text-gray-500'}`}>
                          {housekeepingStatus === 'clean' || housekeepingStatus === 'inspected' ? 'Clean' : 
                           housekeepingStatus === 'dirty' ? 'Dirty' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
