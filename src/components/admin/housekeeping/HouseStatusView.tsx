import React, { useState, useMemo, useEffect } from 'react';
import { RoomStatus, SuiteType, RoomType, Booking } from '@/lib/firestoreService';
import { FaUser, FaCheck, FaBroom, FaTools, FaSearch, FaFilter, FaClock } from 'react-icons/fa';

interface HouseStatusViewProps {
  roomStatuses: RoomStatus[];
  roomTypes: RoomType[]; // Master list of rooms
  bookings: Booking[];   // Real-time bookings
  suiteTypes: SuiteType[];
  onUpdateStatus: (roomStatusId: string, newStatus: 'clean' | 'dirty') => Promise<void>;
  isLoading: boolean;
}

export default function HouseStatusView({ roomStatuses, roomTypes, bookings, suiteTypes, onUpdateStatus, isLoading }: HouseStatusViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedRooms, setSelectedRooms] = useState<string[]>([]); // Array of roomStatus IDs (or roomNames if we switch, keeping IDs for now if available)
  const [auditSearch, setAuditSearch] = useState('');
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  // --- LOGIC HELPERS (Ported from RoomViewGrid for consistency) ---

  const normalizeDate = (d: string | Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const isDateInRange = (d: number, start: number, end: number) => {
    return d >= start && d < end;
  };

  const getRoomState = (room: RoomType) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const roomStatus = roomStatuses.find(s => s.roomName === room.roomName);
    const housekeeping = roomStatus?.housekeepingStatus || 'clean';

    // Active Booking Logic
    const booking = bookings.find(b => {
      if (b.status === 'cancelled' || b.status === 'no_show') return false;
      // Check room allocation
      if (!b.rooms.some(r => r.allocatedRoomType === room.roomName || r.type === room.roomName)) return false;

      const start = normalizeDate(b.checkIn).getTime();
      const end = normalizeDate(b.checkOut).getTime();

      // Catch "Due Out" today (checked_in ending today)
      if (normalizeDate(b.checkOut).getTime() === todayTime && b.status === 'checked_in') return true;

      // Standard range
      return isDateInRange(todayTime, start, end);
    });

    let primaryStatus: 'vacant' | 'occupied' | 'reserved' | 'blocked' | 'due_out' = 'vacant';
    let isOOO = false; // Out of Order / Maintenance

    // 1. Maintenance Logic (Date Checked)
    if (roomStatus?.status === 'maintenance') {
      if (roomStatus.maintenanceStartDate && roomStatus.maintenanceEndDate) {
        const mStart = normalizeDate(roomStatus.maintenanceStartDate).getTime();
        const mEnd = normalizeDate(roomStatus.maintenanceEndDate).getTime();
        if (isDateInRange(todayTime, mStart, mEnd)) {
          primaryStatus = 'blocked';
          isOOO = true;
        }
      } else {
        primaryStatus = 'blocked';
        isOOO = true;
      }
    }

    // 2. Booking Logic (Overrides Vacant/Blocked if specific types)
    if (booking) {
      if (booking.status === 'maintenance') {
        primaryStatus = 'blocked';
        isOOO = true;
      } else if (booking.status === 'checked_in') {
        const checkOutDate = normalizeDate(booking.checkOut);
        if (checkOutDate.getTime() === todayTime) {
          primaryStatus = 'due_out';
        } else {
          primaryStatus = 'occupied';
        }
      } else if (booking.status === 'stay_over') {
        primaryStatus = 'occupied';
      } else if (booking.status === 'confirmed') {
        primaryStatus = 'reserved';
      }
    }

    // 3. Housekeeping Status
    // "Dirty" is an overlay attribute, not mutually exclusive with Occupied
    const isDirty = housekeeping === 'dirty';

    // Derived UI State
    const isClean = !isDirty && !isOOO;
    // "Vacant Dirty" -> Checked Out usually
    const isCheckedOut = primaryStatus === 'vacant' && isDirty;

    return {
      roomName: room.roomName,
      suiteType: room.suiteType,
      statusId: roomStatus?.id, // Might be undefined if no status doc exists yet
      primaryStatus,
      isDirty,
      isClean,
      isOOO,
      isCheckedOut,
      guestName: booking?.guestDetails ? `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}` : null
    };
  };

  // --- DATA PROCESSING ---

  // Transform RoomTypes into View Models
  const allRoomStates = useMemo(() => {
    return roomTypes.map(room => getRoomState(room));
  }, [roomTypes, roomStatuses, bookings]);

  // Filter & Search
  const filteredRooms = useMemo(() => {
    let result = allRoomStates;
    if (auditSearch) {
      const lower = auditSearch.toLowerCase();
      result = result.filter(r =>
        r.roomName.toLowerCase().includes(lower) ||
        r.suiteType.toLowerCase().includes(lower) ||
        (r.guestName && r.guestName.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [allRoomStates, auditSearch]);

  // Grouping
  const grouped = useMemo(() => {
    const groups: Record<SuiteType, typeof allRoomStates> = {
      'Garden Suite': [],
      'Imperial Suite': [],
      'Ocean Suite': []
    };
    filteredRooms.forEach(r => {
      if (r.suiteType && groups[r.suiteType]) {
        groups[r.suiteType].push(r);
      }
    });
    return groups;
  }, [filteredRooms]);

  // Stats
  const getStats = (list: typeof allRoomStates) => ({
    total: list.length,
    occupied: list.filter(r => r.primaryStatus === 'occupied' || r.primaryStatus === 'due_out').length,
    clean: list.filter(r => r.isClean && !r.isOOO).length,
    dirty: list.filter(r => r.isDirty && !r.isOOO).length,
    ooo: list.filter(r => r.isOOO).length
  });

  const totalStats = getStats(filteredRooms);


  // --- HANDLERS ---

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Only select rooms that have a Status ID (meaning they exist in roomStatuses collection)
      // Or we need to handle creating status docs on the fly (complex).
      // For now, filter for statusId
      const selectables = filteredRooms.map(r => r.statusId).filter(Boolean) as string[];
      setSelectedRooms(selectables);
    } else {
      setSelectedRooms([]);
    }
  };

  const handleSelectGroup = (suite: SuiteType, checked: boolean) => {
    const groupRooms = grouped[suite];
    const ids = groupRooms.map(r => r.statusId).filter(Boolean) as string[];
    if (checked) {
      setSelectedRooms(prev => [...new Set([...prev, ...ids])]);
    } else {
      setSelectedRooms(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  const handleSelectRoom = (id: string | undefined, checked: boolean) => {
    if (!id) return;
    if (checked) {
      setSelectedRooms(prev => [...prev, id]);
    } else {
      setSelectedRooms(prev => prev.filter(cur => cur !== id));
    }
  };

  const handleBulkApply = async () => {
    if (!bulkAction || selectedRooms.length === 0) return;
    setIsApplying(true);
    try {
      if (bulkAction === 'clean' || bulkAction === 'dirty') {
        const status = bulkAction as 'clean' | 'dirty';
        await Promise.all(selectedRooms.map(id => onUpdateStatus(id, status)));
      }
      setSelectedRooms([]);
      setBulkAction('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsApplying(false);
    }
  };

  const renderStatusCell = (roomState: typeof allRoomStates[0], type: 'clean' | 'dirty' | 'ooo' | 'vacant') => {

    // Logic for which visual cell is "Active"
    let isActive = false;
    let bgColor = '';
    let textColor = '';
    let label = roomState.roomName;
    let subLabel: React.ReactNode = '';

    if (type === 'clean' && roomState.isClean) {
      isActive = true;
      bgColor = 'bg-green-50/60 border-green-100';
      textColor = 'text-green-800';
      if (roomState.primaryStatus === 'occupied') {
        subLabel = <span className="flex items-center gap-1 text-blue-600"><FaUser className="text-[10px]" /> Occupied</span>;
      } else if (roomState.primaryStatus === 'due_out') {
        subLabel = <span className="flex items-center gap-1 text-green-700 font-bold"><FaCheck className="text-[10px]" /> Ready</span>;
      } else {
        subLabel = 'Vacant';
      }
    }
    else if (type === 'dirty' && roomState.isDirty && !roomState.isOOO) {
      isActive = true;
      // Logic: If Occupied & Dirty -> Show here? Yes.
      bgColor = 'bg-red-50/60 border-red-100';
      textColor = 'text-red-900';

      if (roomState.primaryStatus === 'occupied') {
        subLabel = <span className="flex items-center gap-1 text-blue-600"><FaUser className="text-[10px]" /> Occupied</span>;
      } else if (roomState.primaryStatus === 'due_out') {
        subLabel = <span className="flex items-center gap-1 text-red-600"><FaClock className="text-[10px]" /> Due Out</span>;
      } else {
        subLabel = <span className="font-bold">CHECKED OUT</span>;
      }
    }
    else if (type === 'ooo' && roomState.isOOO) {
      isActive = true;
      bgColor = 'bg-gray-800 border-gray-900';
      textColor = 'text-white';
      subLabel = 'Maintenance';
    }

    if (!isActive) return <td className="p-0 border-r border-gray-100/50"></td>;

    return (
      <td className={`p-1 border-r border-gray-100/50 align-top transition-colors duration-200 ${bgColor}`}>
        <div className={`w-full h-full min-h-[48px] px-3 py-2 flex flex-col justify-center rounded-sm ${textColor}`}>
          <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
            {type === 'ooo' && <FaTools className="text-[10px] opacity-70" />}
            {type === 'clean' && <FaCheck className="text-[10px] opacity-70" />}
            {type === 'dirty' && <FaBroom className="text-[10px] opacity-70" />}
            {label}
          </div>
          <div className="text-[10px] opacity-90 font-medium uppercase tracking-tight leading-tight">
            {subLabel}
          </div>
          {roomState.guestName && type !== 'ooo' && (
            <div className="text-[9px] mt-1 pt-1 border-t border-black/5 opacity-80 truncate">
              {roomState.guestName}
            </div>
          )}
        </div>
      </td>
    );
  };

  if (!mounted) return null; // Hydration fix override

  return (
    <div className="space-y-6 animate-fade-in font-sans text-sm pb-10">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 border border-gray-100 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-blue-600 p-2 rounded-lg shadow-md transition-transform hover:scale-105">
            <FaBroom className="text-white w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800 text-xl tracking-tight">Housekeeping</h2>
            <p className="text-xs text-gray-500 font-medium">Real-time Room Status Matrix</p>
          </div>
          {selectedRooms.length > 0 && (
            <span className="ml-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-md font-bold animate-pulse">
              {selectedRooms.length} Selected
            </span>
          )}
          {totalStats.ooo > 0 && (
            <span className="ml-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-md font-bold flex items-center gap-1">
              <FaTools className="w-3 h-3" />
              {totalStats.ooo} Blocked
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative group w-full md:w-auto">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search rooms or guests..."
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none w-full md:w-64 transition-all shadow-sm hover:shadow-md"
            />
          </div>

          <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            <select
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="px-4 py-2 text-sm border-r border-gray-200 bg-gray-50/50 outline-none text-gray-700 font-semibold cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="">Bulk Actions</option>
              <option value="clean">Mark Selected Clean</option>
              <option value="dirty">Mark Selected Dirty</option>
            </select>
            <button
              onClick={handleBulkApply}
              disabled={!bulkAction || selectedRooms.length === 0 || isApplying}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-bold text-sm transition-all uppercase tracking-wide"
            >
              {isApplying ? '...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Professional Grid Table */}
      <div className="hidden md:block bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <th className="p-4 w-12 text-center border-r border-gray-100">
                  <input
                    type="checkbox"
                    onChange={e => handleSelectAll(e.target.checked)}
                    checked={selectedRooms.length > 0 && selectedRooms.length === filteredRooms.filter(r => r.statusId).length}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 w-48 border-r border-gray-100">Room Type</th>
                <th className="p-4 w-16 text-center bg-gray-50 border-r border-gray-100"><FaUser className="mx-auto text-gray-400" /></th>

                {/* Status Headers with subtle stripes */}
                <th className="p-4 border-r border-gray-100 text-center text-green-700 bg-green-50/40">Clean</th>
                <th className="p-4 border-r border-gray-100 text-center text-red-700 bg-red-50/40">Dirty</th>
                <th className="p-4 border-r border-gray-100 text-center text-gray-600 bg-gray-100/40">Out Of Order</th>
                <th className="p-4 text-center text-gray-700 bg-blue-50/40">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {/* Total Row */}
              <tr className="bg-gradient-to-r from-amber-50 to-orange-50/30 font-bold border-b border-gray-200 text-gray-800 shadow-sm">
                <td className="p-4 text-center text-gray-400 border-r border-gray-200/50">-</td>
                <td className="p-4 border-r border-gray-200/50 text-gray-900 font-extrabold tracking-wide">TOTAL</td>
                <td className="p-4 border-r border-gray-200/50 text-center">{totalStats.occupied}</td>
                <td className="p-4 border-r border-gray-200/50 text-center text-green-700">{totalStats.clean}</td>
                <td className="p-4 border-r border-gray-200/50 text-center text-red-700">{totalStats.dirty}</td>
                <td className="p-4 border-r border-gray-200/50 text-center text-gray-700">{totalStats.ooo}</td>
                <td className="p-4 text-center"></td>
              </tr>

              {suiteTypes.map(suite => {
                const suiteRooms = grouped[suite] || [];
                // Recalculate stats for suite
                const suiteStats = getStats(suiteRooms);
                const hasRooms = suiteRooms.length > 0;
                const isSuiteSelected = hasRooms && suiteRooms.every(r => r.statusId && selectedRooms.includes(r.statusId));

                return (
                  <React.Fragment key={suite}>
                    {/* Suite Header */}
                    <tr className="bg-gray-100/70 border-b border-gray-200 hover:bg-gray-100 transition-colors">
                      <td className="p-3 text-center border-r border-gray-200/50">
                        <input
                          type="checkbox"
                          checked={isSuiteSelected}
                          onChange={e => handleSelectGroup(suite, e.target.checked)}
                          className="w-3.5 h-3.5 text-gray-500 rounded border-gray-300 focus:ring-gray-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 pl-4 border-r border-gray-200/50 font-bold text-gray-700 text-xs uppercase tracking-wider">{suite}</td>
                      <td className="p-3 border-r border-gray-200/50 text-center font-semibold text-gray-600">{suiteStats.occupied}</td>
                      <td className="p-3 border-r border-gray-200/50 text-center text-green-700 font-bold bg-green-50/10">{suiteStats.clean}</td>
                      <td className="p-3 border-r border-gray-200/50 text-center text-red-700 font-bold bg-red-50/10">{suiteStats.dirty}</td>
                      <td className="p-3 border-r border-gray-200/50 text-center text-gray-700 font-bold bg-gray-50/30">{suiteStats.ooo}</td>
                      <td className="p-3 text-center"></td>
                    </tr>

                    {/* Room Rows */}
                    {suiteRooms.map(roomState => {
                      const isSelected = roomState.statusId ? selectedRooms.includes(roomState.statusId) : false;
                      const statusId = roomState.statusId; // Helper to pass to handler

                      return (
                        <tr key={roomState.roomName} className={`group border-b border-gray-50 hover:bg-blue-50/50 transition-colors ${isSelected ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-100' : ''}`}>
                          <td className="p-3 text-center border-r border-gray-100 align-top group-hover:border-blue-100/50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!roomState.statusId}
                              onChange={e => handleSelectRoom(roomState.statusId, e.target.checked)}
                              className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                            />
                          </td>
                          <td className="p-3 border-r border-gray-100 font-medium text-gray-600 align-top group-hover:border-blue-100/50 group-hover:text-blue-800 transition-colors">
                            {roomState.roomName}
                          </td>
                          <td className="p-3 border-r border-gray-100 text-center align-top bg-gray-50/30 group-hover:border-blue-100/50">
                            {roomState.primaryStatus === 'occupied' && <FaUser className="inline text-blue-500 group-hover:text-blue-600 transition-colors" />}
                            {roomState.primaryStatus === 'due_out' && !roomState.isClean && <FaClock className="inline text-red-400 group-hover:text-red-600 transition-colors" />}
                            {roomState.primaryStatus === 'vacant' && !roomState.isOOO && <span className="text-[10px] text-gray-300">-</span>}
                          </td>

                          {/* Render cells based on status */}
                          {renderStatusCell(roomState, 'clean')}
                          {renderStatusCell(roomState, 'dirty')}
                          {renderStatusCell(roomState, 'ooo')}

                          {/* Action Column */}
                          <td className="p-3 text-center align-top">
                            {statusId && (
                              <div className="flex justify-center gap-2">
                                {roomState.isDirty ? (
                                  <button
                                    onClick={() => onUpdateStatus(statusId, 'clean')}
                                    className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors shadow-sm"
                                    title="Mark Clean"
                                  >
                                    <FaCheck className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onUpdateStatus(statusId, 'dirty')}
                                    className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors shadow-sm"
                                    title="Mark Dirty"
                                  >
                                    <FaBroom className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredRooms.length === 0 && (
          <div className="text-center p-8 text-gray-400 bg-white rounded-lg border border-gray-200">
            No rooms found.
          </div>
        )}

        {filteredRooms.map((room) => {
          const isSelected = room.statusId ? selectedRooms.includes(room.statusId) : false;

          let borderColor = 'border-gray-200';
          let bgColor = 'bg-white';
          if (room.isOOO) { borderColor = 'border-gray-500'; bgColor = 'bg-gray-50'; }
          else if (room.isClean) { borderColor = 'border-green-500'; bgColor = 'bg-green-50/30'; }
          else if (room.isDirty) { borderColor = 'border-red-500'; bgColor = 'bg-red-50/30'; }

          if (isSelected) bgColor = 'bg-blue-50 ring-1 ring-blue-200';

          return (
            <div
              key={room.roomName}
              onClick={() => room.statusId && handleSelectRoom(room.statusId, !isSelected)}
              className={`relative p-4 rounded-xl shadow-sm border-l-4 ${borderColor} ${bgColor} transition-all active:scale-[0.99]`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">{room.roomName}</h3>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{room.suiteType}</span>
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-1">
                  {room.isOOO && <span className="px-2 py-0.5 bg-gray-800 text-white text-[10px] uppercase font-bold rounded">Maintenance</span>}
                  {!room.isOOO && room.isClean && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] uppercase font-bold rounded flex items-center gap-1"><FaCheck className="w-2 h-2" /> Clean</span>}
                  {!room.isOOO && room.isDirty && <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] uppercase font-bold rounded flex items-center gap-1"><FaBroom className="w-2 h-2" /> Dirty</span>}

                  {room.primaryStatus === 'occupied' && <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><FaUser className="w-2.5 h-2.5" /> Occupied</span>}
                  {room.primaryStatus === 'due_out' && <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1"><FaClock className="w-2.5 h-2.5" /> Due Out</span>}
                </div>
              </div>

              {/* Guest Info */}
              {room.guestName && (
                <div className="mt-2 mb-3 p-2 bg-white/60 rounded border border-gray-100 text-sm text-gray-700 flex items-center gap-2">
                  <FaUser className="text-gray-400 w-3 h-3" />
                  <span className="font-medium truncate">{room.guestName}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-400 font-medium">Select</span>
                </div>

                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {/* Individual Actions - Prevent selection trigger */}
                  {room.statusId && (
                    <>
                      {!room.isClean && (
                        <button
                          onClick={() => onUpdateStatus(room.statusId!, 'clean')}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded shadow-sm hover:bg-green-700 active:bg-green-800 transition-colors"
                        >
                          Mark Clean
                        </button>
                      )}
                      {room.isClean && !room.isOOO && (
                        <button
                          onClick={() => onUpdateStatus(room.statusId!, 'dirty')}
                          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-bold rounded shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          Mark Dirty
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2 px-4 text-xs text-gray-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Clean</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Dirty</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-800"></div> Out of Order</span>
        </div>
        <span className="italic opacity-70">Last updated: Just now</span>
      </div>
    </div>
  );
}
