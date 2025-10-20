"use client";
import { ReactNode } from "react";

interface BookNowButtonProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "outline" | "dark";
  size?: "sm" | "md" | "lg";
}

export default function BookNowButton({
  children = "Book Now",
  className = "",
  onClick,
  href,
  variant = "primary",
  size = "md"
}: BookNowButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-quicksand font-semibold text-white transition-all duration-300 ease-out overflow-hidden group";

  const sizeClasses = {
    sm: "px-4 py-2 text-sm rounded-md",
    md: "px-6 py-3 text-base rounded-lg",
    lg: "px-8 py-4 text-lg rounded-lg"
  };

  const variantClasses = {
    primary: "bg-[#FF6A00]",
    outline: "border-2 border-white bg-transparent hover:bg-white hover:text-black",
    dark: "bg-[#1D2A3A]"
  };

  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const circleColor = variant === 'primary' ? 'bg-[#1D2A3A]' : 'bg-[#FF6A00]';

  const content = (
    <>
      <span className="relative z-10">{children}</span>

      {(variant === 'primary' || variant === 'dark') && (
        <div
          className={`
            absolute
            w-50
            h-50
            rounded-full
            ${circleColor}
            transition-all
            duration-400
            ease-in-out

            // 1. STARTS HIDDEN at the bottom-left, outside the button
            -bottom-50
            -left-30

            // 2. ON HOVER, it slides into view to cover the left side
            group-hover:bottom-[-3rem]
            group-hover:left-[-3rem]
          `}
        ></div>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={buttonClasses}>
      {content}
    </button>
  );
}