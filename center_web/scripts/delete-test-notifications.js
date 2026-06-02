const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Credentials missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clean() {
  console.log("🧹 Cleaning up old test donor notifications...");
  
  const { data: admin, error: adminErr } = await supabase
    .from("profiles")
    .select("id")
    .ilike("full_name", "%Nathanaël%")
    .single();

  if (adminErr || !admin) {
    console.error("❌ Admin not found:", adminErr?.message);
    process.exit(1);
  }

  // Delete all notifications of type 'donation' for this user
  const { data, error, count } = await supabase
    .from("notifications")
    .delete({ count: "exact" })
    .eq("user_id", admin.id)
    .eq("type", "donation");

  if (error) {
    console.error("❌ Error deleting notifications:", error.message);
  } else {
    console.log(`✅ Cleaned up successfully! Removed ${count ?? 0} donor notification(s) of type 'donation'.`);
  }
}

clean().catch(console.error);
