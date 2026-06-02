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

async function test() {
  console.log("🔍 Finding Nathanaël's profile and linked center...");
  
  // Find Nathanaël's profile
  const { data: admin, error: adminErr } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .ilike("full_name", "%Nathanaël%")
    .single();

  if (adminErr || !admin) {
    console.error("❌ Admin profile not found:", adminErr?.message || "Not found");
    process.exit(1);
  }
  
  console.log(`✅ Admin found: ${admin.full_name} (${admin.id})`);

  // Find the center linked to this admin
  const { data: center, error: centerErr } = await supabase
    .from("centers")
    .select("id, name")
    .eq("admin_id", admin.id)
    .single();

  if (centerErr || !center) {
    console.error("❌ Center not found for this admin:", centerErr?.message || "Not found");
    process.exit(1);
  }

  console.log(`✅ Center found: ${center.name} (${center.id})`);

  // Find a donor to book an appointment
  console.log("🔍 Finding a donor profile for the test booking...");
  const { data: donor, error: donorErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "donor")
    .neq("id", admin.id) // Ensure it's not Nathanaël himself
    .limit(1)
    .single();

  if (donorErr || !donor) {
    console.warn("⚠️ No other donor found. We will use Nathanaël's account itself for the test.");
  }

  const testDonorId = donor ? donor.id : admin.id;
  const testDonorName = donor ? donor.full_name : admin.full_name;
  console.log(`✅ Using Donor: ${testDonorName} (${testDonorId})`);

  // Calculate schedule date (e.g., 3 days from now at 10:00 AM)
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 3);
  scheduledDate.setHours(10, 0, 0, 0);
  const scheduledDateIso = scheduledDate.toISOString();

  console.log(`📅 Inserting a mock appointment for ${scheduledDateIso}...`);
  const { data: appt, error: apptErr } = await supabase
    .from("appointments")
    .insert({
      donor_id: testDonorId,
      center_id: center.id,
      scheduled_date: scheduledDateIso,
      status: "pending",
      notes: "Test automatique des notifications"
    })
    .select()
    .single();

  if (apptErr || !appt) {
    console.error("❌ Failed to insert appointment:", apptErr?.message);
    process.exit(1);
  }

  console.log(`✅ Appointment created successfully! ID: ${appt.id}`);

  // Wait 1.5 seconds for PostgreSQL trigger execution
  console.log("⏳ Waiting 1.5 seconds for trigger execution...");
  await new Promise((r) => setTimeout(r, 1500));

  // Query notifications to see if our trigger generated the notification!
  console.log("🔍 Querying notifications for the admin...");
  const { data: notifs, error: notifErr } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", admin.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (notifErr || !notifs || notifs.length === 0) {
    console.error("❌ No notifications found or query error:", notifErr?.message);
    process.exit(1);
  }

  const latestNotif = notifs[0];
  console.log("\n🎉 --- NOTIFICATION AUTOMATIQUE DÉTECTÉE ---");
  console.log(`ID: ${latestNotif.id}`);
  console.log(`Titre: "${latestNotif.title}"`);
  console.log(`Corps: "${latestNotif.body}"`);
  console.log(`Type: "${latestNotif.type}"`);
  console.log("Payload data:", latestNotif.data);
  console.log("-------------------------------------------\n");

  if (latestNotif.title === "Nouveau rendez-vous" && latestNotif.type === "appointment") {
    console.log("⭐️ EXCELLENT! Le trigger a fonctionné parfaitement!");
  } else {
    console.warn("⚠️ Une notification a été trouvée, mais elle ne correspond pas au format attendu.");
  }
}

test().catch(console.error);
