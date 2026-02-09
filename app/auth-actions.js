"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import prisma from "../lib/prisma";
import { clearSession, setSession } from "../lib/auth";

function asText(value) {
  return String(value || "").trim();
}

export async function signup(formData) {
  const name = asText(formData.get("name"));
  const email = asText(formData.get("email")).toLowerCase();
  const password = asText(formData.get("password"));

  if (!name || !email || !password) {
    redirect("/signup?error=Please+fill+all+fields");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password+must+be+at+least+6+characters");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/signup?error=Email+already+exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: { id: true },
  });

  await setSession(user.id);
  redirect("/");
}

export async function login(formData) {
  const email = asText(formData.get("email")).toLowerCase();
  const password = asText(formData.get("password"));

  if (!email || !password) {
    redirect("/login?error=Please+enter+email+and+password");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    redirect("/login?error=Invalid+credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    redirect("/login?error=Invalid+credentials");
  }

  await setSession(user.id);
  redirect("/?welcome=1");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
