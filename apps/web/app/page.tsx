import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-semibold">Home</h1>
      <div className="mt-4">
        <Link href="/catalog" className="underline">
          Go to Catalog
        </Link>
      </div>
    </main>
  );
}
