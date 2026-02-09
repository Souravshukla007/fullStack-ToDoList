import prisma from "../lib/prisma";
import {
  addSubtask,
  addTodo,
  bulkCompleteAll,
  bulkDeleteCompleted,
  deleteSubtask,
  deleteTodo,
  moveTodo,
  removeFavoriteQuote,
  saveFavoriteQuote,
  togglePin,
  toggleSubtask,
  toggleTodo,
  updateTodo,
} from "./actions";
import { logout } from "./auth-actions";
import LogoutForm from "./components/logout-form";
import WelcomePopup from "./components/welcome-popup";
import { requireUserId } from "../lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function todayLabel() {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month} To-Do List`;
}

function greetingMeta(name) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
  const emoji = hour < 12 ? "☀️" : hour < 17 ? "⛅" : "🌙";
  const timeKey = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return {
    text: `Good ${part}${name ? `, ${name}` : ""} ${emoji}`,
    timeKey,
  };
}

function quoteFallback(tone) {
  const map = {
    motivational: { quote: "Discipline beats motivation.", author: "Unknown" },
    reflective: { quote: "Quiet growth is still growth.", author: "Unknown" },
    celebratory: { quote: "Done is beautiful. Celebrate your consistency.", author: "Unknown" },
  };
  const chosen = map[tone] || map.motivational;
  return {
    ...chosen,
    tone,
    source: "fallback",
  };
}

async function getRandomQuote(timeKey, completed) {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const protocol = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const tone = completed ? "celebratory" : timeKey === "evening" ? "reflective" : "motivational";

  try {
    const response = await fetch(
      `${protocol}://${host}/api/quotes/random?time=${encodeURIComponent(timeKey)}&completed=${completed ? "1" : "0"}`,
      { cache: "no-store" },
    );
    if (!response.ok) return quoteFallback(tone);
    const data = await response.json();
    if (!data?.quote) return quoteFallback(tone);
    return {
      quote: data.quote,
      author: data.author || "Unknown",
      tone: data.tone || tone,
      source: data.source || "unknown",
    };
  } catch {
    return quoteFallback(tone);
  }
}

async function getFavoriteQuotesSafe(userId) {
  try {
    if (!prisma.favoriteQuote) return [];
    return await prisma.favoriteQuote.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 6 });
  } catch {
    return [];
  }
}

function parseCalendarMonth(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function toCalParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildCalendarCells(monthStart) {
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function buildCalHref(params, targetMonth) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, String(v)));
    else qs.set(key, String(value));
  });
  qs.set("cal", toCalParam(targetMonth));
  return `/?${qs.toString()}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(item) {
  return item.dueAt && !item.completed && new Date(item.dueAt) < new Date();
}

export default async function HomePage({ searchParams }) {
  const userId = await requireUserId();
  const params = await Promise.resolve(searchParams || {});
  const filter = params?.filter || "all";
  const search = params?.search || "";
  const sort = params?.sort || "pinned";
  const priority = params?.priority || "all";
  const category = params?.category || "all";
  const showWelcome = params?.welcome === "1";
  const calendarMonth = parseCalendarMonth(params?.cal);
  const prevMonth = shiftMonth(calendarMonth, -1);
  const nextMonth = shiftMonth(calendarMonth, 1);
  const calendarCells = buildCalendarCells(calendarMonth);
  const monthLabel = calendarMonth.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === calendarMonth.getFullYear() && today.getMonth() === calendarMonth.getMonth();

  const where = {
    userId,
    ...(filter === "active" ? { completed: false } : {}),
    ...(filter === "completed" ? { completed: true } : {}),
    ...(priority !== "all" ? { priority } : {}),
    ...(category !== "all" ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "newest"
      ? [{ createdAt: "desc" }]
      : sort === "oldest"
        ? [{ createdAt: "asc" }]
        : sort === "due"
          ? [{ dueAt: "asc" }, { createdAt: "desc" }]
          : sort === "priority"
            ? [{ priority: "desc" }, { createdAt: "desc" }]
            : [{ pinned: "desc" }, { position: "asc" }, { createdAt: "asc" }];

  const [items, categories, totalCount, completedCount, overdueCount, user, favoriteQuotes] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { subtasks: { orderBy: { createdAt: "asc" } } },
      orderBy,
    }),
    prisma.item.findMany({ distinct: ["category"], select: { category: true }, where: { userId, category: { not: null } } }),
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, completed: true } }),
    prisma.item.count({ where: { userId, completed: false, dueAt: { lt: new Date() } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    getFavoriteQuotesSafe(userId),
  ]);

  const greeting = greetingMeta(user?.name);
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const quote = await getRandomQuote(greeting.timeKey, allCompleted);

  const inputClass =
    "rounded-lg border border-slate-300 px-3 py-2 outline-none transition duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";
  const buttonBase =
    "rounded-lg px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95";
  const pinnedItems = items.filter((item) => item.pinned);
  const overdueItems = items.filter((item) => !item.pinned && isOverdue(item));
  const otherItems = items.filter((item) => !item.pinned && !isOverdue(item));

  const renderSection = (title, sectionItems, startIndex = 0) => {
    if (!sectionItems.length) return null;
    return (
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{sectionItems.length}</span>
        </div>
        <ul className="space-y-3">
          {sectionItems.map((item, idx) => (
            <li key={item.id} style={{ animationDelay: `${(startIndex + idx) * 40}ms` }} className={`animate-fade-in-up rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${item.completed ? "border-emerald-200 bg-emerald-50/70" : isOverdue(item) ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <form action={toggleTodo} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="completed" value={String(item.completed)} />
                  <button
                    type="submit"
                    aria-label={item.completed ? "Mark as active" : "Mark as completed"}
                    className={`animated-checkbox-btn ${item.completed ? "is-checked" : ""}`}
                  />
                </form>

                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium text-slate-800 transition-all duration-300 ${item.completed ? "line-through text-slate-400" : ""}`}>{item.title}</p>
                  {item.description && <p className="truncate text-xs text-slate-500">{item.description}</p>}
                </div>

                <span className={`rounded-full px-2 py-0.5 text-xs ${item.priority === "HIGH" ? "bg-rose-100 text-rose-700" : item.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{item.priority}</span>
                {item.category && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{item.category}</span>}
                {item.recurrence !== "NONE" && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{item.recurrence}</span>}
                {item.dueAt && <span className={`rounded-full px-2 py-0.5 text-xs transition-colors duration-300 ${isOverdue(item) ? "animate-pulse-soft bg-rose-200 text-rose-800" : "bg-blue-100 text-blue-700"}`}>Due: {formatDate(item.dueAt)}</span>}

                <form action={togglePin} className="ml-auto">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="pinned" value={String(item.pinned)} />
                  <button className={`rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${item.pinned ? "ring-2 ring-yellow-200 bg-yellow-300 text-yellow-900" : "bg-slate-200 text-slate-700"}`}>{item.pinned ? "Pinned" : "Pin"}</button>
                </form>
                <form action={moveTodo}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="direction" value="up" /><button className="rounded bg-slate-200 px-2 py-1 text-xs">↑</button></form>
                <form action={moveTodo}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="direction" value="down" /><button className="rounded bg-slate-200 px-2 py-1 text-xs">↓</button></form>
              </div>

              <details className="group rounded-lg border border-slate-200 bg-white p-2 transition-all duration-300 hover:shadow-sm open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-1 py-1 text-xs font-semibold text-slate-600 transition-colors duration-200 group-open:text-indigo-700">
                  <span>Edit details & subtasks</span>
                  <span
                    aria-hidden="true"
                    className="inline-block text-sm text-slate-500 transition-transform duration-300 group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>

                <div className="dropdown-panel mt-3">
                  <form action={updateTodo} className="grid gap-2 sm:grid-cols-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="text" name="title" defaultValue={item.title} className={`${inputClass} transition-all duration-300 ${item.completed ? "line-through text-slate-400" : ""}`} required />
                    <input type="text" name="description" defaultValue={item.description || ""} placeholder="Notes" className={inputClass} />
                    <input type="datetime-local" name="dueAt" defaultValue={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 16) : ""} className={inputClass} />
                    <input type="text" name="category" defaultValue={item.category || ""} placeholder="Category" className={inputClass} />
                    <select name="priority" defaultValue={item.priority} className={inputClass}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select>
                    <select name="recurrence" defaultValue={item.recurrence} className={inputClass}><option value="NONE">No recurrence</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option></select>
                    <button type="submit" className={`${buttonBase} bg-amber-500`}>Save</button>
                  </form>

                  <form action={deleteTodo} className="mt-2"><input type="hidden" name="id" value={item.id} /><button type="submit" className={`${buttonBase} bg-rose-600`}>Delete</button></form>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2">
                    <p className="mb-2 text-xs font-semibold text-slate-600">Subtasks</p>
                    <ul className="space-y-1">
                      {item.subtasks.map((s) => (
                        <li key={s.id} className="flex items-center gap-2 text-sm">
                          <form action={toggleSubtask}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="completed" value={String(s.completed)} /><button aria-label={s.completed ? "Mark subtask as active" : "Mark subtask as completed"} className={`animated-checkbox-btn animated-checkbox-btn--sm ${s.completed ? "is-checked" : ""}`} /></form>
                          <span className={s.completed ? "text-slate-400 line-through" : "text-slate-700"}>{s.title}</span>
                          <form action={deleteSubtask} className="ml-auto"><input type="hidden" name="id" value={s.id} /><button className="text-xs text-rose-600">remove</button></form>
                        </li>
                      ))}
                    </ul>
                    <form action={addSubtask} className="mt-2 flex gap-2"><input type="hidden" name="itemId" value={item.id} /><input type="text" name="title" placeholder="Add subtask" className="w-full rounded border border-slate-300 px-2 py-1 text-sm outline-none transition duration-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" /><button className="rounded bg-slate-800 px-2 py-1 text-xs text-white transition duration-200 hover:-translate-y-0.5 active:scale-95">Add</button></form>
                  </div>
                </div>
              </details>

              <p className="mt-2 text-xs text-slate-500">Created: {formatDate(item.createdAt)} | Updated: {formatDate(item.updatedAt)}</p>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.45)), url('/assets/icons/main.jpg')",
      }}
    >
      <WelcomePopup show={showWelcome} name={user?.name} />
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-6 grid gap-3 md:grid-cols-3 md:items-center">
          <h1 className="text-2xl font-bold text-slate-800 md:text-left">{todayLabel()}</h1>
          <p className="text-center text-xl font-semibold text-slate-700 md:text-2xl">{greeting.text}</p>
          <div className="flex items-center gap-2 md:justify-self-end">
            <a href="/analytics" className={`${buttonBase} bg-slate-900`}>Analytics</a>
            <LogoutForm action={logout} className={`${buttonBase} bg-rose-700`} />
          </div>
        </div>

        <div className="quote-fade mb-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/90 to-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {allCompleted ? "All Tasks Completed 🎉" : `${quote.tone} quote`}
              </p>
              <p className="mt-1 text-lg font-semibold italic text-slate-800">“{quote.quote}”</p>
              <p className="mt-1 text-sm text-slate-600">— {quote.author || "Unknown"}</p>
            </div>
            <form action={saveFavoriteQuote}>
              <input type="hidden" name="quote" value={quote.quote} />
              <input type="hidden" name="author" value={quote.author || "Unknown"} />
              <input type="hidden" name="tone" value={quote.tone || "motivational"} />
              <input type="hidden" name="source" value={quote.source || "unknown"} />
              <button className={`${buttonBase} bg-indigo-600`}>⭐ Save quote</button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <aside className="space-y-3 lg:col-span-3 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl bg-slate-50 p-4 transition duration-200 hover:shadow-md">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 transition duration-200 hover:shadow-md">
              <p className="text-xs text-emerald-700">Completed</p>
              <p className="text-2xl font-bold text-emerald-800">{completedCount}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4 transition duration-200 hover:shadow-md">
              <p className="text-xs text-rose-700">Overdue</p>
              <p className="text-2xl font-bold text-rose-800">{overdueCount}</p>
            </div>
            <div className="mt-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="mb-2 flex items-center justify-between gap-2">
                <a href={buildCalHref(params, prevMonth)} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">◀</a>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">{monthLabel}</p>
                <a href={buildCalHref(params, nextMonth)} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">▶</a>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
                {calendarCells.map((day, idx) => {
                  const isToday = isCurrentMonth && day === today.getDate();
                  return (
                    <span
                      key={idx}
                      className={`rounded-md py-1 ${day ? "bg-slate-50 text-slate-700" : "bg-transparent"} ${isToday ? "bg-indigo-600 font-bold text-white" : ""}`}
                    >
                      {day || ""}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="quote-fade mt-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Favorite Quotes</p>
              {favoriteQuotes.length === 0 ? (
                <p className="text-xs text-slate-500">No favorites yet. Save one from today’s quote.</p>
              ) : (
                <ul className="space-y-2">
                  {favoriteQuotes.map((q) => (
                    <li key={q.id} className="rounded-lg bg-slate-50 p-2">
                      <p className="text-xs font-medium italic text-slate-700">“{q.quote}”</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">— {q.author || "Unknown"}</span>
                        <form action={removeFavoriteQuote}>
                          <input type="hidden" name="id" value={q.id} />
                          <button className="text-[11px] font-semibold text-rose-600 hover:text-rose-700">Remove</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div className="lg:col-span-9">
        <form className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-5" method="get">
          <input name="search" defaultValue={search} placeholder="Search tasks..." className={`${inputClass} sm:col-span-2`} />
          <select name="filter" defaultValue={filter} className={inputClass}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <select name="priority" defaultValue={priority} className={inputClass}>
            <option value="all">Any priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select name="sort" defaultValue={sort} className={inputClass}>
            <option value="pinned">Pinned + Order</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
          <select name="category" defaultValue={category} className={`${inputClass} sm:col-span-2`}>
            <option value="all">All categories</option>
            {categories.map((c, idx) => (
              <option key={idx} value={c.category || ""}>{c.category}</option>
            ))}
          </select>
          <button type="submit" className={`${buttonBase} bg-indigo-600 px-4`}>Apply</button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          <form action={bulkCompleteAll}><button className={`${buttonBase} bg-emerald-600`}>Complete all</button></form>
          <form action={bulkDeleteCompleted}><button className={`${buttonBase} bg-rose-600`}>Delete completed</button></form>
        </div>

        <form action={addTodo} className="mb-6 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
          <input type="text" name="title" placeholder="Add a new task..." className={inputClass} required />
          <input type="text" name="description" placeholder="Notes/description" className={inputClass} />
          <label className="sm:col-span-2 flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs font-medium text-slate-500 transition hover:bg-slate-100">
            Attach image (fixed preview area)
            <input type="file" name="noteImage" accept="image/*" className="hidden" />
          </label>
          <input type="datetime-local" name="dueAt" className={inputClass} />
          <input type="text" name="category" placeholder="Category (Work, Personal...)" className={inputClass} />
          <select name="priority" className={inputClass}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select name="recurrence" className={inputClass}>
            <option value="NONE">No recurrence</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
          <label className="animated-checkbox flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="pinned" value="true" />
            <div className="animated-checkbox__mark" />
            <span>Pin task</span>
          </label>
          <button type="submit" className={`${buttonBase} bg-indigo-600 px-4`}>Add</button>
        </form>

        {renderSection("Pinned", pinnedItems, 0)}
        {renderSection("Overdue", overdueItems, pinnedItems.length)}
        {renderSection("Others", otherItems, pinnedItems.length + overdueItems.length)}

        {items.length === 0 && <p className="mt-4 text-center text-slate-500">No tasks found for current filters.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
