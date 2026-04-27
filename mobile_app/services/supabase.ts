import { createClient } from "@supabase/supabase-js";
import * as Linking from "expo-linking";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const redirectTo = Linking.createURL("/(auth)/login");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const getRedirectUrl = () => redirectTo;
