import prisma from "../lib/prisma";
import {
  addSubtask,
  addTodo,
  bulkCompleteAll,
  bulkDeleteCompleted,
  deleteSubtask,
  deleteTodo,
  moveTodo,
  togglePin,
  toggleSubtask,
  toggleTodo,
  updateTodo,
} from "./actions";

export const dynamic = "force-dynamic";

function todayLabel() {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month} To-Do List`;
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
  const params = await Promise.resolve(searchParams || {});
  const filter = params?.filter || "all";
  const search = params?.search || "";
  const sort = params?.sort || "pinned";
  const priority = params?.priority || "all";
  const category = params?.category || "all";

  const where = {
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

  const [items, categories, totalCount, completedCount, overdueCount] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { subtasks: { orderBy: { createdAt: "asc" } } },
      orderBy,
    }),
    prisma.item.findMany({ distinct: ["category"], select: { category: true }, where: { category: { not: null } } }),
    prisma.item.count(),
    prisma.item.count({ where: { completed: true } }),
    prisma.item.count({ where: { completed: false, dueAt: { lt: new Date() } } }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto w-full max-w-6xl rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-800">{todayLabel()}</h1>
          <a href="/analytics" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Analytics</a>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <aside className="space-y-3 lg:col-span-3">
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
          </aside>

          <div className="lg:col-span-9">
        <form className="mb-4 grid gap-2 sm:grid-cols-5" method="get">
          <input name="search" defaultValue={search} placeholder="Search tasks..." className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2" />
          <select name="filter" defaultValue={filter} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <select name="priority" defaultValue={priority} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="all">Any priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="pinned">Pinned + Order</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
          </select>
          <select name="category" defaultValue={category} className="rounded-lg border border-slate-300 px-3 py-2 sm:col-span-2">
            <option value="all">All categories</option>
            {categories.map((c, idx) => (
              <option key={idx} value={c.category || ""}>{c.category}</option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Apply</button>
        </form>

        <div className="mb-4 flex flex-wrap gap-2">
          <form action={bulkCompleteAll}><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Complete all</button></form>
          <form action={bulkDeleteCompleted}><button className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Delete completed</button></form>
        </div>

        <form action={addTodo} className="mb-6 grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
          <input type="text" name="title" placeholder="Add a new task..." className="rounded-lg border border-slate-300 px-3 py-2" required />
          <input type="text" name="description" placeholder="Notes/description" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="datetime-local" name="dueAt" className="rounded-lg border border-slate-300 px-3 py-2" />
          <input type="text" name="category" placeholder="Category (Work, Personal...)" className="rounded-lg border border-slate-300 px-3 py-2" />
          <select name="priority" className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select name="recurrence" className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="NONE">No recurrence</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="pinned" value="true" /> Pin task</label>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Add</button>
        </form>

        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={item.id} style={{ animationDelay: `${idx * 40}ms` }} className={`animate-fade-in-up rounded-xl border p-3 transition duration-200 hover:shadow-md ${isOverdue(item) ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <form action={toggleTodo} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="completed" value={String(item.completed)} />
                  <button type="submit" className={`h-5 w-5 rounded border transition duration-200 active:scale-90 ${item.completed ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`} />
                </form>
                <span className={`rounded-full px-2 py-0.5 text-xs ${item.priority === "HIGH" ? "bg-rose-100 text-rose-700" : item.priority === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{item.priority}</span>
                {item.category && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{item.category}</span>}
                {item.recurrence !== "NONE" && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">{item.recurrence}</span>}
                {item.dueAt && <span className={`rounded-full px-2 py-0.5 text-xs ${isOverdue(item) ? "bg-rose-200 text-rose-800" : "bg-blue-100 text-blue-700"}`}>Due: {formatDate(item.dueAt)}</span>}

                <form action={togglePin} className="ml-auto">
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="pinned" value={String(item.pinned)} />
                  <button className={`rounded-lg px-2 py-1 text-xs font-medium transition duration-200 hover:-translate-y-0.5 active:scale-95 ${item.pinned ? "bg-yellow-300 text-yellow-900" : "bg-slate-200 text-slate-700"}`}>{item.pinned ? "Pinned" : "Pin"}</button>
                </form>
                <form action={moveTodo}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="direction" value="up" /><button className="rounded bg-slate-200 px-2 py-1 text-xs">↑</button></form>
                <form action={moveTodo}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="direction" value="down" /><button className="rounded bg-slate-200 px-2 py-1 text-xs">↓</button></form>
              </div>

              <form action={updateTodo} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={item.id} />
                <input type="text" name="title" defaultValue={item.title} className={`rounded-lg border border-slate-300 px-3 py-2 ${item.completed ? "line-through text-slate-400" : ""}`} required />
                <input type="text" name="description" defaultValue={item.description || ""} placeholder="Notes" className="rounded-lg border border-slate-300 px-3 py-2" />
                <input type="datetime-local" name="dueAt" defaultValue={item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 16) : ""} className="rounded-lg border border-slate-300 px-3 py-2" />
                <input type="text" name="category" defaultValue={item.category || ""} placeholder="Category" className="rounded-lg border border-slate-300 px-3 py-2" />
                <select name="priority" defaultValue={item.priority} className="rounded-lg border border-slate-300 px-3 py-2"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select>
                <select name="recurrence" defaultValue={item.recurrence} className="rounded-lg border border-slate-300 px-3 py-2"><option value="NONE">No recurrence</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option></select>
                <button type="submit" className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Save</button>
              </form>

              <form action={deleteTodo} className="mt-2"><input type="hidden" name="id" value={item.id} /><button type="submit" className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:shadow active:scale-95">Delete</button></form>

              <div className="mt-3 rounded-lg bg-white p-2">
                <p className="mb-2 text-xs font-semibold text-slate-600">Subtasks</p>
                <ul className="space-y-1">
                  {item.subtasks.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <form action={toggleSubtask}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="completed" value={String(s.completed)} /><button className={`h-4 w-4 rounded border ${s.completed ? "border-emerald-500 bg-emerald-500" : "border-slate-300 bg-white"}`} /></form>
                      <span className={s.completed ? "text-slate-400 line-through" : "text-slate-700"}>{s.title}</span>
                      <form action={deleteSubtask} className="ml-auto"><input type="hidden" name="id" value={s.id} /><button className="text-xs text-rose-600">remove</button></form>
                    </li>
                  ))}
                </ul>
                <form action={addSubtask} className="mt-2 flex gap-2"><input type="hidden" name="itemId" value={item.id} /><input type="text" name="title" placeholder="Add subtask" className="w-full rounded border border-slate-300 px-2 py-1 text-sm" /><button className="rounded bg-slate-800 px-2 py-1 text-xs text-white transition duration-200 hover:-translate-y-0.5 active:scale-95">Add</button></form>
              </div>

              <p className="mt-2 text-xs text-slate-500">Created: {formatDate(item.createdAt)} | Updated: {formatDate(item.updatedAt)}</p>
            </li>
          ))}
        </ul>

        {items.length === 0 && <p className="mt-4 text-center text-slate-500">No tasks found for current filters.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
