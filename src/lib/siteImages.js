import { supabase } from "./supabaseClient";

export const SITE_IMAGES_BUCKET = "site-images";

export const SITE_IMAGE_SLOTS = [
  { key: "hero", label: "Homepage hero", group: "Homepage", description: "The large image at the top of the website." },
  { key: "hotelExteriorReal", label: "Golden stone hotel exterior", group: "A Haveli Stay Framed by Golden Stone", description: "Main exterior image and showcase card." },
  { key: "fortView", label: "Golden Fort view", group: "A Haveli Stay Framed by Golden Stone", description: "Fort view used in showcase and Explore Jaisalmer." },
  { key: "heritageRoomReal", label: "Heritage room", group: "Heritage Rooms Inside Jaisalmer Fort", description: "Traditional heritage room photo." },
  { key: "demoModern", label: "Modern heritage room", group: "Heritage Rooms Inside Jaisalmer Fort", description: "Modern heritage room photo." },
  { key: "demoPrincess", label: "Princess room", group: "Heritage Rooms Inside Jaisalmer Fort", description: "Premium heritage room photo." },
  { key: "haveliSittingReal", label: "Hakam Queen room", group: "Heritage Rooms Inside Jaisalmer Fort", description: "Traditional Hakam Queen room photo." },
  { key: "rooftopRestaurant", label: "Rooftop restaurant", group: "Rooftop Restaurant with Sweeping Views of Jaisalmer", description: "Restaurant and rooftop view photo." },
  { key: "rajasthaniThali", label: "Rajasthani thali", group: "Rooftop Restaurant with Sweeping Views of Jaisalmer", description: "Food photo shown beside the restaurant copy." },
  { key: "roomDetailReal", label: "Heritage room details", group: "Gallery", description: "Room detail photo in the gallery." },
  { key: "haveliInteriorReal", label: "Traditional haveli ambience", group: "Gallery", description: "Interior and seating photo in the gallery." },
  { key: "exterior", label: "Morning inside the fort", group: "Gallery", description: "Story-strip image for the morning inside the fort." },
  { key: "sunset", label: "Golden sunset view", group: "Gallery", description: "Story-strip sunset image." },
  { key: "street", label: "Jaisalmer street life", group: "Gallery", description: "Fort street-life gallery image." },
  { key: "interior", label: "Haveli interior", group: "Gallery", description: "Traditional interior story image." },
  { key: "jaisalmerFortView", label: "Jaisalmer Fort", group: "Explore Jaisalmer", description: "Explore card for Jaisalmer Fort." },
  { key: "jainTemples", label: "Jain Temples", group: "Explore Jaisalmer", description: "Explore card for the Jain Temples." },
  { key: "patwonHaveli", label: "Patwon Ki Haveli", group: "Explore Jaisalmer", description: "Explore card for Patwon Ki Haveli." },
  { key: "gadisarLake", label: "Gadisar Lake", group: "Explore Jaisalmer", description: "Explore card for Gadisar Lake." },
  { key: "samSandDunes", label: "Sam Sand Dunes", group: "Explore Jaisalmer", description: "Explore card for Sam Sand Dunes." },
  { key: "localFortMarket", label: "Local Fort Market", group: "Explore Jaisalmer", description: "Explore card for the local market." },
  { key: "badaBagh", label: "Bada Bagh", group: "Explore Jaisalmer", description: "Explore card for Bada Bagh." },
  { key: "kuldhara", label: "Kuldhara and Khaba", group: "Explore Jaisalmer", description: "Explore card for Kuldhara and Khaba." },
  { key: "woodFossilPark", label: "Wood Fossil Park", group: "Explore Jaisalmer", description: "Explore card for Wood Fossil Park." },
];

export function siteImageUrl(storagePath) {
  if (!storagePath) return null;
  const { data } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl || null;
}

export async function fetchPublicSiteImages() {
  const { data, error } = await supabase
    .from("site_images")
    .select("slot_key, storage_path, alt_text")
    .eq("is_active", true);
  if (error) throw error;
  return data || [];
}

export async function fetchAdminSiteImages() {
  const { data, error } = await supabase.from("site_images").select("*").order("slot_key");
  if (error) throw error;
  return data || [];
}

function validateSiteImage(file) {
  if (!file || !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are accepted.");
  }
  if (file.size > 8 * 1024 * 1024) throw new Error("Image is larger than 8MB.");
}

export async function replaceSiteImage(slotKey, file, altText = "") {
  validateSiteImage(file);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
  const storagePath = `website/${slotKey}/${uniqueName}`;
  const { error: uploadError } = await supabase.storage.from(SITE_IMAGES_BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase.from("site_images").upsert({
    slot_key: slotKey,
    storage_path: storagePath,
    alt_text: altText,
    mime_type: file.type,
    file_size: file.size,
    is_active: true,
  }, { onConflict: "slot_key" }).select().single();
  if (error) {
    await supabase.storage.from(SITE_IMAGES_BUCKET).remove([storagePath]);
    throw error;
  }
  return data;
}

export async function removeSiteImage(image) {
  if (image?.storage_path) await supabase.storage.from(SITE_IMAGES_BUCKET).remove([image.storage_path]);
  const { error } = await supabase.from("site_images").delete().eq("slot_key", image.slot_key);
  if (error) throw error;
}
