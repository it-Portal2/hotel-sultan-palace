import React, { Fragment, useState, useEffect } from "react";
import {
  Booking,
  updateBooking as updateBookingFirestore,
  getFoodOrder,
  getGuestService,
  getMasterData,
} from "@/lib/firestoreService";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import SettlementModal from "../front-desk/SettlementModal";
import FolioDetailsDrawer from "../front-desk/FolioDetailsDrawer";
import { generateInvoiceHTML } from "@/utils/invoiceGenerator";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  UserIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  DocumentTextIcon,
  PrinterIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  LinkIcon,
  IdentificationIcon,
  ClockIcon,
  BuildingOfficeIcon,
  TagIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  BriefcaseIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface BookingDetailsDrawerProps {
  booking: Booking;
  onClose: () => void;
  isOpen: boolean;
  initialIsEditing?: boolean;
  onUpdate?: () => void; // Callback to refresh parent list
  onCancelBooking?: (booking: Booking) => void; // Parent handler for cancellation
}

export default function BookingDetailsDrawer({
  booking: initialBooking,
  onClose,
  isOpen,
  initialIsEditing = false,
  onUpdate,
  onCancelBooking,
}: BookingDetailsDrawerProps) {
  const { showToast } = useToast();
  const router = useRouter();

  // Local state for booking data to support immediate edits
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [isEditing, setIsEditing] = useState(initialIsEditing);
  const [saving, setSaving] = useState(false);

  // Cashiering Data State
  const [companies, setCompanies] = useState<any[]>([]);
  const [travelAgents, setTravelAgents] = useState<any[]>([]);
  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [loadingCashiering, setLoadingCashiering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCashieringData();
    }
  }, [isOpen]);

  const loadCashieringData = async () => {
    setLoadingCashiering(true);
    try {
      const [comps, agents, sales] = await Promise.all([
        getMasterData("companies"),
        getMasterData("travelAgents"),
        getMasterData("salesPersons"),
      ]);
      setCompanies(comps.filter((c: any) => c.isActive));
      setTravelAgents(agents.filter((a: any) => a.isActive));
      setSalesPersons(sales.filter((s: any) => s.isActive));
    } catch (error) {
      console.error("Failed to load cashiering data", error);
    } finally {
      setLoadingCashiering(false);
    }
  };

  // Update local state when prop changes
  // Update local state when prop changes, but NOT if editing the same booking
  useEffect(() => {
    if (!isEditing || initialBooking.id !== booking.id) {
      setBooking(initialBooking);
    }
  }, [initialBooking, isEditing]);

  // Initial edit mode from prop
  useEffect(() => {
    setIsEditing(initialIsEditing);
  }, [initialIsEditing]);

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [showFolioDrawer, setShowFolioDrawer] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  // Derived Data
  const guests = booking.guests || { adults: 0, children: 0, rooms: 1 };
  const rooms = booking.rooms || [];
  const addOns = booking.addOns || [];
  const totalAmount = booking.totalAmount || 0;
  const isMarkedPaid =
    booking.paymentStatus === "paid" && (booking.paidAmount || 0) === 0;
  const paidAmount = isMarkedPaid ? totalAmount : booking.paidAmount || 0;
  const balance = totalAmount - paidAmount;
  const paymentProgress =
    totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0;
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const createdDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString()
    : "N/A";
  const sourceLabel = booking.source
    ? booking.source.replace("_", " ").toUpperCase()
    : "DIRECT";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "checked_in":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "checked_out":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // --- ACTIONS ---

  const handlePrintInvoice = async () => {
    try {
      // Fetch additional details
      let foodOrders: any[] = [];
      let guestServices: any[] = [];

      if (booking.foodOrderIds && booking.foodOrderIds.length > 0) {
        const orders = await Promise.all(
          booking.foodOrderIds.map((id) => getFoodOrder(id)),
        );
        // Filter: Include all valid orders regardless of payment status (so unpaid/charged-to-room orders appear)
        foodOrders = orders.filter(
          (o) =>
            o !== null && o.status !== "cancelled" && o.status !== "voided",
        );
      }

      if (booking.guestServiceIds && booking.guestServiceIds.length > 0) {
        const services = await Promise.all(
          booking.guestServiceIds.map((id) => getGuestService(id)),
        );
        guestServices = services.filter(
          (s) => s !== null && s.status !== "cancelled",
        );
      }

      let transactions: any[] = [];
      try {
        // Dynamic import to avoid circular dependency if needed, though direct import is fine if handled correctly
        const { getFolioTransactions } = await import("@/lib/firestoreService");
        transactions = await getFolioTransactions(booking.id);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      }

      const invoiceHTML = generateInvoiceHTML(
        booking,
        foodOrders,
        guestServices,
        transactions,
      );
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
      } else {
        showToast(
          "Popup blocked. Please allow popups to print invoice.",
          "error",
        );
      }
    } catch (error) {
      console.error("Print failed", error);
      showToast("Failed to generate invoice", "error");
    }
  };

  const handleSendEmail = () => {
    // This is a placeholder for sending the invoice email manually.
    // Currently we only have automatic emails.
    showToast(`Email feature for manual sending not yet implemented.`, "info");
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const { firstName, lastName, email, phone } = booking.guestDetails;

    if (!firstName?.trim()) newErrors.firstName = "First Name is required";
    if (!lastName?.trim()) newErrors.lastName = "Last Name is required";

    if (!email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!phone?.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = "Invalid phone format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    try {
      setSaving(true);
      await updateBookingFirestore(booking.id, {
        guestDetails: booking.guestDetails,
        address: booking.address,
        notes: booking.notes,
        companyId: booking.companyId,
        travelAgentId: booking.travelAgentId,
        salesPersonId: booking.salesPersonId,
      });
      showToast("Booking updated successfully", "success");
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Update failed", error);
      showToast("Failed to update booking", "error");
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderEditableInput = (
    label: string,
    value: string | undefined,
    onChange: (val: string) => void,
    type: string = "text",
    placeholder: string = "",
    error?: string,
  ) => {
    if (!isEditing) {
      return (
        <div>
          <label className="text-xs text-gray-500 font-medium uppercase">
            {label}
          </label>
          <p className="text-sm font-bold text-gray-900 truncate">
            {value || "-"}
          </p>
        </div>
      );
    }
    return (
      <div>
        <label className="text-xs text-blue-600 font-bold uppercase mb-1 block">
          {label}
        </label>
        <input
          type={type}
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            // Clear error for this field if it exists (basic approximation, ideal would be passing field name)
          }}
          placeholder={placeholder}
          className={`w-full px-2 py-1.5 border rounded text-sm outline-none focus:ring-2 focus:ring-blue-100 ${error ? "border-red-500 bg-red-50" : "border-blue-300"}`}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                    <div className="flex h-full flex-col bg-[#F3F4F6] shadow-2xl">
                      {/* Header */}
                      <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-20">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                            <DocumentTextIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <Dialog.Title className="text-lg font-bold text-gray-900">
                                Booking #
                                {booking.bookingId || booking.id.slice(0, 8)}
                              </Dialog.Title>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status || "pending")}`}
                              >
                                {booking.status?.replace("_", " ") || "Pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-3 w-3" /> Created:{" "}
                                {createdDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Edit Toggle */}
                          {!isEditing && booking.status !== "cancelled" && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <PencilSquareIcon className="h-4 w-4" /> Edit
                            </button>
                          )}

                          {/* Print & Email */}
                          <button
                            onClick={handlePrintInvoice}
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <PrinterIcon className="h-4 w-4" /> Print
                          </button>

                          <button
                            type="button"
                            className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                            onClick={onClose}
                          >
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-6">
                        {/* Edit Mode Save/Cancel Bar */}
                        {isEditing && (
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-blue-800 text-sm font-semibold">
                              <PencilSquareIcon className="h-5 w-5" /> Editing
                              Booking Details
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setBooking(initialBooking); // Revert
                                  setIsEditing(false);
                                }}
                                className="px-4 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md text-xs font-bold uppercase hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="px-4 py-1.5 bg-blue-600 text-white border border-blue-600 rounded-md text-xs font-bold uppercase hover:bg-blue-700 disabled:opacity-50"
                              >
                                {saving ? "Saving..." : "Save Changes"}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left Column */}
                          <div className="lg:col-span-2 space-y-6">
                            {/* Guest Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <UserIcon className="h-4 w-4 text-gray-500" />{" "}
                                  Guest Details
                                </h3>
                              </div>
                              <div className="p-5">
                                <div className="flex flex-col sm:flex-row gap-6">
                                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-2xl font-bold text-indigo-600">
                                      {booking.guestDetails.firstName?.[0]}
                                    </div>
                                  </div>

                                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                    {renderEditableInput(
                                      "First Name",
                                      booking.guestDetails.firstName,
                                      (v) =>
                                        setBooking({
                                          ...booking,
                                          guestDetails: {
                                            ...booking.guestDetails,
                                            firstName: v,
                                          },
                                        }),
                                      "text",
                                      "",
                                      errors.firstName,
                                    )}
                                    {renderEditableInput(
                                      "Last Name",
                                      booking.guestDetails.lastName,
                                      (v) =>
                                        setBooking({
                                          ...booking,
                                          guestDetails: {
                                            ...booking.guestDetails,
                                            lastName: v,
                                          },
                                        }),
                                      "text",
                                      "",
                                      errors.lastName,
                                    )}
                                    {renderEditableInput(
                                      "Email",
                                      booking.guestDetails.email,
                                      (v) =>
                                        setBooking({
                                          ...booking,
                                          guestDetails: {
                                            ...booking.guestDetails,
                                            email: v,
                                          },
                                        }),
                                      "email",
                                      "",
                                      errors.email,
                                    )}
                                    {renderEditableInput(
                                      "Phone",
                                      booking.guestDetails.phone,
                                      (v) =>
                                        setBooking({
                                          ...booking,
                                          guestDetails: {
                                            ...booking.guestDetails,
                                            phone: v,
                                          },
                                        }),
                                      "tel",
                                      "",
                                      errors.phone,
                                    )}

                                    <div className="sm:col-span-2">
                                      {renderEditableInput(
                                        "Address",
                                        booking.address?.address1,
                                        (v) =>
                                          setBooking({
                                            ...booking,
                                            address: {
                                              ...(booking.address || {}),
                                              address1: v,
                                            } as any,
                                          }),
                                      )}
                                    </div>

                                    {renderEditableInput(
                                      "City",
                                      booking.address?.city,
                                      (v) =>
                                        setBooking({
                                          ...booking,
                                          address: {
                                            ...(booking.address || {}),
                                            city: v,
                                          } as any,
                                        }),
                                    )}
                                    {renderEditableInput(
                                      "Country",
                                      booking.address?.country,
                                      (v) =>
                                        setBooking({
                                          ...booking,
                                          address: {
                                            ...(booking.address || {}),
                                            country: v,
                                          } as any,
                                        }),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Stay Info (View Only for now, editing dates is complex logic) */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <CalendarDaysIcon className="h-4 w-4 text-gray-500" />{" "}
                                  Stay Information
                                </h3>
                              </div>
                              <div className="p-5">
                                <div className="flex items-center justify-between bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 mb-6">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                                      Check-in
                                    </p>
                                    <p className="text-lg font-bold text-indigo-900">
                                      {new Date(
                                        booking.checkIn,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-indigo-700 font-bold uppercase mb-1">
                                      {nights} Nights
                                    </p>
                                    <div className="h-0.5 w-16 bg-indigo-200"></div>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">
                                      Check-out
                                    </p>
                                    <p className="text-lg font-bold text-indigo-900">
                                      {new Date(
                                        booking.checkOut,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
                                    Allocated Rooms
                                  </h4>
                                  <div className="space-y-2">
                                    {rooms.map((r, i) => (
                                      <div
                                        key={i}
                                        className="flex justify-between items-center bg-white border border-gray-200 rounded p-3"
                                      >
                                        <div>
                                          <span className="font-bold text-gray-800">
                                            {r.suiteType}
                                          </span>
                                          {r.allocatedRoomType && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                              Room {r.allocatedRoomType}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">
                                          ${r.price}/night
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />{" "}
                                  Notes
                                </h3>
                              </div>
                              <div className="p-5">
                                {isEditing ? (
                                  <textarea
                                    value={booking.notes || ""}
                                    onChange={(e) =>
                                      setBooking({
                                        ...booking,
                                        notes: e.target.value,
                                      })
                                    }
                                    className="w-full h-24 p-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    placeholder="Add booking notes here..."
                                  />
                                ) : (
                                  <p className="text-sm text-gray-600 italic bg-yellow-50 p-3 rounded border border-yellow-100">
                                    {booking.notes || "No notes available."}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Cashiering Info Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <BriefcaseIcon className="h-4 w-4 text-gray-500" />{" "}
                                  Source & Billing
                                </h3>
                                <button
                                  type="button"
                                  onClick={loadCashieringData}
                                  disabled={loadingCashiering}
                                  className={`p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${loadingCashiering ? "animate-spin" : ""}`}
                                  title="Refresh Companies & Agents"
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="p-5 space-y-4">
                                {/* Company / Bill to Company */}
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                      <BuildingOfficeIcon className="h-3 w-3" />{" "}
                                      Company
                                    </label>
                                    {booking.companyId && !isEditing && (
                                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold uppercase">
                                        Bill to Company
                                      </span>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <select
                                      value={booking.companyId || ""}
                                      onChange={(e) =>
                                        setBooking({
                                          ...booking,
                                          companyId:
                                            e.target.value || undefined,
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-indigo-200 rounded text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-indigo-50/30"
                                    >
                                      <option value="">-- None --</option>
                                      {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                          {c.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900">
                                      {companies.find(
                                        (c) => c.id === booking.companyId,
                                      )?.name || "-"}
                                    </p>
                                  )}
                                </div>

                                {/* Travel Agent */}
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                    <GlobeAltIcon className="h-3 w-3" /> Travel
                                    Agent
                                  </label>
                                  {isEditing ? (
                                    <select
                                      value={booking.travelAgentId || ""}
                                      onChange={(e) =>
                                        setBooking({
                                          ...booking,
                                          travelAgentId:
                                            e.target.value || undefined,
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-indigo-200 rounded text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-indigo-50/30"
                                    >
                                      <option value="">-- None --</option>
                                      {travelAgents.map((a) => (
                                        <option key={a.id} value={a.id}>
                                          {a.name} ({a.commissionRate}%)
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900">
                                      {travelAgents.find(
                                        (a) => a.id === booking.travelAgentId,
                                      )?.name || "-"}
                                    </p>
                                  )}
                                </div>

                                {/* Sales Person */}
                                <div>
                                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                    <UserGroupIcon className="h-3 w-3" /> Sales
                                    Person
                                  </label>
                                  {isEditing ? (
                                    <select
                                      value={booking.salesPersonId || ""}
                                      onChange={(e) =>
                                        setBooking({
                                          ...booking,
                                          salesPersonId:
                                            e.target.value || undefined,
                                        })
                                      }
                                      className="w-full px-2 py-1.5 border border-indigo-200 rounded text-sm focus:ring-2 focus:ring-indigo-100 outline-none bg-indigo-50/30"
                                    >
                                      <option value="">-- None --</option>
                                      {salesPersons.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.name}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900">
                                      {salesPersons.find(
                                        (s) => s.id === booking.salesPersonId,
                                      )?.name || "-"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Financials & Actions */}
                          <div className="space-y-6">
                            {/* Payment Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <CreditCardIcon className="h-4 w-4 text-gray-500" />{" "}
                                  Payment
                                </h3>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${balance <= 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}
                                >
                                  {balance <= 0 ? "PAID" : "PENDING"}
                                </span>
                              </div>
                              <div className="p-5">
                                <div className="space-y-3 mb-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                      Total Amount
                                    </span>
                                    <span className="font-bold text-gray-900">
                                      ${totalAmount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm text-emerald-600">
                                    <span className="">Paid</span>
                                    <span className="font-bold">
                                      -${paidAmount.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="h-px bg-gray-200"></div>
                                  <div className="flex justify-between text-lg font-bold">
                                    <span className="text-gray-900">
                                      Balance
                                    </span>
                                    <span
                                      className={
                                        balance > 0
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }
                                    >
                                      ${balance.toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() =>
                                      setIsSettlementModalOpen(true)
                                    }
                                    className="py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700"
                                  >
                                    Add Payment
                                  </button>
                                  <button
                                    onClick={() => setShowFolioDrawer(true)}
                                    className="py-2 bg-white text-gray-700 border border-gray-300 text-xs font-bold rounded hover:bg-gray-50"
                                  >
                                    View Folio
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Danger Zone: Cancel */}
                            {booking.status !== "cancelled" &&
                              booking.status !== "checked_out" && (
                                <div className="bg-red-50 rounded-xl p-5 border border-red-100 mt-6">
                                  <h4 className="text-xs font-bold text-red-800 uppercase mb-2">
                                    Cancellation
                                  </h4>
                                  <p className="text-xs text-red-600 mb-4">
                                    Cancelling will release rooms and notify the
                                    guest.
                                  </p>
                                  <button
                                    onClick={() =>
                                      setShowCancelConfirmation(true)
                                    }
                                    className="w-full py-2 bg-white border border-red-300 text-red-600 text-xs font-bold rounded hover:bg-red-600 hover:text-white transition-colors"
                                  >
                                    Cancel Booking
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <SettlementModal
        open={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        booking={booking}
        onPaymentSuccess={() => {
          setIsSettlementModalOpen(false);
          if (onUpdate) onUpdate(); // Refresh parent to get new totals?
        }}
      />

      {showFolioDrawer && (
        <FolioDetailsDrawer
          booking={booking}
          open={showFolioDrawer}
          onClose={() => setShowFolioDrawer(false)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      <Transition appear show={showCancelConfirmation} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[60]"
          onClose={() => setShowCancelConfirmation(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border-l-4 border-red-500">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2"
                  >
                    <div className="p-2 bg-red-100 rounded-full text-red-600">
                      <TrashIcon className="h-5 w-5" />
                    </div>
                    Confirm Cancellation
                  </Dialog.Title>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this booking? This will
                      release the allocated rooms and cannot be easily undone.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                      onClick={() => setShowCancelConfirmation(false)}
                    >
                      No, Keep Booking
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      onClick={() => {
                        if (onCancelBooking) onCancelBooking(booking);
                        setShowCancelConfirmation(false);
                        onClose();
                      }}
                    >
                      Yes, Cancel Booking
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
