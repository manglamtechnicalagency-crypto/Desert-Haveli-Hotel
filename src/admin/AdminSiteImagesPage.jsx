import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminSiteImages, removeSiteImage, replaceSiteImage, siteImageUrl, SITE_IMAGE_SLOTS } from "../lib/siteImages";
import { images } from "../data";
import { fetchAdminSections, SECTION_DEFAULTS, saveSection, publishSection } from "../lib/siteContent";
import { fetchAdminVideos, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, readVideoMetadata, siteVideoUrl, uploadSiteVideo, validateVideoFile } from "../lib/siteVideos";
import { deleteGalleryImage, fetchAdminGalleryImages, galleryImageUrl, GALLERY_CATEGORIES, uploadGalleryImage } from "../lib/siteGallery";

const SECTION_PREVIEW_KEYS = {
  hero: "hero", "haveli-stay": "hotelExteriorReal", "heritage-rooms": "heritageRoomReal", "rooftop-restaurant": "rooftopRestaurant",
  "morning-inside-fort": "exterior", "heritage-room-details": "roomDetailReal", "golden-sunset-view": "sunset", "traditional-haveli-ambience": "interior", "jaisalmer-street-life": "street",
  "room-gallery": "heritageRoomReal", "explore-jaisalmer": "jaisalmerFortView", "guest-experiences": "haveliSittingReal", "hotel-facilities": "hotelExteriorReal", contact: "hotelExteriorReal", footer: "hero"
};

export default function AdminSiteImagesPage() {
  const [saved, setSaved] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("assets");
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [videoSection, setVideoSection] = useState("hero");
  const [videos, setVideos] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoDetails, setVideoDetails] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [draggingVideo, setDraggingVideo] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryCategory, setGalleryCategory] = useState("Rooms");
  const [customGalleryCategory, setCustomGalleryCategory] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
  const grouped = useMemo(() => SITE_IMAGE_SLOTS.reduce((acc, slot) => ({ ...acc, [slot.group]: [...(acc[slot.group] || []), slot] }), {}), []);

  async function load() {
    try {
      setStatus("loading");
      const [mediaResult, sectionResult, videoResult, galleryResult] = await Promise.allSettled([fetchAdminSiteImages(), fetchAdminSections(), fetchAdminVideos(), fetchAdminGalleryImages()]);
      if (mediaResult.status === "fulfilled") setSaved(mediaResult.value); else setError(mediaResult.reason.message);
      if (sectionResult.status === "fulfilled") setSections(sectionResult.value); else setSectionError("Website Sections are not available yet. Apply the latest Supabase migration to enable section editing.");
      if (videoResult.status === "fulfilled") setVideos(videoResult.value); else setSectionError("Website video storage is not available yet. Apply the latest Supabase migration to enable video uploads.");
      if (galleryResult.status === "fulfilled") setGalleryImages(galleryResult.value); else setSectionError("Gallery storage is not available yet. Apply the latest Supabase migration to enable gallery uploads.");
      setStatus("ready");
    }
    catch (err) { setError(err.message); setStatus("error"); }
  }
  useEffect(() => { load(); }, []);

  function editSection(section) {
    const fallback = SECTION_DEFAULTS.find(([key]) => key === section.key);
    setActiveSection(section.section_key ? { ...section } : { section_key: fallback[0], internal_name: fallback[1], title: fallback[2], short_description: fallback[3], subtitle: "", full_description: "", primary_button_text: "", primary_button_url: "", secondary_button_text: "", secondary_button_url: "", status: "draft", is_visible: true, display_order: sections.length });
  }

  async function handleSaveSection(publish = false) {
    try {
      setError(""); const next = await saveSection({ ...activeSection, status: publish ? "published" : (activeSection.status || "draft"), is_visible: publish ? true : activeSection.is_visible });
      setSections((items) => [...items.filter((item) => item.section_key !== next.section_key), next].sort((a, b) => a.display_order - b.display_order));
      setActiveSection(next); setMessage(publish ? "Section published successfully." : "Changes saved as draft.");
    } catch (err) { setError(err.message); }
  }

  async function handleToggleSection(section) {
    try { const next = await publishSection(section.section_key, !section.is_visible); setSections((items) => items.map((item) => item.section_key === next.section_key ? next : item)); setMessage(next.is_visible ? "Section published successfully." : "Section hidden."); }
    catch (err) { setError(err.message); }
  }

  async function selectVideo(file) {
    if (!file) return;
    try { validateVideoFile(file); const details = await readVideoMetadata(file); if (details.duration > MAX_VIDEO_SECONDS + 0.05) throw new Error("Video duration exceeds the 15-second limit. Please upload a shorter video."); setVideoFile(file); setVideoDetails(details); setVideoTitle(file.name.replace(/\.[^.]+$/, "")); setError(""); }
    catch (err) { setVideoFile(null); setVideoDetails(null); setError(err.message); }
  }

  async function handleVideoUpload() {
    if (!videoFile) return;
    try { setUploadingVideo(true); setMessage("Uploading video…"); const next = await uploadSiteVideo(videoFile, videoSection, { title: videoTitle, caption: videoCaption }); setVideos((items) => [next, ...items]); setMessage("Video uploaded successfully."); setVideoFile(null); setVideoDetails(null); setVideoTitle(""); setVideoCaption(""); }
    catch (err) { setError(err.message); }
    finally { setUploadingVideo(false); }
  }

  async function handleGalleryUpload() {
    if (!galleryFiles.length) return;
    try {
      setGalleryUploading(true); setError(""); setMessage(`Uploading ${galleryFiles.length} gallery image${galleryFiles.length === 1 ? "" : "s"}…`);
      const uploaded = [];
      const category = galleryCategory === "Custom" ? customGalleryCategory.trim() : galleryCategory;
      if (!category) throw new Error("Enter custom gallery category.");
      for (const file of galleryFiles) uploaded.push(await uploadGalleryImage(file, { category, title: file.name.replace(/\.[^.]+$/, ""), altText: file.name.replace(/\.[^.]+$/, "") }));
      setGalleryImages((items) => [...items, ...uploaded]); setGalleryFiles([]); setMessage(`${uploaded.length} gallery image${uploaded.length === 1 ? "" : "s"} added successfully.`);
    } catch (err) { setError(err.message); }
    finally { setGalleryUploading(false); }
  }

  async function handleGalleryDelete(image) {
    if (!window.confirm("Delete this gallery image from the public website?")) return;
    try { await deleteGalleryImage(image); setGalleryImages((items) => items.filter((item) => item.id !== image.id)); setMessage("Gallery image deleted."); } catch (err) { setError(err.message); }
  }

  async function handleReplace(slot, file, altText) {
    if (!file) return;
    try {
      setError(""); setMessage(`Uploading ${slot.label}…`);
      const next = await replaceSiteImage(slot.key, file, altText);
      setSaved((current) => [...current.filter((item) => item.slot_key !== slot.key), next]);
      setMessage(`${slot.label} replaced. It is now live on the website.`);
    } catch (err) { setError(err.message); setMessage(""); }
  }

  async function handleRemove(slot, current) {
    if (!window.confirm(`Restore the default ${slot.label} image?`)) return;
    try { await removeSiteImage(current); setSaved((items) => items.filter((item) => item.slot_key !== slot.key)); setMessage(`${slot.label} restored to the bundled default.`); }
    catch (err) { setError(err.message); }
  }

  if (status === "loading") return <div className="admin-page"><p>Loading website photos…</p></div>;

  return <div className="admin-page">
    <div className="admin-page-header">
      <h1>Media Library</h1>
      <p>Manage website media and section content from one place.</p>
    </div>
    <div className="admin-tabs" role="tablist">
      <button className={mode === "assets" ? "active" : ""} onClick={() => setMode("assets")}>Media Assets</button>
      <button className={mode === "sections" ? "active" : ""} onClick={() => setMode("sections")}>Website Sections</button>
    </div>
    {message && <p className="admin-form-success">{message}</p>}
    {error && <p className="admin-form-error">{error}</p>}
    {mode === "sections" && sectionError && <p className="admin-form-warning">{sectionError}</p>}
    {mode === "assets" && <>
    <section className="admin-section gallery-manager">
      <div className="admin-page-header"><div><span className="admin-kicker">PUBLIC GALLERY</span><h2>Add gallery images</h2><p>Upload one or many images. New images appear in Gallery automatically.</p></div><span className="video-limit-badge">JPG · PNG · WEBP · 10 MB</span></div>
      <div className="gallery-upload-bar"><label className="gallery-file-picker"><span>Choose images</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setGalleryFiles([...event.target.files])} /></label><select value={galleryCategory} onChange={(event) => setGalleryCategory(event.target.value)}>{GALLERY_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>{galleryCategory === "Custom" && <input className="gallery-custom-category" placeholder="Custom category name" value={customGalleryCategory} onChange={(event) => setCustomGalleryCategory(event.target.value)} maxLength="40" />}<span className="gallery-file-count">{galleryFiles.length ? `${galleryFiles.length} selected` : "No files selected"}</span><button className="btn primary" type="button" disabled={!galleryFiles.length || galleryUploading} onClick={handleGalleryUpload}>{galleryUploading ? "Uploading…" : "Add to Gallery"}</button></div>
      {galleryImages.length > 0 ? <div className="gallery-admin-grid">{galleryImages.map((image) => <article key={image.id}><img src={galleryImageUrl(image.storage_path)} alt={image.alt_text || ""} /><div><strong>{image.title || "Gallery image"}</strong><small>{image.category}</small><button className="btn small danger" type="button" onClick={() => handleGalleryDelete(image)}>Delete</button></div></article>)}</div> : <div className="gallery-empty-state"><strong>No additional gallery images yet.</strong><span>Choose multiple files above to build the public Gallery.</span></div>}
    </section>
    <section className="admin-section video-manager">
      <div className="admin-page-header"><div><h2>Short website videos</h2><p>Upload a short atmospheric clip for a website section.</p></div><span className="video-limit-badge">15 sec · 200 MB</span></div>
      <div className={`video-dropzone ${draggingVideo ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDraggingVideo(true); }} onDragLeave={() => setDraggingVideo(false)} onDrop={(event) => { event.preventDefault(); setDraggingVideo(false); selectVideo(event.dataTransfer.files?.[0]); }}>
        <span className="video-upload-icon">▶</span><strong>{videoFile ? videoFile.name : "Drop a video here"}</strong><small>MP4, WebM or MOV · up to 15 seconds and 200 MB</small>
        <label className="btn small secondary">Choose video<input hidden type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => selectVideo(event.target.files?.[0])} /></label>
      </div>
      {videoDetails && <div className="video-upload-preview"><video src={videoDetails.url} controls muted playsInline /><div><strong>Ready to upload</strong><p>{videoFile.name} · {videoDetails.width}×{videoDetails.height} · {videoDetails.duration.toFixed(1)} sec · {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p><label>Website section<select value={videoSection} onChange={(event) => setVideoSection(event.target.value)}>{SECTION_DEFAULTS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><label>Video title<input value={videoTitle} maxLength="120" onChange={(event) => setVideoTitle(event.target.value)} /></label><label>Caption<input value={videoCaption} maxLength="300" onChange={(event) => setVideoCaption(event.target.value)} /></label><button className="btn primary" type="button" disabled={uploadingVideo} onClick={handleVideoUpload}>{uploadingVideo ? "Uploading…" : "Upload video"}</button></div></div>}
      {videos.length > 0 && <div className="video-library-list">{videos.map((video) => <article key={video.id}><video src={siteVideoUrl(video.storage_path)} poster={video.poster_url || undefined} muted playsInline controls /><div><strong>{video.title}</strong><small>{video.section_key} · {Number(video.duration_seconds).toFixed(1)} sec · {video.status}</small><p>{video.caption || "No caption"}</p></div></article>)}</div>}
    </section>
    <div className="admin-site-image-groups">
      {Object.entries(grouped).map(([group, slots]) => <section className="admin-section" key={group}>
        <div className="admin-section-heading"><div><span className="admin-kicker">IMAGE GROUP</span><h2>{group}</h2><p>{slots.length} editable image slots · changes publish immediately</p></div><span className="admin-count-badge">{slots.length}</span></div>
        <div className="admin-site-image-grid">
          {slots.map((slot) => {
            const current = saved.find((item) => item.slot_key === slot.key);
            const src = current ? siteImageUrl(current.storage_path) : images[slot.key];
            return <figure className="admin-site-image-card" key={slot.key}>
              <img src={src} alt={current?.alt_text || slot.label} loading="lazy" />
              <figcaption>
                <div className="admin-card-title-row"><strong>{slot.label}</strong><span className={`media-status ${current ? "custom" : "default"}`}>{current ? "Live" : "Default"}</span></div>
                <small>{current ? "Custom image is active on the website" : "Using the bundled fallback image"}</small>
                <p>{slot.description}</p>
                <label className="media-replace-button">Replace image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleReplace(slot, event.target.files?.[0], current?.alt_text || slot.label)} /></label>
                {current && <button className="btn small danger" type="button" onClick={() => handleRemove(slot, current)}>Restore default</button>}
              </figcaption>
            </figure>;
          })}
        </div>
      </section>)}
    </div></>}
    {mode === "sections" && <div className="admin-section-editor-layout">
      {!activeSection ? <div className="admin-site-image-grid">{SECTION_DEFAULTS.map(([key, internalName, title, description]) => { const section = sections.find((item) => item.section_key === key) || { key, internal_name: internalName, title, short_description: description, status: "draft", is_visible: true }; return <article className="admin-section-card" key={key}><h2>{section.internal_name || internalName}</h2><code>{key}</code><p>{section.short_description || description}</p><small>{section.status || "draft"} · {section.is_visible === false ? "hidden" : "visible"}</small><button className="btn small secondary" onClick={() => editSection(section)}>Edit section</button><button className="btn small ghost-light" onClick={() => handleToggleSection(section)}>{section.is_visible === false ? "Show" : "Hide"}</button></article>; })}</div> : <section className="admin-section admin-content-editor"><div className="admin-page-header"><h2>Edit {activeSection.internal_name}</h2><button className="btn small ghost-light" onClick={() => setActiveSection(null)}>Back to sections</button></div><label>Title<input maxLength="120" value={activeSection.title || ""} onChange={(e) => setActiveSection({ ...activeSection, title: e.target.value })} /></label><label>Subtitle<input maxLength="180" value={activeSection.subtitle || ""} onChange={(e) => setActiveSection({ ...activeSection, subtitle: e.target.value })} /></label><label>Short description<textarea maxLength="300" value={activeSection.short_description || ""} onChange={(e) => setActiveSection({ ...activeSection, short_description: e.target.value })} /></label><label>Full description<textarea maxLength="3000" rows="6" value={activeSection.full_description || ""} onChange={(e) => setActiveSection({ ...activeSection, full_description: e.target.value })} /></label><div className="admin-form-grid"><label>Primary button text<input maxLength="50" value={activeSection.primary_button_text || ""} onChange={(e) => setActiveSection({ ...activeSection, primary_button_text: e.target.value })} /></label><label>Primary button link<input value={activeSection.primary_button_url || ""} onChange={(e) => setActiveSection({ ...activeSection, primary_button_url: e.target.value })} /></label></div><label className="admin-checkbox"><input type="checkbox" checked={activeSection.is_visible !== false} onChange={(e) => setActiveSection({ ...activeSection, is_visible: e.target.checked })} /> Visible on public website</label><div className="card-actions"><button className="btn secondary" onClick={() => handleSaveSection(false)}>Save Draft</button><button className="btn primary" onClick={() => handleSaveSection(true)}>Publish Changes</button></div></section>}
    </div>}
  </div>;
}
