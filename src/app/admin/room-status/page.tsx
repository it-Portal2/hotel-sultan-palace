"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/admin/BackButton';
import { getRoomStatuses, getRoomTypes, RoomStatus, SuiteType, RoomType } from '@/lib/firestoreService';
import { 
  HomeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  WrenchScrewdriverIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const SUITE_TYPES: SuiteType[] = ['Garden Suite', 'Imperial Suite', 'Ocean Suite'];

export default function RoomStatusPage() {
  const router = useRouter();
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuite, setSelectedSuite] = useState<SuiteType | 'all'>('all');

  useEffect(() => {
    loadData();
    
    // Set up real-time listener for room status updates
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds
    
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

  const getStatusColor = (status: RoomStatus['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reserved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHousekeepingColor = (status?: RoomStatus['housekeepingStatus']) => {
    switch (status) {
      case 'clean':
        return 'text-green-600';
      case 'dirty':
        return 'text-red-600';
      case 'inspected':
        return 'text-blue-600';
      case 'needs_attention':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  // Group rooms by suite type
  const roomsBySuite = roomTypes.reduce((acc, roomType) => {
    if (!acc[roomType.suiteType]) {
      acc[roomType.suiteType] = [];
    }
    acc[roomType.suiteType].push(roomType);
    return acc;
  }, {} as Record<SuiteType, RoomType[]>);

  const filteredSuites = selectedSuite === 'all' 
    ? SUITE_TYPES 
    : [selectedSuite];

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
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Room Status Dashboard</h1>
        <p className="mt-2 text-[#202c3b]/70 text-lg">Real-time room availability and status</p>
        
        {/* Filter */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setSelectedSuite('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedSuite === 'all'
                ? 'bg-[#FF6A00] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Suites
          </button>
          {SUITE_TYPES.map(suite => (
            <button
              key={suite}
              onClick={() => setSelectedSuite(suite)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedSuite === suite
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {suite}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {roomStatuses.filter(r => r.status === 'available').length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {roomStatuses.filter(r => r.status === 'occupied').length}
            </div>
            <div className="text-sm text-gray-600">Occupied</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">
              {roomStatuses.filter(r => r.status === 'cleaning').length}
            </div>
            <div className="text-sm text-gray-600">Cleaning</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">
              {roomStatuses.filter(r => r.status === 'maintenance').length}
            </div>
            <div className="text-sm text-gray-600">Maintenance</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {roomStatuses.filter(r => r.status === 'reserved').length}
            </div>
            <div className="text-sm text-gray-600">Reserved</div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="space-y-6">
        {filteredSuites.map(suiteType => {
          const rooms = roomsBySuite[suiteType] || [];
          const suiteStatuses = roomStatuses.filter(rs => rs.suiteType === suiteType);
          
          return (
            <div key={suiteType} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <HomeIcon className="h-6 w-6 mr-2 text-[#FF6A00]" />
                {suiteType}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {rooms.map(room => {
                  const status = suiteStatuses.find(s => s.roomName === room.roomName);
                  const currentStatus = status?.status || 'available';
                  const housekeepingStatus = status?.housekeepingStatus || 'clean';
                  
                  return (
                    <div
                      key={room.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-all ${
                        currentStatus === 'available' ? 'border-green-300 bg-green-50' :
                        currentStatus === 'occupied' ? 'border-blue-300 bg-blue-50' :
                        currentStatus === 'cleaning' ? 'border-yellow-300 bg-yellow-50' :
                        currentStatus === 'maintenance' ? 'border-red-300 bg-red-50' :
                        'border-purple-300 bg-purple-50'
                      }`}
                      onClick={() => {
                        router.push(`/admin/room-status/${room.roomName}`);
                      }}
                    >
                      <div className="font-bold text-gray-900 mb-2">{room.roomName}</div>
                      <div className={`text-xs font-medium mb-2 px-2 py-1 rounded-full border ${getStatusColor(currentStatus)}`}>
                        {currentStatus.toUpperCase()}
                      </div>
                      <div className={`text-xs font-semibold mb-1 ${getHousekeepingColor(housekeepingStatus)}`}>
                        {housekeepingStatus?.toUpperCase() || 'CLEAN'}
                      </div>
                      
                      {/* Guest Info */}
                      {status?.currentGuestName && (
                        <div className="text-xs text-gray-600 mt-1">
                          Guest: {status.currentGuestName}
                        </div>
                      )}
                      
                      {/* Check-in Date */}
                      {status?.currentCheckInDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Check-in: {new Date(status.currentCheckInDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      {/* Booking ID */}
                      {status?.currentBookingId && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          Booking: {status.currentBookingId.slice(0, 8)}...
                        </div>
                      )}
                      
                      {/* Last Cleaned */}
                      {status?.lastCleaned && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last Cleaned: {new Date(status.lastCleaned).toLocaleDateString()}
                        </div>
                      )}
                      
                      {/* Cleaning Count */}
                      {status?.cleaningHistory && status.cleaningHistory.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Cleaned {status.cleaningHistory.length} time{status.cleaningHistory.length > 1 ? 's' : ''}
                        </div>
                      )}
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

