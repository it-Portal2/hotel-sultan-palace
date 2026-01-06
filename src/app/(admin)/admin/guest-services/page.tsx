"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useMemo } from 'react';

import { useAdminRole } from '@/context/AdminRoleContext';
import { useToast } from '@/context/ToastContext';
import { getGuestServices, GuestService } from '@/lib/firestoreService';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, WrenchScrewdriverIcon, EyeIcon } from '@heroicons/react/24/outline';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ServiceDetailDrawer from '@/components/admin/guest-services/ServiceDetailDrawer';
import NewServiceDrawer from '@/components/admin/guest-services/NewServiceDrawer';

export default function AdminGuestServicesPage() {
  const { isReadOnly } = useAdminRole();
  const { showToast } = useToast();
  const [services, setServices] = useState<GuestService[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Drawer States
  const [selectedService, setSelectedService] = useState<GuestService | null>(null);
  const [isNewServiceDrawerOpen, setIsNewServiceDrawerOpen] = useState(false);

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
      case 'requested': return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      case 'in_progress': return 'text-blue-700 bg-blue-50 ring-blue-600/20';
      case 'completed': return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'cancelled': return 'text-red-700 bg-red-50 ring-red-600/20';
      default: return 'text-gray-600 bg-gray-50 ring-gray-500/10';
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

  const renderSummary = (service: GuestService) => {
    if (service.serviceCategory === 'laundry' && service.items && service.items.length > 0) {
      const itemCount = service.items.reduce((acc, item) => acc + item.qty, 0);
      return (
        <div>
          <span className="font-medium text-gray-900 block">{itemCount} Laundry Items</span>
          <span className="text-xs text-gray-500 truncate block max-w-xs">
            {service.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
          </span>
        </div>
      );
    }
    if (service.serviceCategory === 'spa') {
      return (
        <div>
          <span className="font-medium text-purple-900 block">{service.spaType || 'Spa Session'}</span>
          <span className="text-xs text-gray-500 block">{service.durationMinutes} mins • {service.guestCount} Guest(s)</span>
        </div>
      );
    }
    return <span className="text-gray-700 truncate block max-w-xs">{service.description}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
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
    <div className="h-full flex flex-col bg-gray-50/50">

      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Guest Services</h1>
            <p className="text-sm text-gray-500 mt-1">Manage guest requests & billing • {currentDate}</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-center px-4 border-r border-gray-100">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">New</span>
              <span className="text-xl font-bold text-yellow-600">{stats.requested}</span>
            </div>
            <div className="flex flex-col items-center px-4 border-r border-gray-100">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Active</span>
              <span className="text-xl font-bold text-blue-600">{stats.inProgress}</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Done</span>
              <span className="text-xl font-bold text-green-600">{stats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 flex flex-col sm:flex-row gap-3 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guest, room, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200  focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className=" text-sm focus:ring-[#FF6A00] focus:border-[#FF6A00]"
          >
            {Object.entries(serviceCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className=" text-sm focus:ring-[#FF6A00] focus:border-[#FF6A00]"
          >
            <option value="all">All Status</option>
            <option value="requested">Requested</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {!isReadOnly && (
            <button
              onClick={() => setIsNewServiceDrawerOpen(true)}
              className="inline-flex items-center  bg-[#FF6A00] px-4 py-2 text-sm font-bold text-white hover:bg-[#FF6A00]/90 transition-shadow shadow-sm hover:shadow-md ml-2"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Request
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-gray-300">
            <WrenchScrewdriverIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-600">No services found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Guest & Room</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Detail</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Schedule</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="hover:bg-orange-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                          {service.roomNumber ? service.roomNumber.replace(/\D/g, '').substring(0, 3) : '?'}
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-bold text-gray-900 truncate">{service.roomCategory || 'Room'}</div>
                          <div className="text-xs text-gray-500">{service.roomNumber || 'N/A'} • {service.guestName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{service.serviceCategory}</span>
                        {renderSummary(service)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 block">
                        {service.pickupDate?.toLocaleDateString() || service.appointmentDate?.toLocaleDateString() || new Date(service.requestedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 block">
                        {service.pickupTime || service.appointmentTime || new Date(service.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{(service.totalAmount || service.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(service.status)}`}>
                        {service.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                        }}
                        className="text-gray-400 hover:text-[#FF6A00] transition-colors"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ServiceDetailDrawer
        open={!!selectedService}
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onUpdate={() => {
          loadServices(); // Refresh list to show updated status
        }}
      />

      <NewServiceDrawer
        open={isNewServiceDrawerOpen}
        onClose={() => setIsNewServiceDrawerOpen(false)}
        onSuccess={() => {
          loadServices();
          setIsNewServiceDrawerOpen(false);
        }}
      />
    </div>
  );
}
