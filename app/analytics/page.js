import prisma from "../../lib/prisma";
import { requireUserId } from "../../lib/auth";

export const dynamic = "force-dynamic";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function label(date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default async function AnalyticsPage() {
  const userId = await requireUserId();
  const now = new Date();
  const startToday = startOfDay(now);
  const weekStart = addDays(startToday, -6);

  const [totals, completedThisWeek, completedHistory] = await Promise.all([
    prisma.item.aggregate({
      _count: { _all: true },
      where: { userId },
    }),
    prisma.item.count({
      where: {
        userId,
        completed: true,
        completedAt: { gte: weekStart },
      },
    }),
    prisma.item.findMany({
      where: { userId, completed: true, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
    }),
  ]);

  const activeCount = await prisma.item.count({ where: { userId, completed: false } });
  const completedCount = await prisma.item.count({ where: { userId, completed: true } });

  const dailyMap = new Map();
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    dailyMap.set(dateKey(d), 0);
  }

  completedHistory.forEach((row) => {
    if (!row.completedAt) return;
    const key = dateKey(row.completedAt);
    if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
  });

  let streak = 0;
  const completedDaySet = new Set(completedHistory.map((r) => (r.completedAt ? dateKey(r.completedAt) : null)).values());
  for (let i = 0; i < 365; i++) {
    const d = addDays(startToday, -i);
    if (completedDaySet.has(dateKey(d))) streak += 1;
    else break;
  }

  const chartData = Array.from(dailyMap.entries()).map(([k, v]) => ({
    day: label(k),
    value: v,
  }));
  const maxVal = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
          <a href="/" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">Back to todos</a>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-xs text-slate-500">Total tasks</p>
            <p className="text-2xl font-bold text-slate-800">{totals._count._all}</p>
          </div>
          <div className="rounded-xl bg-emerald-100 p-4">
            <p className="text-xs text-emerald-700">Completed</p>
            <p className="text-2xl font-bold text-emerald-800">{completedCount}</p>
          </div>
          <div className="rounded-xl bg-amber-100 p-4">
            <p className="text-xs text-amber-700">Active</p>
            <p className="text-2xl font-bold text-amber-800">{activeCount}</p>
          </div>
          <div className="rounded-xl bg-indigo-100 p-4">
            <p className="text-xs text-indigo-700">Current streak</p>
            <p className="text-2xl font-bold text-indigo-800">{streak} day{streak === 1 ? "" : "s"}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Completed this week: {completedThisWeek}</p>
          <div className="grid grid-cols-7 items-end gap-2">
            {chartData.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1">
                <div className="w-full rounded-t bg-indigo-500" style={{ height: `${Math.max(10, Math.round((d.value / maxVal) * 120))}px` }} />
                <p className="text-xs text-slate-600">{d.value}</p>
                <p className="text-[10px] text-slate-500">{d.day}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
