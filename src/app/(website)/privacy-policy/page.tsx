"use client";

import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
    const lastUpdated = "January 12, 2026";
    const [activeSection, setActiveSection] = useState("intro");

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll("section[id]");
            let current = "intro";
            sections.forEach((section) => {
                const sectionTop = (section as HTMLElement).offsetTop;
                if (window.scrollY >= sectionTop - 300) {
                    current = section.getAttribute("id") || "intro";
                }
            });
            setActiveSection(current);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const sections = [
        { id: "intro", title: "1. Introduction" },
        { id: "collection", title: "2. Information We Collect" },
        { id: "app-data", title: "3. App & Device Data" },
        { id: "usage", title: "4. How We Use Your Data" },
        { id: "sharing", title: "5. Data Sharing" },
        { id: "security", title: "6. Data Security" },
        { id: "rights", title: "7. Your Rights" },
        { id: "contact", title: "8. Contact Us" },
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
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 font-playfair text-[#0a1a2b]">Privacy Policy</h1>
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

                        <section id="intro" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">1. Introduction</h2>
                            <div className="prose prose-lg text-gray-600 leading-loose">
                                <p className="mb-4">
                                    Sultan Palace Hotel ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This privacy policy informs you about how we look after your personal data when you visit our website, use our mobile application ("App"), or stay at our hotel, and tells you about your privacy rights and how the law protects you.
                                </p>
                                <p>
                                    By using our Services, you agree to the collection and use of information in accordance with this policy.
                                </p>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="collection" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">2. Information We Collect</h2>
                            <div className="space-y-6 text-gray-600 leading-loose">
                                <p>We collect different types of information for the various purposes of providing our Services to you:</p>
                                <ul className="list-none space-y-4">
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Identity Data:</strong> First name, last name, username, title, date of birth, and gender. Guest ID/Passport copies are collected at check-in as required by local law.</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Contact Data:</strong> Billing address, delivery address, email address, and telephone numbers.</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Financial Data:</strong> Bank account and payment card details (processed securely via our payment providers).</span>
                                    </li>
                                    <li className="flex gap-4">
                                        <span className="text-[#D4A373] mt-1"><ChevronRight size={16} /></span>
                                        <span><strong>Transaction Data:</strong> Details about payments to and from you and other details of products (spa, food, tours) and services you have purchased from us.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="app-data" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">3. App & Device Data</h2>
                            <div className="space-y-6 text-gray-600 leading-loose">
                                <p>When you use the Sultan Palace Mobile App, we may collect specific information to facilitate the service:</p>
                                <div className="grid md:grid-cols-2 gap-8 mt-4">
                                    <div className="p-5 bg-white border border-gray-100 rounded-xl">
                                        <h4 className="font-bold font-playfair text-[#0a1a2b] mb-2">Location Information</h4>
                                        <p className="text-sm">With your permission, we may use your location to deliver orders to your exact spot on the beach or pool area, or to help you navigate the resort.</p>
                                    </div>
                                    <div className="p-5 bg-white border border-gray-100 rounded-xl">
                                        <h4 className="font-bold font-playfair text-[#0a1a2b] mb-2">Device Information</h4>
                                        <p className="text-sm">We collect information about the mobile device you use to access our App, including the hardware model, operating system and version, and mobile network information.</p>
                                    </div>
                                    <div className="p-5 bg-white border border-gray-100 rounded-xl">
                                        <h4 className="font-bold font-playfair text-[#0a1a2b] mb-2">Usage Data</h4>
                                        <p className="text-sm">We track how you interact with our App (e.g., features used, time spent) to improve user experience and app performance.</p>
                                    </div>
                                    <div className="p-5 bg-white border border-gray-100 rounded-xl">
                                        <h4 className="font-bold font-playfair text-[#0a1a2b] mb-2">Push Notifications</h4>
                                        <p className="text-sm">With your consent, we send notifications regarding your booking status, order updates (food/spa), and special resort offers.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="usage" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">4. How We Use Your Data</h2>
                            <div className="space-y-4 text-gray-600 leading-loose">
                                <p>We use your data to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Process your hotel reservations and payments.</li>
                                    <li>Manage your check-in and check-out process.</li>
                                    <li>Fulfill your orders for room service, spa treatments, and activities.</li>
                                    <li>Personalize your experience (e.g., remembering room preferences or dietary restrictions).</li>
                                    <li>Provide customer support and resolve issues.</li>
                                    <li>Send you technical notices, updates, security alerts, and support messages.</li>
                                    <li>With your consent, send marketing communications about promotions and events.</li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="sharing" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">5. Data Sharing</h2>
                            <div className="space-y-4 text-gray-600 leading-loose">
                                <p>
                                    We do not sell your personal data. We may share your data with:
                                </p>
                                <ul className="list-none space-y-3">
                                    <li className="flex gap-3">
                                        <span className="font-bold text-[#0a1a2b] min-w-[120px]">Service Providers:</span>
                                        <span>Third-party vendors who provide services such as payment processing, data analysis, email delivery, hosting services, and customer service.</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-bold text-[#0a1a2b] min-w-[120px]">Legal Authorities:</span>
                                        <span>When required by law or in response to valid requests by public authorities (e.g., police or immigration).</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="security" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">6. Data Security</h2>
                            <div className="space-y-4 text-gray-600 leading-loose">
                                <p>
                                    We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We use SSL encryption for data transmission and limit access to your personal data to those employees, agents, and contractors who have a business need to know.
                                </p>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="rights" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">7. Your Legal Rights</h2>
                            <div className="space-y-4 text-gray-600 leading-loose">
                                <p>
                                    Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Request access to your personal data.</li>
                                    <li>Request correction of your personal data.</li>
                                    <li>Request erasure of your personal data.</li>
                                    <li>Object to processing of your personal data.</li>
                                    <li>Request restriction of processing your personal data.</li>
                                    <li>Request transfer of your personal data.</li>
                                    <li>Withdraw consent.</li>
                                </ul>
                            </div>
                        </section>

                        <div className="w-full h-px bg-gray-200/60"></div>

                        <section id="contact" className="scroll-mt-60">
                            <h2 className="text-2xl md:text-3xl font-bold font-playfair mb-6 text-[#0a1a2b]">8. Contact Us</h2>
                            <div className="bg-[#f2efe9] p-8 rounded-xl">
                                <p className="text-gray-600 mb-6">
                                    If you have any questions about this privacy policy or our privacy practices, please contact us at:
                                </p>
                                <div className="space-y-2 font-medium text-[#0a1a2b]">
                                    <p>Sultan Palace Hotel - Data Protection Officer</p>
                                    <p><a href="mailto:portalholdingsznz@gmail.com" className="text-[#D4A373] hover:underline">portalholdingsznz@gmail.com</a></p>
                                    <p>Phone: <a href="tel:+255684888111" className="hover:text-[#D4A373] transition-colors">+255 684 888 111</a></p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
