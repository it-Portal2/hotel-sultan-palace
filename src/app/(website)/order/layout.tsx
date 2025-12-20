import React from 'react';
import { ToastProvider } from '@/context/ToastContext';
import { CartProvider } from '@/app/context/CartContext';

export const metadata = {
    title: 'Sultan Palace Kitchen - Guest Order',
    description: 'Order fresh meals directly to your room or pool side.',
};

export default function OrderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <CartProvider>
                <div className="min-h-screen bg-gray-50 flex justify-center">
                    <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative">
                        {children}
                    </div>
                </div>
            </CartProvider>
        </ToastProvider>
    );
}
