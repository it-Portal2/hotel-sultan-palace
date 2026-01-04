import React from 'react';

interface PremiumLoaderProps {
    size?: 'default' | 'small';
    className?: string; // Allow custom classes for positioning/margins
}

const PremiumLoader = ({ size = 'default', className = '' }: PremiumLoaderProps) => {
    if (size === 'small') {
        return (
            <div className={`relative flex items-center justify-center w-5 h-5 ${className}`}>
                <div className="absolute inset-0 rounded-full border-2 border-gray-100/50"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin duration-1000"></div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            <div className="relative flex items-center justify-center w-16 h-16">
                {/* Outer Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-100/50"></div>
                {/* Spinning Ring */}
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin duration-1000"></div>
                {/* Inner Pulse */}
                <div className="absolute w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,106,0,0.4)]"></div>
            </div>
            <div className="mt-4 flex flex-col items-center">
                <p className="text-sm font-semibold text-gray-700 tracking-widest uppercase animate-pulse">
                    Loading
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                    Please wait...
                </p>
            </div>
        </div>
    );
};

export default PremiumLoader;
