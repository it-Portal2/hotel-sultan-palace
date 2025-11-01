import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFCF6] px-4">
      <div className="max-w-md w-full bg-white border border-orange-100 rounded-3xl p-8 shadow-xl text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-600">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Go to Home</Link>
        </div>
      </div>
    </div>
  );
}


