'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container py-5 mt-5 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 className="mb-4">Something went wrong!</h2>
      <p className="text-muted mb-5">
        We encountered an unexpected error. Our team has been notified.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <button
          onClick={() => reset()}
          className="btn btn-primary px-4 py-2 rounded-pill"
        >
          Try Again
        </button>
        <Link href="/" className="btn btn-outline-secondary px-4 py-2 rounded-pill">
          Go Home
        </Link>
      </div>
    </div>
  );
}
