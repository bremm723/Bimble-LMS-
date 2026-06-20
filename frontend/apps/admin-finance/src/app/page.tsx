export default function AdminFinanceHomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#0A2540]">Bimbel Admin & Keuangan</h1>
          <p className="mt-4 text-neutral-600">
            Dashboard administrasi dan keuangan. Silakan login untuk melanjutkan.
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex items-center rounded-lg bg-[#0A2540] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0A2540]/90 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
