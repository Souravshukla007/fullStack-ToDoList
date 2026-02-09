"use client";

import { useEffect, useState } from "react";

export default function WelcomePopup({ show, name }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show) return;

    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4">
      <div className="rounded-2xl border border-white/40 bg-white/90 px-10 py-8 text-center shadow-2xl backdrop-blur">
        <img
          src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMDY3Nmk3dnJrcmd0MTkxOWFiaGpuYWoweGo4YWd1cHJ0amE3OHp1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cmr1OMJ2FN0B2/giphy.gif"
          alt="Welcome animation"
          className="mx-auto mb-4 h-60 w-60 rounded-xl object-cover"
        />
        <p className="text-xl font-bold text-slate-800">Welcome Back{name ? `, ${name}` : ""}</p>
      </div>
    </div>
  );
}
