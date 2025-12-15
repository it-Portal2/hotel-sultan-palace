"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getGuestServices, updateGuestService, GuestService } from '@/lib/firestoreService';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminGuestServicesPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [services, setServices] = useState<GuestService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
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
      loadServices();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getGuestServices();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
      showToast('Failed to load services', 'error');
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
      showToast(`Service ${status} successfully!`, 'success');
    } catch (error) {
      console.error('Error updating service status:', error);
      showToast('Failed to update service status', 'error');
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch =
        service.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.roomNumber && service.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      const matchesType = serviceTypeFilter === 'all' || service.serviceType === serviceTypeFilter;
      const matchesCategory = categoryFilter === 'all' || service.serviceCategory === categoryFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [services, searchQuery, statusFilter, serviceTypeFilter, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: services.length,
      requested: services.filter(s => s.status === 'requested').length,
      inProgress: services.filter(s => s.status === 'in_progress').length,
      completed: services.filter(s => s.status === 'completed').length,
    };
  }, [services]);

  const getStatusColor = (status: GuestService['status']) => {
    switch (status) {
      case 'requested':
        return 'text-yellow-600 bg-yellow-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
          <h1 className="text-2xl font-semibold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage guest service requests • {currentDate}</p>
        </div>

        {/* Inline Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Requested:</span>
            <span className="font-semibold text-gray-900">{stats.requested}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">In Progress:</span>
            <span className="font-semibold text-gray-900">{stats.inProgress}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Completed:</span>
            <span className="font-semibold text-gray-900">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* Simple Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by guest name, description, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex gap-1 border-b-2 border-gray-200 pb-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'all'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('requested')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'requested'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Requested
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'in_progress'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 text-sm font-medium transition-colors ${statusFilter === 'completed'
                  ? 'text-[#FF6A00] border-b-2 border-[#FF6A00]'
                  : 'text-gray-600 hover:text-gray-800'
                }`}
            >
              Completed
            </button>
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none px-3 py-2 text-sm"
        >
          {Object.entries(serviceCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={serviceTypeFilter}
          onChange={(e) => setServiceTypeFilter(e.target.value)}
          className="border-b-2 border-gray-200 focus:border-[#FF6A00] bg-transparent focus:outline-none px-3 py-2 text-sm"
        >
          {Object.entries(serviceTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {!isReadOnly && (
          <Link
            href="/admin/guest-services/new"
            className="inline-flex items-center rounded-lg bg-[#FF6A00] px-4 py-2 text-sm font-medium text-white hover:bg-[#FF6A00]/90 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Request
          </Link>
        )}
      </div>

      {/* Clean Table */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16">
          <WrenchScrewdriverIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-600">No services found</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">Fast</span>
                        )}
                        <div className="text-sm font-semibold text-gray-900">
                          ${(service.totalAmount ?? service.amount ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
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
                        <div className="flex items-center gap-2">
                          {service.status === 'requested' && (
                            <button
                              onClick={() => handleStatusUpdate(service.id, 'in_progress')}
                              className="text-blue-600 hover:text-blue-800 font-medium border-b-2 border-transparent hover:border-blue-600 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {service.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(service.id, 'completed')}
                              className="text-green-600 hover:text-green-800 font-medium border-b-2 border-transparent hover:border-green-600 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {service.status !== 'completed' && service.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusUpdate(service.id, 'cancelled')}
                              className="text-red-600 hover:text-red-800 font-medium border-b-2 border-transparent hover:border-red-600 transition-colors"
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
