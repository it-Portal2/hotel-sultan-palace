"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  Shield,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Mail,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

const DELETION_REASONS = [
  "Privacy concerns",
  "No longer using the app",
  "Found an alternative service",
  "Too many notifications",
  "Dissatisfied with service",
  "Other",
];

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function DeleteAccountPage() {
  const [activeSection, setActiveSection] = useState("how-it-works");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      let current = "how-it-works";
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 300) {
          current = section.getAttribute("id") || "how-it-works";
        }
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sections = [
    { id: "how-it-works", title: "1. How It Works" },
    { id: "what-gets-deleted", title: "2. What Gets Deleted" },
    { id: "what-we-retain", title: "3. What We Retain" },
    { id: "request-form", title: "4. Request Deletion" },
    { id: "important-notes", title: "5. Important Notes" },
    { id: "contact", title: "6. Contact Us" },
  ];

  const scrollToSection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 200;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!confirmChecked) {
      setStatus("error");
      setMessage(
        "Please confirm that you understand this action is irreversible.",
      );
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reason, comments }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
        setReason("");
        setComments("");
        setConfirmChecked(false);
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage(
        "Unable to submit your request. Please try again or contact us directly.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#fffcf6] pt-48 pb-24 text-[#202c3b]">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-playfair text-[#0a1a2b]">
            Delete Your Account
          </h1>
          <div className="w-24 h-1 bg-[#D4A373] mx-auto mb-6"></div>
          <p className="text-gray-500 font-medium text-base max-w-2xl mx-auto leading-relaxed">
            We&apos;re sorry to see you go. Use this page to request deletion of
            your Sultan Palace Hotel account and associated data.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-40 space-y-1">
              <h3 className="font-playfair text-xl font-bold mb-6 px-4">
                Contents
              </h3>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => scrollToSection(section.id, e)}
                  className={`block px-4 py-2 text-sm transition-all duration-300 border-l-2 ${
                    activeSection === section.id
                      ? "border-[#D4A373] text-[#D4A373] font-medium pl-6"
                      : "border-transparent text-gray-500 hover:text-[#0a1a2b] hover:border-gray-200"
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-16 max-w-4xl">
            {/* Section 1: How It Works */}
            <section id="how-it-works" className="scroll-mt-60">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-8 text-[#0a1a2b]">
                1. How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Send,
                    step: "Step 1",
                    title: "Submit Request",
                    desc: "Enter your registered email and submit the deletion request form below.",
                  },
                  {
                    icon: Shield,
                    step: "Step 2",
                    title: "We Verify",
                    desc: "Our team verifies your identity and processes the request within 7 business days.",
                  },
                  {
                    icon: CheckCircle,
                    step: "Step 3",
                    title: "Account Deleted",
                    desc: "Your account and associated data are permanently removed from our systems.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative p-6 bg-white border border-gray-100 rounded-xl text-center group hover:border-[#D4A373]/30 transition-colors duration-300"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D4A373]/10 flex items-center justify-center">
                      <item.icon size={22} className="text-[#D4A373]" />
                    </div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-[#D4A373] mb-2">
                      {item.step}
                    </p>
                    <h3 className="font-playfair font-bold text-lg text-[#0a1a2b] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                    {i < 2 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                        <ChevronRight size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="w-full h-px bg-gray-200/60"></div>

            {/* Section 2: What Gets Deleted */}
            <section id="what-gets-deleted" className="scroll-mt-60">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">
                2. What Gets Deleted
              </h2>
              <p className="text-gray-600 leading-loose mb-6">
                When your account deletion request is processed, the following
                data will be <strong>permanently removed</strong> from our
                systems:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Profile Information",
                    desc: "Name, email, phone number, profile photo",
                  },
                  {
                    title: "Booking History",
                    desc: "Past and upcoming reservation details",
                  },
                  {
                    title: "Order History",
                    desc: "Food orders, spa bookings, activity records",
                  },
                  {
                    title: "Preferences & Settings",
                    desc: "Room preferences, dietary requirements, saved settings",
                  },
                  {
                    title: "App Data",
                    desc: "Push notification tokens, device info, usage data",
                  },
                  {
                    title: "Communication History",
                    desc: "Support conversations, feedback, and reviews",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-4 bg-white rounded-lg border border-gray-100"
                  >
                    <Trash2
                      size={16}
                      className="text-red-400 mt-1 flex-shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-[#0a1a2b] text-sm">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="w-full h-px bg-gray-200/60"></div>

            {/* Section 3: What We Retain */}
            <section id="what-we-retain" className="scroll-mt-60">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">
                3. What We May Retain
              </h2>
              <p className="text-gray-600 leading-loose mb-6">
                In accordance with Tanzanian law and regulatory requirements, we
                may need to retain certain data even after account deletion:
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: "Financial & Tax Records",
                    desc: "Transaction records, invoices, and payment receipts are retained for 7 years as required by Tanzanian tax regulations.",
                    period: "7 years",
                  },
                  {
                    title: "Legal & Compliance Data",
                    desc: "Guest registration records required by immigration and local hospitality laws.",
                    period: "As required by law",
                  },
                  {
                    title: "Anonymized Analytics",
                    desc: "Aggregated, non-identifiable usage statistics that cannot be linked back to you.",
                    period: "Indefinite",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-5 bg-[#f2efe9] rounded-xl"
                  >
                    <Shield
                      size={18}
                      className="text-[#D4A373] mt-1 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <p className="font-semibold text-[#0a1a2b]">
                          {item.title}
                        </p>
                        <span className="text-xs font-medium bg-[#D4A373]/15 text-[#a07d50] px-2.5 py-1 rounded-full whitespace-nowrap">
                          {item.period}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="w-full h-px bg-gray-200/60"></div>

            {/* Section 4: Request Form */}
            <section id="request-form" className="scroll-mt-60">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">
                4. Request Account Deletion
              </h2>

              {status === "success" ? (
                <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={32} className="text-green-600" />
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-green-800 mb-2">
                    Request Submitted Successfully
                  </h3>
                  <p className="text-green-700 leading-relaxed max-w-lg mx-auto">
                    {message}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="deletion-email"
                      className="block text-sm font-semibold text-[#0a1a2b] mb-2"
                    >
                      <Mail size={14} className="inline mr-2 opacity-60" />
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="deletion-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email address"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#0a1a2b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A373]/40 focus:border-[#D4A373] transition-all"
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label
                      htmlFor="deletion-reason"
                      className="block text-sm font-semibold text-[#0a1a2b] mb-2"
                    >
                      <HelpCircle
                        size={14}
                        className="inline mr-2 opacity-60"
                      />
                      Reason for Deletion{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <select
                      id="deletion-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#0a1a2b] focus:outline-none focus:ring-2 focus:ring-[#D4A373]/40 focus:border-[#D4A373] transition-all appearance-none"
                    >
                      <option value="">Select a reason...</option>
                      {DELETION_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Comments */}
                  <div>
                    <label
                      htmlFor="deletion-comments"
                      className="block text-sm font-semibold text-[#0a1a2b] mb-2"
                    >
                      <MessageSquare
                        size={14}
                        className="inline mr-2 opacity-60"
                      />
                      Additional Comments{" "}
                      <span className="text-gray-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      id="deletion-comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Any additional information you'd like to share..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[#0a1a2b] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4A373]/40 focus:border-[#D4A373] transition-all resize-none"
                    />
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmChecked}
                        onChange={(e) => setConfirmChecked(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-400 accent-red-500 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        I understand that deleting my account is{" "}
                        <strong>permanent and irreversible</strong>. All my
                        personal data, booking history, and preferences will be
                        permanently removed.
                      </span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {status === "error" && message && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertTriangle
                        size={18}
                        className="text-red-500 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm text-red-700">{message}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full sm:w-auto px-8 py-3.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === "submitting" ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Request Account Deletion
                      </>
                    )}
                  </button>
                </form>
              )}
            </section>

            <div className="w-full h-px bg-gray-200/60"></div>

            {/* Section 5: Important Notes */}
            <section id="important-notes" className="scroll-mt-60">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">
                5. Important Notes
              </h2>
              <div className="space-y-4 text-gray-600 leading-loose">
                <ul className="list-none space-y-4">
                  {[
                    {
                      icon: Clock,
                      text: "Deletion requests are processed within **7 business days**. You will receive a confirmation email once complete.",
                    },
                    {
                      icon: AlertTriangle,
                      text: "If you have **active or upcoming bookings**, they must be completed or cancelled before your account can be deleted.",
                    },
                    {
                      icon: Shield,
                      text: "Account deletion is **permanent and irreversible**. Once deleted, your data cannot be recovered.",
                    },
                    {
                      icon: Trash2,
                      text: 'This page is provided by **Sultan Palace Hotel** for the "Sultan Palace" mobile application available on Google Play Store.',
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-[#D4A373] mt-1 flex-shrink-0">
                        <item.icon size={16} />
                      </span>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: item.text.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-[#0a1a2b]">$1</strong>',
                          ),
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <div className="w-full h-px bg-gray-200/60"></div>

            {/* Section 6: Contact */}
            <section id="contact" className="scroll-mt-60">
              <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">
                6. Contact Us
              </h2>
              <div className="bg-[#f2efe9] p-8 rounded-xl">
                <p className="text-gray-600 mb-6">
                  If you prefer to request account deletion manually, or have
                  any questions, please contact us directly:
                </p>
                <div className="space-y-2 font-medium text-[#0a1a2b]">
                  <p>Sultan Palace Hotel — Data Protection</p>
                  <p>
                    <a
                      href="mailto:portalholdingsznz@gmail.com"
                      className="text-[#D4A373] hover:underline"
                    >
                      portalholdingsznz@gmail.com
                    </a>
                  </p>
                  <p>
                    Phone:{" "}
                    <a
                      href="tel:+255684888111"
                      className="hover:text-[#D4A373] transition-colors"
                    >
                      +255 684 888 111
                    </a>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
