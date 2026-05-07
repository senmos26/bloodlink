import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
