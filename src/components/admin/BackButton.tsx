"use client";

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BackButtonProps {
  href: string;
  label?: string;
}

export default function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-[#202c3b] hover:text-[#FF6A00] transition-colors mb-4 group"
    >
      <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

