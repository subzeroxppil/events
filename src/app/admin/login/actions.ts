"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function signInWithEmail(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/admin`,
    },
  });
}
