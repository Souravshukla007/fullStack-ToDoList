import prisma from "../lib/prisma";
import { addTodo, deleteTodo, updateTodo } from "./actions";
export const dynamic = "force-dynamic";
function todayLabel() {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${day}.${month} To-Do List`;
}

export default async function HomePage() {
  const items = await prisma.item.findMany({
    orderBy: { id: "asc" },
  });
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">{todayLabel()}</h1>
        <form action={addTodo} className="mb-6 flex gap-2">
          <input
            type="text"
            name="title"
            placeholder="Add a new task..."
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none ring-indigo-200 focus:ring"
            required
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Add
          </button>
        </form>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <form action={updateTodo} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="text"
                  name="title"
                  defaultValue={item.title}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    Save
                  </button>
                </div>
              </form>
              <form action={deleteTodo} className="mt-2">
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
        {items.length === 0 && (
          <p className="mt-4 text-center text-slate-500">No tasks yet. Add your first one 👆</p>
        )}
      </section>
    </main>
  );
}
