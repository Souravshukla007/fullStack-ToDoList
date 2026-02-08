"use server";
import { revalidatePath } from "next/cache";
import prisma from "../lib/prisma";

function asText(value) {
  return String(value || "").trim();
}

function asDate(value) {
  const v = asText(value);
  return v ? new Date(v) : null;
}

function nextDueDate(dueAt, recurrence) {
  if (!dueAt || recurrence === "NONE") return null;
  const next = new Date(dueAt);
  if (recurrence === "DAILY") next.setDate(next.getDate() + 1);
  if (recurrence === "WEEKLY") next.setDate(next.getDate() + 7);
  return next;
}

export async function addTodo(formData) {
  const title = asText(formData.get("title"));
  if (!title) return;

  const maxPos = await prisma.item.aggregate({ _max: { position: true } });

  await prisma.item.create({
    data: {
      title,
      description: asText(formData.get("description")) || null,
      dueAt: asDate(formData.get("dueAt")),
      priority: asText(formData.get("priority")) || "MEDIUM",
      recurrence: asText(formData.get("recurrence")) || "NONE",
      category: asText(formData.get("category")) || null,
      pinned: String(formData.get("pinned")) === "true",
      position: (maxPos._max.position ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function updateTodo(formData) {
  const id = Number(formData.get("id"));
  const title = asText(formData.get("title"));
  if (!id || !title) return;

  await prisma.item.update({
    where: { id },
    data: {
      title,
      description: asText(formData.get("description")) || null,
      dueAt: asDate(formData.get("dueAt")),
      priority: asText(formData.get("priority")) || "MEDIUM",
      recurrence: asText(formData.get("recurrence")) || "NONE",
      category: asText(formData.get("category")) || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function deleteTodo(formData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.item.delete({
    where: { id },
  });
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function toggleTodo(formData) {
  const id = Number(formData.get("id"));
  const completed = String(formData.get("completed")) === "true";
  if (!id) return;

  const item = await prisma.item.update({
    where: { id },
    data: {
      completed: !completed,
      completedAt: !completed ? new Date() : null,
    },
  });

  if (!completed && item.recurrence !== "NONE") {
    const dueAt = nextDueDate(item.dueAt, item.recurrence);
    const maxPos = await prisma.item.aggregate({ _max: { position: true } });
    await prisma.item.create({
      data: {
        title: item.title,
        description: item.description,
        dueAt,
        priority: item.priority,
        recurrence: item.recurrence,
        category: item.category,
        pinned: item.pinned,
        position: (maxPos._max.position ?? 0) + 1,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function togglePin(formData) {
  const id = Number(formData.get("id"));
  const pinned = String(formData.get("pinned")) === "true";
  if (!id) return;
  await prisma.item.update({
    where: { id },
    data: { pinned: !pinned },
  });
  revalidatePath("/");
}

export async function bulkCompleteAll() {
  await prisma.item.updateMany({
    where: { completed: false },
    data: { completed: true, completedAt: new Date() },
  });
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function bulkDeleteCompleted() {
  await prisma.item.deleteMany({ where: { completed: true } });
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function moveTodo(formData) {
  const id = Number(formData.get("id"));
  const direction = asText(formData.get("direction"));
  if (!id || !direction) return;

  const current = await prisma.item.findUnique({ where: { id } });
  if (!current) return;

  const neighbor = await prisma.item.findFirst({
    where:
      direction === "up"
        ? { position: { lt: current.position } }
        : { position: { gt: current.position } },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) return;

  await prisma.$transaction([
    prisma.item.update({ where: { id: current.id }, data: { position: neighbor.position } }),
    prisma.item.update({ where: { id: neighbor.id }, data: { position: current.position } }),
  ]);

  revalidatePath("/");
}

export async function addSubtask(formData) {
  const itemId = Number(formData.get("itemId"));
  const title = asText(formData.get("title"));
  if (!itemId || !title) return;

  await prisma.subtask.create({ data: { itemId, title } });
  revalidatePath("/");
}

export async function toggleSubtask(formData) {
  const id = Number(formData.get("id"));
  const completed = String(formData.get("completed")) === "true";
  if (!id) return;

  await prisma.subtask.update({ where: { id }, data: { completed: !completed } });
  revalidatePath("/");
}

export async function deleteSubtask(formData) {
  const id = Number(formData.get("id"));
  if (!id) return;

  await prisma.subtask.delete({ where: { id } });
  revalidatePath("/");
}
