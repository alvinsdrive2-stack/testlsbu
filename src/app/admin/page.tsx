import { verifyAdmin } from "@/lib/session";

export default async function AdminDashboardPage() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return <p>Sesi tidak valid.</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      <p className="mt-2 text-gray-600">
        Placeholder — modul builder dan kegiatan menyusul.
      </p>
    </main>
  );
}
