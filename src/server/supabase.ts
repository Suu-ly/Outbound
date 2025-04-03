import "server-only";

import { createClient } from "@supabase/supabase-js";

// Create a single supabase client for interacting with your database
if (!process.env.SUPABASE_KEY) throw new Error("Supabase key is not set!");

export const supabase = createClient(
  "https://kteacpdbnvxgubbmvalc.supabase.co",
  process.env.SUPABASE_KEY,
);
