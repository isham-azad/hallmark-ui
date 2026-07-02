import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-5 mt-5 text-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 className="display-1 fw-bold" style={{ color: 'var(--accent-color)' }}>404</h1>
      <h2 className="mb-4">Page Not Found</h2>
      <p className="lead mb-5 text-muted">
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Link href="/" className="btn btn-primary px-4 py-2 rounded-pill">
          Back to Home
        </Link>
        <Link href="/shop" className="btn btn-outline-secondary px-4 py-2 rounded-pill">
          Visit Shop
        </Link>
      </div>
    </div>
  );
}
