import { config } from "dotenv";
config({ path: ".env.local" });

async function setup() {
  // Dynamic import after dotenv loads
  const { supabase } = await import("../lib/supabase");

  console.log("Supabase URL:", process.env.SUPABASE_URL?.slice(0, 30) + "...");
  console.log("Creating blog-images bucket...");

  const { data, error } = await supabase.storage.createBucket("blog-images", {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  });

  if (error) {
    if (error.message?.includes("already exists")) {
      console.log("Bucket already exists, OK.");
    } else {
      console.error("Error:", JSON.stringify(error));
    }
  } else {
    console.log("Bucket created:", data);
  }

  // List existing buckets
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) console.error("List error:", listErr.message);
  else console.log("Existing buckets:", buckets?.map(b => b.name));

  console.log("Done!");
}

setup().catch(console.error);
