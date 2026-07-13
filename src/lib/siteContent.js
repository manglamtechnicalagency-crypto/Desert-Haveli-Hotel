import { supabase } from "./supabaseClient";

export const SECTION_DEFAULTS = [
  ["hero", "Hero Section", "Stay Inside the Living Golden Fort of Jaisalmer", "Experience 450 years of heritage, royal haveli rooms, rooftop dining, desert views, and authentic Jaisalmer hospitality."],
  ["haveli-stay", "A Haveli Stay Framed by Golden Stone", "A Haveli Stay Framed by Golden Stone", "Real hotel photos, heritage details, and warm direct hospitality create the atmosphere of a boutique stay inside the fort."],
  ["heritage-rooms", "Heritage Rooms Inside Jaisalmer Fort", "Heritage Rooms Inside Jaisalmer Fort", "Choose a traditional or modern heritage room and enquire directly with the hotel for availability and final confirmation."],
  ["rooftop-restaurant", "Rooftop Restaurant with Sweeping Views of Jaisalmer", "Rooftop Restaurant with Sweeping Views of Jaisalmer", "Enjoy fresh, hygienic Rajasthani and Indian food from our rooftop restaurant while experiencing panoramic views of Jaisalmer's Golden Fort, old city streets, and desert skyline."],
  ["morning-inside-fort", "Morning Inside the Fort", "Morning Inside the Fort", "Wake up inside Jaisalmer's living Golden Fort."],
  ["heritage-room-details", "Heritage Room Details", "Heritage Room Details", "Traditional details and comfortable heritage interiors."],
  ["golden-sunset-view", "Golden Sunset View", "Golden Sunset View", "Watch warm golden light settle over the fort and old city."],
  ["traditional-haveli-ambience", "Traditional Haveli Ambience", "Traditional Haveli Ambience", "A warm, character-rich haveli atmosphere."],
  ["jaisalmer-street-life", "Jaisalmer Street Life", "Jaisalmer Street Life", "Explore everyday life inside the historic fort."],
  ["room-gallery", "Gallery", "Gallery", "Browse the visual story of the fort, interiors, city views, and haveli atmosphere."],
  ["explore-jaisalmer", "Explore Jaisalmer", "Explore Jaisalmer", "The hotel is a heritage base for Jaisalmer Fort, havelis, Jain temples, desert villages, dunes, local markets, and city walks."],
  ["guest-experiences", "Guest Experiences", "Guest Experiences", "Selected guest experiences are presented without unverified star ratings."],
  ["hotel-facilities", "Hotel Facilities", "Hotel Facilities", "We provide essential guest facilities for a comfortable heritage stay."],
  ["contact", "Contact Section", "Contact The Desert Haveli Guest House Jaisalmer", "The guesthouse is located inside Jaisalmer Fort near the Jain Temple area."],
  ["footer", "Footer Visual Section", "The Desert Haveli Guest House Jaisalmer", "Experience heritage hospitality inside the Golden Fort of Jaisalmer."],
];

export const sectionContent = Object.fromEntries(SECTION_DEFAULTS.map(([key, internalName, title, description]) => [key, { key, internal_name: internalName, title, short_description: description, subtitle: "", full_description: "", primary_button_text: "", primary_button_url: "", secondary_button_text: "", secondary_button_url: "", status: "published", is_visible: true }]));

export async function fetchPublicSections() {
  const { data, error } = await supabase.from("site_sections").select("*").eq("status", "published").eq("is_visible", true).order("display_order");
  if (error) throw error;
  return data || [];
}

export async function fetchAdminSections() {
  const { data, error } = await supabase.from("site_sections").select("*").order("display_order");
  if (error) throw error;
  return data || [];
}

export async function saveSection(section) {
  const payload = { ...section, title: section.title.trim(), short_description: section.short_description?.trim() || "", subtitle: section.subtitle?.trim() || "", full_description: section.full_description?.trim() || "", updated_at: new Date().toISOString() };
  if (!payload.title) throw new Error("Section title is required.");
  if (payload.title.length > 120) throw new Error("Section title must be 120 characters or fewer.");
  if (payload.short_description.length > 300) throw new Error("Short description must be 300 characters or fewer.");
  if (payload.full_description.length > 3000) throw new Error("Full description must be 3,000 characters or fewer.");
  const { data, error } = await supabase.from("site_sections").upsert(payload, { onConflict: "section_key" }).select().single();
  if (error) throw error;
  return data;
}

export async function publishSection(sectionKey, isVisible) {
  const { data, error } = await supabase.from("site_sections").update({ status: isVisible ? "published" : "hidden", is_visible: isVisible, published_at: isVisible ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("section_key", sectionKey).select().single();
  if (error) throw error;
  return data;
}
