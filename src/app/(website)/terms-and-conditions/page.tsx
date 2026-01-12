"use client";

import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function TermsAndConditionsPage() {
    const lastUpdated = "January 12, 2026";
    const [activeSection, setActiveSection] = useState("agreement");

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]");
            let current = "agreement";
            sections.forEach((section) => {
                const sectionTop = (section as HTMLElement).offsetTop;
                if (window.scrollY >= sectionTop - 300) {
                    current = section.getAttribute("id") || "agreement";
                }
            });
            setActiveSection(current);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const sections = [
        { id: "agreement", title: "1. Agreement to Terms" },
        { id: "digital-services", title: "2. Digital Services & App" },
        { id: "bookings", title: "3. Bookings & Cancellations" },
        { id: "facilities", title: "4. Hotel Facilities" },
        { id: "dining", title: "5. Food & Beverage" },
        { id: "conduct", title: "6. Guest Conduct" },
        { id: "liability", title: "7. Liability & Disclaimer" },
        { id: "contact", title: "8. Contact Us" },
    ];

    const scrollToSection = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const offset = 200; // Adjust for header
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#fffcf6] pt-48 pb-24 text-[#202c3b]">
            <div className="container mx-auto px-4 md:px-6">

                {/* Header Section */}
                <div className="max-w-4xl mx-auto mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 font-playfair text-[#0a1a2b]">Terms & Conditions</h1>
                    <div className="w-24 h-1 bg-[#D4A373] mx-auto mb-6"></div>
                    <p className="text-gray-500 font-medium tracking-wide upppercase text-sm">Last Updated: {lastUpdated}</p>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Navigation Sidebar (Desktop) */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-40 space-y-1">
                            <h3 className="font-playfair text-xl font-bold mb-6 px-4">Contents</h3>
                            {sections.map((section) => (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    onClick={(e) => scrollToSection(section.id, e)}
                                    className={`block px-4 py-2 text-sm transition-all duration-300 border-l-2 ${activeSection === section.id
                                            ? 'border-[#D4A373] text-[#D4A373] font-medium pl-6'
                                            : 'border-transparent text-gray-500 hover:text-[#0a1a2b] hover:border-gray-200'
                                        }`}
                                >
                                    {section.title}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-16 max-w-4xl">

                        <section id="agreement" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">1. Agreement to Terms</h2>
                            <div className="prose prose-lg text-gray-600 leading-loose">
                                <p className="mb-4">
                                    These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and <strong>Sultan Palace Hotel</strong> ("we," "us" or "our"), concerning your access to and use of our website, mobile application ("App"), and on-premise services.
                                </p>
                                <p>
                                    By accessing our website, downloading our App, or physically staying at our property, you confirm that you have read, understood, and agreed to be bound by all of these Terms and Conditions. If you do not agree with all of these terms, you are expressly prohibited from using our services and must discontinue use immediately.
                                </p>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="digital-services" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">2. Digital Services & App Usage</h2>
                            <div className="space-y-6 text-gray-600 leading-loose">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#0a1a2b] mb-2 font-playfair">2.1 The Sultan Palace App</h3>
                                    <p>
                                        Our mobile application allows guests to manage book stays, order food, book spa treatments, and access hotel information. You agree to provide accurate, current, and complete information during the registration and ordering process.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#0a1a2b] mb-2 font-playfair">2.2 Account Security</h3>
                                    <p>
                                        You are responsible for maintaining the confidentiality of your account credentials. Any activity that occurs under your account is your responsibility. Please notify us immediately of any unauthorized use.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-[#0a1a2b] mb-2 font-playfair">2.3 Intellectual Property</h3>
                                    <p>
                                        The content, features, and functionality of our Website and App, including text, graphics, logos, and software, are the exclusive property of Sultan Palace Hotel and are protected by international copyright laws.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="bookings" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">3. Booking & Payment Policies</h2>
                            <div className="space-y-6 text-gray-600 leading-loose">
                                <ul className="list-none space-y-4">
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Check-in / Check-out:</strong> Check-in time is from 14:00 (2:00 PM). Check-out time is until 11:00 (11:00 AM). Late checkout is subject to availability and may incur additional charges (50% of room rate until 6:00 PM, 100% thereafter).</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Payment:</strong> A valid credit card is required to guarantee your reservation. We accept Visa, MasterCard, and American Express. Cash payments (USD/TZS) are accepted at the front desk.</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Cancellation (Standard):</strong> Cancellations made more than 48 hours before arrival are free of charge. Cancellations within 48 hours will be charged for the first night.</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>No-Shows:</strong> Failure to check in on the scheduled date without prior notice will result in a penalty charge of 100% of the total booking value.</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Minors:</strong> Guests under 18 years of age must be accompanied by an adult.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="facilities" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">4. Hotel Facilities & Services</h2>

                            <div className="grid md:grid-cols-2 gap-8 mt-8">
                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xl font-bold font-playfair mb-3 text-[#0a1a2b]">Values & Spa</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        Spa treatments are available by appointment. We recommend booking at least 24 hours in advance via the App or Reception. Arrive 15 minutes prior to your scheduled time.
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        *Cancellations within 4 hours of appointment time incur a 50% charge.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xl font-bold font-playfair mb-3 text-[#0a1a2b]">Fitness Center</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        The Gym is open from 6:00 AM to 9:00 PM. Usage is at your own risk. Proper athletic attire and footwear are required. Children under 16 are not permitted without adult supervision.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xl font-bold font-playfair mb-3 text-[#0a1a2b]">Swimming Pool & Beach</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        There is no lifeguard on duty. Swimming is at your own risk. Glassware is strictly prohibited in the pool and beach areas; please use the provided plasticware.
                                    </p>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-xl font-bold font-playfair mb-3 text-[#0a1a2b]">Laundry Service</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                        Standard service turnaround is 24 hours. Express service (4 hours) is available at a 50% surcharge. The hotel is not responsible for shrinkage or color fastness.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="dining" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">5. Food & Beverage Policy</h2>
                            <div className="space-y-6 text-gray-600 leading-loose">
                                <p>
                                    You may order food and beverages via the Sultan Palace Mobile App or by calling Room Service.
                                </p>
                                <ul className="list-none space-y-3">
                                    <li className="flex items-start gap-4">
                                        <span className="text-[#D4A373] mt-1.5 font-bold">1.</span>
                                        <span><strong>In-Room Dining:</strong> Available 24/7. A tray charge may apply. Please allow 30-45 minutes for preparation and delivery.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="text-[#D4A373] mt-1.5 font-bold">2.</span>
                                        <span><strong>Beach & Pool Ordering:</strong> Orders must be placed using the App's "Location Pin" feature or by notifying a server. Delivery is restricted to designated hotel zones.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="text-[#D4A373] mt-1.5 font-bold">3.</span>
                                        <span><strong>Alcohol:</strong> Following Zanzibar regulations and hotel policy, alcohol is served only to guests aged 18 and above. We reserve the right to refuse service to intoxicated guests.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="text-[#D4A373] mt-1.5 font-bold">4.</span>
                                        <span><strong>Food Safety:</strong> Outside food and delivery services are not permitted on hotel premises for health and safety reasons.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="conduct" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">6. Guest Conduct</h2>
                            <div className="space-y-4 text-gray-600 leading-loose">
                                <p>To ensure a relaxing environment for all, we ask guests to respect the following:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Quiet Hours:</strong> Please keep noise levels to a minimum between 10:00 PM and 7:00 AM.</li>
                                    <li><strong>Smoking:</strong> Smoking is prohibited in all indoor rooms and enclosed public spaces. Designated smoking areas are available outdoors. A cleaning fee of $200 applies for smoking in rooms.</li>
                                    <li><strong>Visitors:</strong> Non-registered guests are not permitted in guest rooms after 11:00 PM. They are welcome in the lobby and restaurant areas.</li>
                                    <li><strong>Damage to Property:</strong> Guests are liable for any damage caused to hotel property. The cost of repair or replacement will be charged to the guest's account.</li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="liability" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">7. Liability & Disclaimer</h2>
                            <div className="space-y-4 text-gray-600 leading-loose">
                                <p>
                                    <strong>Valuables:</strong> Electronic safes are provided in every room. The management accepts no liability for loss of money, jewelry, or other valuables not deposited in the main hotel safe.
                                </p>
                                <p>
                                    <strong>Force Majeure:</strong> The hotel cannot accept responsibility or pay any compensation where the performance of our contractual obligations is prevented or affected by force majeure (war, riot, terrorist activity, industrial dispute, natural or nuclear disaster, fire, adverse weather conditions, closure of airports/ports, etc.).
                                </p>
                                <p>
                                    <strong>Third-Party Services:</strong> Tours, excursions, and taxi services booked through our concierge are provided by independent third parties. The hotel is not liable for the acts or omissions of these third parties.
                                </p>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="contact" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">8. Contact Us</h2>
                            <div className="bg-[#f2efe9] p-8 rounded-xl">
                                <p className="text-gray-600 mb-6">
                                    If you have any questions regarding these Terms and Conditions, please contact our management team:
                                </p>
                                <div className="space-y-2 font-medium text-[#0a1a2b]">
                                    <p>Sultan Palace Hotel Management</p>
                                    <p>Dongwe, East Coast, Zanzibar, Tanzania</p>
                                    <p><a href="mailto:portalholdingsznz@gmail.com" className="text-[#D4A373] hover:underline">portalholdingsznz@gmail.com</a></p>
                                    <p><a href="tel:+255684888111" className="hover:text-[#D4A373] transition-colors">+255 684 888 111</a></p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
