"use client";

import { useEffect, useRef, useState } from "react";

export default function LogoutForm({ action, className = "" }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const confirmLogout = () => {
    if (formRef.current) formRef.current.requestSubmit();
  };

  return (
    <>
      <form ref={formRef} action={action}>
        <button type="button" onClick={() => setOpen(true)} className={className}>Logout</button>
      </form>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/40 bg-white/90 p-5 shadow-2xl backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-800">Confirm Logout</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to escape?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-800"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
