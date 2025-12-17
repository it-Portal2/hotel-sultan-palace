import { CartProvider } from "@/context/CartContext";
import { BookingEnquiryProvider } from "@/context/BookingEnquiryContext";
import NotificationListener from "@/components/notifications/NotificationListener";
import NotificationPermission from "@/components/notifications/NotificationPermission";
import OfferNotificationManager from "@/components/notifications/OfferNotificationManager";
import WhatsAppButton from "@/components/WhatsAppButton";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <BookingEnquiryProvider>
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <Footer />
                </div>
                <NotificationListener />
                <NotificationPermission />
                <OfferNotificationManager />
                <WhatsAppButton />
            </BookingEnquiryProvider>
        </CartProvider>
    );
}

