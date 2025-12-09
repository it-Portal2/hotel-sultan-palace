"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/admin/BackButton';
import { useAdminRole } from '@/context/AdminRoleContext';
import { getGuestServices, updateGuestService, GuestService } from '@/lib/firestoreService';
import { PlusIcon, MagnifyingGlassIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminGuestServicesPage() {
  const { isReadOnly } = useAdminRole();
  const [services, setServices] = useState<GuestService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    // Set up real-time listener for service requests
    // This will show requests from both admin panel and mobile app in real-time
    if (!db) {
      loadServices();
      return;
    }

    const q = query(
      collection(db, 'guestServices'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedServices = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          pickupDate: data.pickupDate?.toDate(),
          deliveryDate: data.deliveryDate?.toDate(),
          appointmentDate: data.appointmentDate?.toDate(),
          statusHistory: (data.statusHistory || []).map((s: any) => ({
            ...s,
            at: s.at?.toDate() || new Date(),
          })),
          requestedAt: data.requestedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as GuestService;
      });
      setServices(updatedServices);
      setLoading(false);
    }, (error) => {
      console.error('Error in real-time listener:', error);
      // Fallback to regular load
      loadServices();
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getGuestServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (serviceId: string, status: GuestService['status']) => {
    if (isReadOnly) return;
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
      await updateGuestService(serviceId, updateData);
      await loadServices();
    } catch (error) {
      console.error('Error updating service status:', error);
      alert('Failed to update service status');
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.roomNumber && service.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesType = serviceTypeFilter === 'all' || service.serviceType === serviceTypeFilter;
    const matchesCategory = categoryFilter === 'all' || service.serviceCategory === categoryFilter;
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

  const getStatusColor = (status: GuestService['status']) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    all: 'All Types',
    laundry: 'Laundry',
    housekeeping: 'Housekeeping',
    spa: 'Spa',
    transport: 'Transport',
    concierge: 'Concierge',
    room_service: 'Room Service',
    game: 'Game Facilities',
    other: 'Other',
  };

  const serviceCategoryLabels: Record<string, string> = {
    all: 'All Categories',
    laundry: 'Laundry',
    spa: 'Spa',
    game: 'Game',
    other: 'Other',
  };

const renderSchedule = (service: GuestService) => {
  if (service.serviceCategory === 'laundry') {
    const pickup =
      service.pickupDate
        ? `${new Date(service.pickupDate).toLocaleDateString()}${service.pickupTime ? `, ${service.pickupTime}` : ''}`
        : 'Pickup not set';
    const delivery =
      service.deliveryDate
        ? `${new Date(service.deliveryDate).toLocaleDateString()}${service.deliveryTime ? `, ${service.deliveryTime}` : ''}`
        : 'Delivery not set';
    return (
      <div className="space-y-1">
        <div className="text-xs text-gray-600">Pickup: {pickup}</div>
        <div className="text-xs text-gray-600">Delivery: {delivery}</div>
      </div>
    );
  }
  if (service.serviceCategory === 'spa') {
    const appt =
      service.appointmentDate
        ? `${new Date(service.appointmentDate).toLocaleDateString()}${service.appointmentTime ? `, ${service.appointmentTime}` : ''}`
        : 'Not scheduled';
    return (
      <div className="space-y-1">
        <div className="text-xs text-gray-600">
          {service.spaType || 'SPA Session'} {service.durationMinutes ? `(${service.durationMinutes} mins)` : ''}
        </div>
        <div className="text-xs text-gray-600">When: {appt}</div>
        {service.guestCount && (
          <div className="text-xs text-gray-600">Guests: {service.guestCount}</div>
        )}
      </div>
    );
  }
  return (
    <div className="text-xs text-gray-600 truncate">
      {service.description}
    </div>
  );
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
      
      <div className="bg-gradient-to-r from-white to-[#FFFCF6] rounded-xl p-6 border border-[#be8c53]/20 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#202c3b]">Guest Services</h1>
            <p className="mt-2 text-[#202c3b]/70 text-lg">Manage guest service requests</p>
          </div>
          {!isReadOnly && (
            <Link
              href="/admin/guest-services/new"
              className="inline-flex items-center rounded-md bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Service Request
            </Link>
          )}
        </div>
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 bg-yellow-100 rounded-lg">
            <span className="text-sm font-medium text-yellow-800">Requested: {services.filter(s => s.status === 'requested').length}</span>
          </div>
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <span className="text-sm font-medium text-blue-800">In Progress: {services.filter(s => s.status === 'in_progress').length}</span>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <span className="text-sm font-medium text-green-800">Completed: {services.filter(s => s.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by guest name, description, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="requested">Requested</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
        >
          {Object.entries(serviceCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={serviceTypeFilter}
          onChange={(e) => setServiceTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
        >
          {Object.entries(serviceTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
          <p className="text-lg font-medium text-gray-600">No services found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white shadow-lg overflow-hidden rounded-xl border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{service.guestName}</div>
                      <div className="text-xs text-gray-500">{service.guestPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {service.roomNumber ? (
                        <span className="text-sm text-gray-900">{service.roomNumber}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{service.serviceCategory || 'other'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">{service.serviceType.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {renderSchedule(service)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {service.fastService && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">Fast</span>
                        )}
                        <div className="text-sm font-semibold text-gray-900">
                          ${ (service.totalAmount ?? service.amount ?? 0).toFixed(2) }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)}`}>
                        {service.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(service.requestedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(service.requestedAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isReadOnly && (
                        <div className="flex gap-2">
                          {service.status === 'requested' && (
                            <button
                              onClick={() => handleStatusUpdate(service.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Start
                            </button>
                          )}
                          {service.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(service.id, 'completed')}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Complete
                            </button>
                          )}
                          {service.status !== 'completed' && service.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(service.id, 'cancelled')}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

