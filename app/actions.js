"use server";
import { revalidatePath } from "next/cache";
import prisma from "../lib/prisma";
export async function addTodo(formData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await prisma.item.create({
    data: { title },
  });
  revalidatePath("/");
}
export async function updateTodo(formData) {
  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();
  if (!id || !title) return;
  await prisma.item.update({
    where: { id },
    data: { title },
  });
  revalidatePath("/");
}
export async function deleteTodo(formData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await prisma.item.delete({
    where: { id },
  });
  revalidatePath("/");
}
