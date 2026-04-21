import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center max-w-md">
        <div className="font-display text-[120px] font-black leading-none text-brand-500">
          404
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold">
          That page took a wrong turn.
        </h1>
        <p className="mt-3 text-ink-600">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 font-semibold text-white hover:bg-ink-800"
        >
          Take me home
        </Link>
      </div>
    </div>
  );
}
