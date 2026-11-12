export function AuthCard({ title, subtitle, children }) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-3xl font-semibold text-black">{title}</h1>
        <p className="mt-2 text-center text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export function Field({ label, error, hint, ...props }) {
  return (
    <label className="mb-4 block">
      <span className="text-sm font-medium text-black">{label}</span>
      <input
        {...props}
        aria-invalid={!!error}
        className={`mt-1 h-10 w-full rounded-md border px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 ${
          error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-black focus:ring-black"
        }`}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span>
             : hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export const PrimaryButton = ({ children, ...p }) => (
  <button {...p} className="h-11 w-full rounded-md bg-black text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">
    {children}
  </button>
);