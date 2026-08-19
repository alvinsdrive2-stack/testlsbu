"use server";

import { redirect } from "next/navigation";
import { createAdminSession } from "@/lib/session";

export async function login(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin");
}
