import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo / Brand */}
        <div className="mb-8">
          <span className="text-2xl font-bold text-emerald-600 tracking-tight">
            OMANYE
          </span>
        </div>

        {/* 404 */}
        <p className="text-8xl font-bold text-emerald-600 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-gray-500 mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/donor/dashboard"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/donor/programs"
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Programs
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
