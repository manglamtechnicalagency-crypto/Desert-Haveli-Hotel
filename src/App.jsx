import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  attractions,
  basicFacilities,
  faqs,
  hotel,
  images,
  requestFacilities,
  restaurantHighlights,
  reviews,
  safariServices,
  services
} from "./data";
import { fetchPublicRooms, publicImageUrl } from "./lib/roomsApi";
import { formatCurrency, getTodayPrice } from "./lib/pricing";
import { fetchPublicSiteImages, siteImageUrl } from "./lib/siteImages";
import { fetchPublicSections, sectionContent } from "./lib/siteContent";
import { fetchPublicGalleryImages, galleryImageUrl } from "./lib/siteGallery";
import "./styles.css";

const navItems = [
  ["Home", "home"],
  ["About", "about"],
  ["Rooms", "rooms"],
  ["Restaurant", "restaurant"],
  ["Facilities", "facilities"],
  ["Safari", "safari"],
  ["Explore", "explore"],
  ["Gallery", "gallery"],
  ["Booking", "booking"],
  ["Contact", "contact"]
];

const bookingText =
  "Hello Desert Haveli Guest House,\nI want to enquire about room booking.\n\nCheck-in:\nCheck-out:\nGuests:\nPreferred Room:\n\nPlease confirm availability and price.";

function whatsappUrl(message = bookingText) {
  return `${hotel.whatsappBase}?text=${encodeURIComponent(message)}`;
}

function emailUrl(message = bookingText) {
  return `mailto:${hotel.email}?subject=${encodeURIComponent(hotel.emailSubject)}&body=${encodeURIComponent(message)}`;
}

function sectionText(key, field, fallback) {
  return sectionContent[key]?.[field] || fallback;
}

function Icon({ children }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Reveal({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [activeId, setActiveId] = useState("home");

  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const sections = navItems
      .map(([, id]) => document.getElementById(id))
      .filter(Boolean);
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-22% 0px -62% 0px", threshold: [0.1, 0.35, 0.7] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <header className={`navbar ${solid || open ? "solid" : ""}`}>
      <a className="brand" href="#home" aria-label="Desert Haveli home">
        <span className="brand-mark">DH</span>
        <span><strong>The Desert Haveli</strong><small>Guest House Jaisalmer</small></span>
      </a>
      <button className={`menu-toggle ${open ? "is-open" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="main-menu" aria-label={open ? "Close navigation" : "Open navigation"}>
        <span></span><span></span><span></span>
      </button>
      {open && <button className="nav-scrim" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <nav id="main-menu" className={open ? "open" : ""}>
        {navItems.map(([label, id]) => (
          <a key={id} className={activeId === id ? "active" : ""} href={`#${id}`} aria-current={activeId === id ? "page" : undefined} onClick={() => { setActiveId(id); setOpen(false); }}>{label}</a>
        ))}
        <a className="nav-cta" data-cta="contact-whatsapp" href={whatsappUrl()} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="home">
      <img
        className="hero-bg"
        src={images.hero}
        alt="Golden sandstone arches at Desert Haveli Guest House inside Jaisalmer Fort"
        fetchPriority="high"
      />
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {sectionText("hero", "title", "Stay Inside the Living Golden Fort of Jaisalmer")}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.8 }}>
          {sectionText("hero", "short_description", "Experience 450 years of heritage, royal haveli rooms, rooftop dining, desert views, and authentic Jaisalmer hospitality.")}
        </motion.p>
      </div>
    </section>
  );
}

function BookingBar({ rooms }) {
  const [form, setForm] = useState({ checkin: "", checkout: "", guests: "", room: rooms[0]?.name || "" });
  const [compact, setCompact] = useState(false);
  const [showBookingBar, setShowBookingBar] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const message = `Hello Desert Haveli Guest House,\nI want to enquire about room booking.\n\nCheck-in: ${form.checkin}\nCheck-out: ${form.checkout}\nGuests: ${form.guests}\nPreferred Room: ${form.room}\n\nPlease confirm availability and price.`;

  React.useEffect(() => {
    const onScroll = () => {
      const isMobile = window.innerWidth <= 760;
      const shouldCompact = isMobile && window.scrollY > window.innerHeight * 0.45;
      const shouldShow = isMobile ? shouldCompact : window.scrollY > 80;
      setCompact(shouldCompact);
      setShowBookingBar(shouldShow);
      if (!shouldShow) setModalOpen(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  React.useEffect(() => {
    if (!form.room && rooms.length > 0) setForm((f) => ({ ...f, room: rooms[0].name }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  React.useEffect(() => {
    document.body.classList.toggle("booking-modal-open", compact && modalOpen);
    return () => document.body.classList.remove("booking-modal-open");
  }, [compact, modalOpen]);

  React.useEffect(() => {
    if (!modalOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  if (!showBookingBar) return null;

  return (
    <>
      <section className={`booking-bar ${compact ? "capsule" : ""}`} aria-label="Quick booking enquiry">
      {compact ? (
        <button className="booking-capsule" type="button" aria-expanded={modalOpen} aria-controls="booking-modal" onClick={() => setModalOpen(true)}>
          <span>Check dates</span>
          <strong>Book Direct</strong>
          <small className="booking-offer"><b>OFFER</b> Get an extra discount when you book here</small>
        </button>
      ) : (
        <>
      <label>Check-in<input name="checkin" type="date" value={form.checkin} onChange={update} /></label>
      <label>Check-out<input name="checkout" type="date" value={form.checkout} onChange={update} /></label>
      <label>Guests<input name="guests" min="1" type="number" placeholder="2" value={form.guests} onChange={update} /></label>
      <label>Preferred room<select name="room" value={form.room} onChange={update}>{rooms.map((room) => <option key={room.name}>{room.name}</option>)}</select></label>
      <a className="btn primary booking-whatsapp-btn" data-cta="whatsapp-booking" href={whatsappUrl(message)} target="_blank" rel="noreferrer"><span>Book on WhatsApp</span><small>Extra discount when you book direct</small></a>
        </>
      )}
      </section>
      {compact && modalOpen ? (
        <div className="booking-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="booking-modal" id="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
            <div className="booking-modal-header">
              <h2 id="booking-modal-title">Check your dates</h2>
              <button className="booking-modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Close booking form">×</button>
            </div>
            <div className="booking-modal-fields">
              <label>Check-in<input name="checkin" type="date" value={form.checkin} onChange={update} /></label>
              <label>Check-out<input name="checkout" type="date" value={form.checkout} onChange={update} /></label>
              <label>Guests<input name="guests" min="1" type="number" placeholder="2" value={form.guests} onChange={update} /></label>
              <label>Preferred room<select name="room" value={form.room} onChange={update}>{rooms.map((room) => <option key={room.name}>{room.name}</option>)}</select></label>
            </div>
            <p className="booking-discount-note">Book directly with the hotel to ask about your best available rate.</p>
            <a className="btn primary booking-whatsapp-btn" data-cta="whatsapp-booking" href={whatsappUrl(message)} target="_blank" rel="noreferrer" onClick={() => setModalOpen(false)}><span>Book on WhatsApp</span><small>Extra discount when you book direct</small></a>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="section-title">
      {eyebrow && <span>{eyebrow}</span>}
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function Showcase() {
  const items = [
    ["Fort View", images.fortView],
    ["Heritage Room", images.heritageRoomReal],
    ["Traditional Interior", images.haveliInteriorReal],
    ["Hotel Exterior", images.hotelExteriorReal]
  ];
  return (
    <section className="section showcase">
      <Reveal>
        <SectionTitle title={sectionText("haveli-stay", "title", "A Haveli Stay Framed by Golden Stone")}>
          {sectionText("haveli-stay", "short_description", "Real hotel photos, heritage details, and warm direct hospitality create the atmosphere of a boutique stay inside the fort.")}
        </SectionTitle>
      </Reveal>
      <div className="showcase-grid">
        <Reveal className="feature-image tilt">
          <img loading="lazy" src={images.hotelExteriorReal} alt="Desert Haveli Guest House sandstone exterior inside Jaisalmer Fort" />
          <strong>Golden Fort Ambience</strong>
        </Reveal>
        <div className="mini-grid">
          {items.map(([label, src]) => (
            <Reveal className="mini-card tilt" key={label}>
              <img loading="lazy" src={src} alt={`${label} at Desert Haveli Guest House Jaisalmer`} />
              <strong>{label}</strong>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  const usps = [
    "Wake up inside a living fort",
    "Walk to Jain Temples",
    "Experience traditional Jaisalmer streets",
    "Enjoy sunrise and sunset views",
    "Stay in a 450-year-old haveli",
    "Book directly with the hotel"
  ];
  return (
    <section className="section split about" id="about">
      <Reveal className="split-copy">
        <SectionTitle title="The Story of a 450-Year Heritage Stay">
          The Desert Haveli Guest House offers a rare opportunity to live inside Jaisalmer's iconic Golden Fort. Set within a historic bastion, the property blends old-world Rajputana charm with modern comfort, warm hospitality, and unforgettable desert-city views.
        </SectionTitle>
        <p>
          The building stands on the rampart of Jaisalmer Fort and preserves original walls, traditional design, and old-world atmosphere. Inspired by Atithi Devo Bhava, the team aims to make every stay personal, comfortable, and memorable.
        </p>
      </Reveal>
      <Reveal className="usp-panel">
        {usps.map((item, index) => (
          <motion.div
            className="usp"
            key={item}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
          >
            <Icon>{String(index + 1).padStart(2, "0")}</Icon>
            <span>{item}</span>
          </motion.div>
        ))}
      </Reveal>
    </section>
  );
}

function Restaurant() {
  const message = "Hello Desert Haveli Guest House,\nI want to enquire about rooftop restaurant dining.\n\nDate:\nGuests:\nPreferred Time:\nMessage:\n\nPlease confirm availability.";
  return (
    <section className="section restaurant" id="restaurant">
      <Reveal>
        <SectionTitle title={sectionText("rooftop-restaurant", "title", "Rooftop Restaurant with Sweeping Views of Jaisalmer")}>
          {sectionText("rooftop-restaurant", "short_description", "Enjoy fresh, hygienic Rajasthani and Indian food from our rooftop restaurant while experiencing panoramic views of Jaisalmer's Golden Fort, old city streets, and desert skyline.")}
        </SectionTitle>
      </Reveal>
      <div className="restaurant-grid">
        <Reveal className="restaurant-photo">
          <img loading="lazy" src={images.rooftopRestaurant} alt="Demo rooftop restaurant setup with Jaisalmer fort and city views" />
        </Reveal>
        <Reveal className="restaurant-copy">
          <h3>Views That Change With Your Seat</h3>
          <p>Many cities have revolving restaurants where guests enjoy food with changing views. Here, the restaurant does not revolve. Guests simply change their seat to enjoy different charming views of Jaisalmer.</p>
          <div className="food-card">
            <img loading="lazy" src={images.rajasthaniThali} alt="Demo Rajasthani thali with Ker Sangri and masala tea" />
            <span>Menu pricing: Available on request</span>
          </div>
          <a className="btn primary" data-cta="restaurant-enquiry" href={whatsappUrl(message)} target="_blank" rel="noreferrer">Ask About Rooftop Dining</a>
        </Reveal>
      </div>
      <div className="service-grid compact">
        {restaurantHighlights.map(([title, text]) => (
          <Reveal className="service-card menu-card" key={title}><h3>{title}</h3><p>{text}</p></Reveal>
        ))}
      </div>
    </section>
  );
}

function Facilities() {
  const message = "Hello Desert Haveli Guest House,\nI want to know charges for the following service:\n\nService:\nDate:\nGuests:\nPickup/Drop Location if any:\nMessage:\n\nPlease share details and availability.";
  return (
    <section className="section facilities" id="facilities">
      <Reveal>
        <SectionTitle title={sectionText("hotel-facilities", "title", "Hotel Facilities")}>
          {sectionText("hotel-facilities", "short_description", "We provide essential guest facilities for a comfortable heritage stay. Some services are included, while selected travel, food, pickup, and personal services may be chargeable or available on request.")}
        </SectionTitle>
      </Reveal>
      <div className="facility-columns">
        <Reveal className="facility-panel">
          <h3>Basic / General Facilities</h3>
          {basicFacilities.map((item) => <span className="facility-item" key={item}>{item}<small>Available</small></span>)}
        </Reveal>
        <Reveal className="facility-panel request">
          <h3>On-Request / Chargeable Facilities</h3>
          {requestFacilities.map((item, index) => <span className="facility-item" key={item}>{item}<small>{index % 3 === 0 ? "Chargeable" : index % 3 === 1 ? "On Request" : "Ask Hotel"}</small></span>)}
        </Reveal>
      </div>
      <p className="asset-note">Some services are chargeable and may vary based on availability, season, distance, and guest requirements. Please confirm details directly with the hotel before booking.</p>
      <a className="btn primary" data-cta="contact-whatsapp" href={whatsappUrl(message)} target="_blank" rel="noreferrer">Ask Charges on WhatsApp</a>
    </section>
  );
}

function Safari() {
  const message = "Hello Desert Haveli Guest House,\nI want to enquire about desert safari / travel assistance.\n\nService:\nDate:\nGuests:\nPickup Location:\nMessage:\n\nPlease share availability and charges.";
  return (
    <section className="section safari" id="safari">
      <Reveal>
        <SectionTitle title="Desert Safari & Travel Assistance">
          The Desert Haveli team has experience in organising memorable desert camel safari experiences deep into the Thar Desert. Guests can also enquire about jeep/car trips around Jaisalmer to explore historical sites, royal gardens, cenotaphs, Jain temples, Kuldhara, Khaba, desert villages, and sandy dunes.
        </SectionTitle>
      </Reveal>
      <div className="service-grid compact">
        {safariServices.map((service) => (
          <Reveal className="service-card" key={service}>
            <h3>{service}</h3>
            <p>Available on request. Charges may apply.</p>
            <a data-cta="safari-enquiry" href={whatsappUrl(message.replace("Service:", `Service: ${service}`))} target="_blank" rel="noreferrer">Enquire About Desert Safari</a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function RoomGallery({ images: roomImages, roomName }) {
  const [index, setIndex] = useState(0);
  const touchStartX = React.useRef(null);
  const galleryRef = React.useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [manualRevision, setManualRevision] = useState(0);
  const imageCount = roomImages?.length || 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (imageCount < 2 || !galleryRef.current || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(galleryRef.current);
    return () => observer.disconnect();
  }, [imageCount]);

  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(imageCount - 1, 0)));
  }, [imageCount]);

  useEffect(() => {
    if (imageCount < 2 || prefersReducedMotion || !isVisible || isPaused) return undefined;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % imageCount);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [imageCount, index, isPaused, isVisible, manualRevision, prefersReducedMotion]);

  if (imageCount === 0) {
    return (
      <div className="room-gallery empty" role="img" aria-label={`No photos yet for ${roomName}`}>
        <span>Photos coming soon</span>
      </div>
    );
  }

  const restartAutoSlide = () => setManualRevision((revision) => revision + 1);
  const go = (delta) => {
    restartAutoSlide();
    setIndex((i) => (i + delta + imageCount) % imageCount);
  };

  return (
    <div
      ref={galleryRef}
      className="room-gallery"
      role="group"
      aria-roledescription="carousel"
      aria-label={`${roomName} photos`}
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
        touchStartX.current = null;
      }}
    >
      <img
        key={roomImages[index].storage_path}
        className="room-gallery-image"
        loading="lazy"
        src={publicImageUrl(roomImages[index].storage_path)}
        alt={roomImages[index].alt_text || `${roomName} photo ${index + 1} of ${roomImages.length}`}
      />
      {imageCount > 1 && (
        <>
          <button type="button" className="gallery-nav prev" aria-label="Previous photo" onClick={() => go(-1)}>‹</button>
          <button type="button" className="gallery-nav next" aria-label="Next photo" onClick={() => go(1)}>›</button>
          <div className="gallery-dots" role="tablist" aria-label={`${roomName} photo selector`}>
            {roomImages.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show photo ${i + 1}`}
                className={i === index ? "active" : ""}
                onClick={() => {
                  restartAutoSlide();
                  setIndex(i);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RoomCard({ room }) {
  const message = `Hello Desert Haveli Guest House,\nI want to enquire about the ${room.name}.\n\nCheck-in:\nCheck-out:\nGuests:\n\nPlease confirm availability and final price.`;
  const priced = getTodayPrice(room, room.room_price_overrides, room.room_pricing_rules);
  const priceLabel =
    priced.price != null
      ? `${formatCurrency(priced.price, room.currency)} / night`
      : room.public_availability_message || "Enquire for price";
  const canBook = room.is_bookable && room.availability_status === "available";

  return (
    <article className="room-card tilt">
      <RoomGallery images={room.room_images} roomName={room.name} />
      <div>
        <h3>{room.name}</h3>
        <strong>{priceLabel}</strong>
        <p>{room.short_description}</p>
        <ul className="room-features" aria-label={`${room.name} features`}>
          {(room.room_features || []).slice(0, 4).map((feature) => (
            <li key={feature.id}>{feature.name}</li>
          ))}
        </ul>
        {!canBook && (
          <p className="room-status-note" data-status={room.availability_status}>
            {room.availability_status === "available" ? "Not currently bookable" : (room.availability_status || "unavailable").replace(/_/g, " ")}
          </p>
        )}
        <div className="card-actions">
          <a className="btn small ghost-light" href="#gallery">View Gallery</a>
          <a
            className="btn small primary"
            data-cta="room-booking"
            href={whatsappUrl(message)}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!canBook}
          >
            {canBook ? "Book Now" : "Enquire"}
          </a>
        </div>
      </div>
    </article>
  );
}

function Rooms({ rooms, loading, error }) {
  return (
    <section className="section rooms" id="rooms">
      <Reveal>
        <SectionTitle title={sectionText("heritage-rooms", "title", "Heritage Rooms Inside Jaisalmer Fort")}>
          {sectionText("heritage-rooms", "short_description", "Choose a traditional or modern heritage room and enquire directly with the hotel for availability and final confirmation.")}
        </SectionTitle>
      </Reveal>

      {loading && <p className="asset-note">Loading rooms…</p>}
      {error && <p className="asset-note">Rooms could not be loaded right now. Please contact the hotel directly.</p>}
      {!loading && !error && rooms.length === 0 && <p className="asset-note">Room listings are being updated. Please check back shortly.</p>}

      {!loading && !error && rooms.length > 0 && (
        <div className="rooms-grid">{rooms.map((room) => <Reveal key={room.id}><RoomCard room={room} /></Reveal>)}</div>
      )}
    </section>
  );
}

function Experiences() {
  return (
    <section className="section experiences" id="experiences">
      <Reveal>
        <SectionTitle title="Experiences & Guest Services">
          Practical comfort, local guidance, and heritage atmosphere help guests enjoy old Jaisalmer without unnecessary third-party detours.
        </SectionTitle>
      </Reveal>
      <div className="service-grid">
        {services.map(([title, text], index) => (
          <Reveal className="service-card" key={title}>
            <Icon>{String(index + 1).padStart(2, "0")}</Icon>
            <h3>{title}</h3>
            <p>{text}</p>
            <a data-cta="contact-whatsapp" href={whatsappUrl(`Hello Desert Haveli Guest House,\nI want to ask about ${title}.\n\nPlease share details.`)} target="_blank" rel="noreferrer">Enquire on WhatsApp</a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Gallery({ uploadedImages = [] }) {
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);
  const gallery = [
    ["Rooms", images.heritageRoomReal, "Real heritage room at Desert Haveli Guest House"],
    ["Interior", images.roomDetailReal, "Real room mirror and heritage arch detail"],
    ["Interior", images.haveliSittingReal, "Real haveli sitting area inside Desert Haveli Guest House"],
    ["Interior", images.haveliInteriorReal, "Real haveli interior and window seating"],
    ["Restaurant", images.rooftopRestaurant, "Demo rooftop restaurant with Jaisalmer views"],
    ["Restaurant", images.rajasthaniThali, "Demo Rajasthani thali and Ker Sangri"],
    ["Fort View", images.fortView, "Golden fort and city view"],
    ["Exterior", images.exterior, "Golden Fort exterior"],
    ["Exterior", images.hotelExteriorReal, "Real Desert Haveli Guest House exterior"],
    ["Jaisalmer", images.sunset, "Sunset near Jaisalmer heritage architecture"],
    ["Interior", images.street, "Jaisalmer fort street life"]
  ];
  const uploaded = uploadedImages.map((item) => [item.category || "Rooms", galleryImageUrl(item.storage_path), item.alt_text || item.title || "Gallery image"]);
  const tabs = ["All", ...new Set(["Rooms", "Restaurant", "Fort View", "Interior", "Exterior", "Jaisalmer", ...uploaded.map(([type]) => type)])];
  const allGallery = [...gallery, ...uploaded];
  const filtered = filter === "All" ? allGallery : allGallery.filter(([type]) => type === filter);

  return (
    <section className="section gallery" id="gallery">
      <Reveal>
        <SectionTitle title={sectionText("room-gallery", "title", "Gallery")}>
          {sectionText("room-gallery", "short_description", "Browse the visual story of the fort, interiors, city views, and haveli atmosphere.")}
        </SectionTitle>
      </Reveal>
      <div className="tabs" role="tablist" aria-label="Gallery filters">
        {tabs.map((tab) => <button key={tab} className={filter === tab ? "active" : ""} onClick={() => setFilter(tab)}>{tab}</button>)}
      </div>
      <div className="gallery-grid">
        {filtered.map(([type, src, alt], index) => (
          <button className="gallery-item" key={`${type}-${index}`} onClick={() => setActive({ src, alt })}>
            <img loading="lazy" src={src} alt={alt} />
            <span>{type}</span>
          </button>
        ))}
      </div>
      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setActive(null)}>
          <button aria-label="Close gallery preview">Close</button>
          <img src={active.src} alt={active.alt} />
        </div>
      )}
    </section>
  );
}

function Story() {
  const blocks = [
    [sectionText("morning-inside-fort", "title", "Morning Inside the Fort"), images.exterior],
    [sectionText("heritage-room-details", "title", "Heritage Room Details"), images.heritage],
    [sectionText("golden-sunset-view", "title", "Golden Sunset View"), images.sunset],
    [sectionText("traditional-haveli-ambience", "title", "Traditional Haveli Ambience"), images.interior],
    [sectionText("jaisalmer-street-life", "title", "Jaisalmer Street Life"), images.street]
  ];
  return (
    <section className="story-strip">
      {blocks.map(([title, src]) => (
        <article key={title}>
          <img loading="lazy" src={src} alt={`${title} at Desert Haveli Guest House Jaisalmer`} />
          <h3>{title}</h3>
        </article>
      ))}
    </section>
  );
}

function Nearby() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const attractionImageKeys = {
    "Jaisalmer Fort / Sonar Quila": "jaisalmerFortView",
    "Jain Temples": "jainTemples",
    "Patwon Ki Haveli": "patwonHaveli",
    "Gadisar Lake": "gadisarLake",
    "Sam Sand Dunes": "samSandDunes",
    "Local Fort Market": "localFortMarket",
    "Bada Bagh / Bara Bagh": "badaBagh",
    "Kuldhara and Khaba": "kuldhara",
    "Wood Fossil Park": "woodFossilPark"
  };

  useEffect(() => {
    if (activeIndex === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % attractions.length);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + attractions.length) % attractions.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeIndex]);

  const openAttraction = (index) => {
    setActiveIndex(index);
    setZoom(1);
  };

  return (
    <section className="section nearby" id="explore">
      <Reveal>
        <SectionTitle title={sectionText("explore-jaisalmer", "title", "Explore Jaisalmer")}>
          {sectionText("explore-jaisalmer", "short_description", "The hotel is a heritage base for Jaisalmer Fort, havelis, Jain temples, desert villages, dunes, local markets, and city walks.")}
        </SectionTitle>
      </Reveal>
      <div className="nearby-grid">
        {attractions.map(([name, text, src, distance, travelTime], index) => (
          <Reveal className="attraction" key={name}>
            <button className="attraction-image-trigger" type="button" onClick={() => openAttraction(index)} aria-label={`Open larger image of ${name}`}>
              <img loading="lazy" src={images[attractionImageKeys[name]] || src} alt={`${name} near Desert Haveli Guest House Jaisalmer`} />
              <span className="image-zoom-hint" aria-hidden="true">⌕</span>
            </button>
            <h3>{name}</h3>
            <p>{text}</p>
            <div className="attraction-meta" aria-label={`Approximate distance and travel time from the hotel: ${distance}, ${travelTime}`}>
              <span>⌖ {distance}</span>
              <span>◷ {travelTime}</span>
            </div>
            <small className="attraction-meta-note">Approx. from the hotel</small>
            <a data-cta="contact-whatsapp" href={whatsappUrl(`Hello Desert Haveli Guest House,\nPlease guide me for visiting ${name}.`)} target="_blank" rel="noreferrer">Ask for Local Guidance</a>
          </Reveal>
        ))}
      </div>
      {activeIndex !== null && (
        <div className="explore-lightbox" role="dialog" aria-modal="true" aria-label={`${attractions[activeIndex][0]} image viewer`} onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }}>
          <button className="explore-lightbox-close" type="button" onClick={() => setActiveIndex(null)} aria-label="Close image viewer">×</button>
          <button className="explore-lightbox-nav prev" type="button" onClick={() => setActiveIndex((activeIndex - 1 + attractions.length) % attractions.length)} aria-label="Previous image">‹</button>
          <div className="explore-lightbox-stage" onWheel={(event) => { event.preventDefault(); setZoom((current) => Math.min(3, Math.max(1, current + (event.deltaY < 0 ? 0.2 : -0.2)))); }}>
            <img
              src={images[attractionImageKeys[attractions[activeIndex][0]]] || attractions[activeIndex][2]}
              alt={`${attractions[activeIndex][0]} near Desert Haveli Guest House Jaisalmer`}
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
          <button className="explore-lightbox-nav next" type="button" onClick={() => setActiveIndex((activeIndex + 1) % attractions.length)} aria-label="Next image">›</button>
          <div className="explore-lightbox-controls" aria-label="Zoom controls">
            <button type="button" onClick={() => setZoom((current) => Math.max(1, current - 0.25))} aria-label="Zoom out">−</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((current) => Math.min(3, current + 0.25))} aria-label="Zoom in">+</button>
            <button type="button" onClick={() => setZoom(1)}>Reset</button>
          </div>
        </div>
      )}
    </section>
  );
}

function BookingForm({ rooms }) {
  const initial = { name: "", phone: "", email: "", checkin: "", checkout: "", guests: "", room: "", service: "Room Booking", message: "" };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const enquiryMessage = useMemo(() => `Hello Desert Haveli Guest House,\nI want to enquire about booking.\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nCheck-in: ${form.checkin}\nCheck-out: ${form.checkout}\nGuests: ${form.guests}\nPreferred Room: ${form.room}\nService Interest: ${form.service}\nMessage: ${form.message}\n\nPlease confirm availability and price.`, [form]);

  const validate = () => {
    const next = {};
    ["name", "phone"].forEach((key) => {
      if (!form[key] || !form[key].trim()) next[key] = "Required";
    });

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Enter a valid email address";
    }

    // Guest count: must be a positive integer, no 0, negatives, decimals, or non-numeric input.
    const guestsRaw = form.guests;
    if (guestsRaw === "" || guestsRaw === null || guestsRaw === undefined) {
      next.guests = "Required";
    } else if (!/^\d+$/.test(String(guestsRaw))) {
      next.guests = "Enter a whole number of guests";
    } else if (Number(guestsRaw) < 1) {
      next.guests = "At least 1 guest is required";
    }

    if (form.service === "Room Booking") {
      ["checkin", "checkout", "room"].forEach((key) => {
        if (!form[key]) next[key] = "Required";
      });
      if (form.checkin && form.checkout && form.checkout <= form.checkin) {
        next.checkout = "Check-out must be after check-in";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const open = (type) => {
    if (submitting) return; // prevent duplicate submission from a double-click
    if (!validate()) return;
    setSubmitting(true);
    try {
      window.open(type === "whatsapp" ? whatsappUrl(enquiryMessage) : emailUrl(enquiryMessage), type === "whatsapp" ? "_blank" : "_self");
      setSubmitted(true);
    } finally {
      setTimeout(() => setSubmitting(false), 1200);
    }
  };

  return (
    <section className="section booking" id="booking">
      <Reveal>
        <SectionTitle title="Plan Your Heritage Stay in Jaisalmer">
          Send your travel dates directly to the hotel and receive availability confirmation on WhatsApp or email.
        </SectionTitle>
      </Reveal>
      <Reveal className="booking-form">
        {[
          ["name", "Full Name", "text", true],
          ["phone", "Phone / WhatsApp Number", "tel", true],
          ["email", "Email", "email", false],
          ["checkin", "Check-in Date", "date", form.service === "Room Booking"],
          ["checkout", "Check-out Date", "date", form.service === "Room Booking"],
          ["guests", "Number of Guests", "number", true]
        ].map(([name, label, type, isRequired]) => (
          <label key={name}>
            <span className="field-label">{label}{isRequired && <span aria-hidden="true"> *</span>}</span>
            <input
              name={name}
              type={type}
              required={isRequired}
              min={type === "number" ? 1 : undefined}
              step={type === "number" ? 1 : undefined}
              inputMode={type === "number" ? "numeric" : undefined}
              pattern={type === "number" ? "[0-9]*" : undefined}
              value={form[name]}
              onChange={update}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
            />
            {errors[name] && <small id={`${name}-error`} role="alert">{errors[name]}</small>}
          </label>
        ))}
        <label><span className="field-label">Preferred Room{form.service === "Room Booking" && <span aria-hidden="true"> *</span>}</span>
          <select name="room" required={form.service === "Room Booking"} value={form.room} onChange={update}>
            <option value="">Select room</option>
            {rooms.map((room) => <option key={room.name}>{room.name}</option>)}
            <option>Not Sure / Suggest Best Available Room</option>
          </select>
          {errors.room && <small role="alert">{errors.room}</small>}
        </label>
        <label>Service Interest
          <select name="service" value={form.service} onChange={update}>
            {["Room Booking", "Rooftop Restaurant", "Desert Safari", "Local Sightseeing", "Airport Pickup", "Taxi / Travel Assistance", "Other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="full">Message<textarea name="message" rows="5" value={form.message} onChange={update} placeholder="Share arrival time, room preference, or any special request." /></label>
        {submitted && <p className="full admin-form-success" role="status">Enquiry opened — please complete sending it in WhatsApp/email.</p>}
        <div className="form-actions full">
          <button className="btn primary" data-cta="whatsapp-booking" type="button" disabled={submitting} onClick={() => open("whatsapp")}>Send Query on WhatsApp</button>
          <button className="btn secondary" data-cta="email-enquiry" type="button" disabled={submitting} onClick={() => open("email")}>Send Email Enquiry</button>
        </div>
      </Reveal>
      <Timeline />
    </section>
  );
}

function Timeline() {
  const steps = [
    ["Send Booking Enquiry", "Guest sends room preference, check-in date, check-out date, and number of guests through WhatsApp or email."],
    ["Availability Confirmation", "Hotel confirms room availability, price, and stay details."],
    ["Booking Confirmation", "Guest confirms booking as per hotel policy."],
    ["Arrival at Golden Fort", "Guest reaches Golden Fort / Jain Temple area and contacts the hotel for final guidance."],
    ["Guest Check-In", "Guest provides ID proof and completes check-in formalities."],
    ["Stay & Assistance", "Hotel team assists with the room, local guidance, and guest requirements."],
    ["Check-Out", "Guest completes check-out as per hotel timing and clears pending dues if any."]
  ];
  return (
    <Reveal className="timeline">
      <h2>Simple Direct Booking & Guest Check-In Process</h2>
      {steps.map(([title, text], index) => (
        <article key={title}>
          <span>{index + 1}</span>
          <div><h3>{title}</h3><p>{text}</p></div>
        </article>
      ))}
    </Reveal>
  );
}

function ReviewsTrust() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const googleReviewsUrl = "https://www.google.com/travel/search?q=jaisalmer%20desert%20haveli%20on%20fort&g2lb=4965990%2C72471280%2C72560029%2C72573224%2C72647020%2C72686036%2C72803964%2C72882230%2C73064764%2C121529349%2C121738283%2C121762713&hl=en-IN&gl=in&cs=1&ssta=1&ts=CAEaRwopEicyJTB4Mzk0N2JjMjhhZTk0MjU3OToweGE1NTU0YmE3YjQxNDg5MGYSGhIUCgcI6g8QBxgPEgcI6g8QBxgQGAEyAhAA&qs=CAEyFENnc0lqNUxTb1B2MDBxcWxBUkFCOAJCCQkPiRS0p0tVpUIJCQ-JFLSnS1Wl&ap=ugEHcmV2aWV3cw&ictx=111&ved=0CAAQ5JsGahcKEwio_cnhqtSVAxUAAAAAHQAAAAAQAw";
  const submitReview = async () => {
    if (!rating) {
      setReviewStatus("Please choose a star rating first.");
      return;
    }
    if (!reviewText.trim()) {
      setReviewStatus("Please share a few words about your stay first.");
      return;
    }
    const reviewWindow = window.open(googleReviewsUrl, "_blank", "noopener,noreferrer");
    const preparedReview = `${"★".repeat(rating)}${"☆".repeat(5 - rating)} (${rating}/5)\n\n${reviewText.trim()}`;
    try {
      await navigator.clipboard.writeText(preparedReview);
      setReviewStatus(`Your ${rating}-star rating and review were copied. Choose ${rating} stars in Google, paste the review, and submit it.`);
    } catch {
      setReviewStatus(`Google Reviews opened. Choose ${rating} stars, then copy and paste your review there.`);
    }
    if (!reviewWindow) setReviewStatus("Please allow pop-ups, then open Google Reviews again.");
  };
  return (
    <section className="section trust">
      <Reveal>
        <SectionTitle title={sectionText("guest-experiences", "title", "Guest Experiences")}>
          {sectionText("guest-experiences", "short_description", "Selected guest experiences are presented without unverified star ratings.")}
        </SectionTitle>
      </Reveal>
      <div className="review-grid">
        {reviews.map(([title, text, name]) => (
          <Reveal className="review-card" key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
            {name && <em>{name}</em>}
          </Reveal>
        ))}
        <Reveal className="review-google-card">
          <span className="review-google-stars" aria-hidden="true">★★★★★</span>
          <strong>Share your Jaisalmer experience</strong>
          <p>Your honest review helps future guests discover a trusted stay inside the Golden Fort.</p>
          <a className="review-google-button" href={googleReviewsUrl} target="_blank" rel="noreferrer">
            Write a Google Review <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
      </div>
      <div className="trust-points">
        {["Direct hotel contact", "Clear check-in process", "ID proof required at check-in", "Secure guest enquiry", "No unnecessary third-party redirection", "WhatsApp/email confirmation"].map((point) => <span key={point}>{point}</span>)}
      </div>
      <Reveal className="review-cta">
        <div>
          <span className="review-eyebrow">Your experience matters</span>
          <h3>Enjoyed your stay?</h3>
          <p>Tell us what you enjoyed—from the heritage rooms and rooftop food to the hospitality and Jaisalmer experience.</p>
        </div>
        <div className="review-actions">
          <div className="rating-picker" role="group" aria-label="Choose your rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" className={value <= (hoverRating || rating) ? "selected" : ""} onMouseEnter={() => setHoverRating(value)} onMouseLeave={() => setHoverRating(0)} onFocus={() => setHoverRating(value)} onBlur={() => setHoverRating(0)} onClick={() => setRating(value)} aria-label={`${value} star${value === 1 ? "" : "s"}`} aria-pressed={value <= rating}>★</button>
            ))}
          </div>
          <label className="review-input-label" htmlFor="guest-review">Your review</label>
          <textarea id="guest-review" value={reviewText} onChange={(event) => { setReviewText(event.target.value); setReviewStatus(""); }} rows="4" maxLength="1000" placeholder="Share your favourite part of the stay…" />
          <button className="btn primary" type="button" onClick={submitReview}>{rating === 5 ? "Continue to Google Reviews" : "Share on Google Reviews"}</button>
          {reviewStatus && <small className="review-status" role="status">{reviewStatus}</small>}
        </div>
      </Reveal>
    </section>
  );
}

function Contact() {
  return (
    <section className="section contact" id="contact">
      <Reveal>
        <SectionTitle title={sectionText("contact", "title", "Contact The Desert Haveli Guest House Jaisalmer")}>
          {sectionText("contact", "short_description", "The guesthouse is located inside Jaisalmer Fort near the Jain Temple area. Guests can contact the hotel on arrival for final walking guidance inside the fort.")}
        </SectionTitle>
      </Reveal>
      <div className="contact-grid">
        <Reveal className="contact-card">
          <h3>{hotel.name}</h3>
          <p>{hotel.address}</p>
          <p><strong>Phone / WhatsApp:</strong> <a href={`tel:${hotel.phone}`}>{hotel.phone}</a></p>
          <p><strong>Alternate Phone:</strong> <a href={`tel:${hotel.alternatePhone}`}>{hotel.alternatePhone}</a></p>
          <p><strong>Email:</strong> <a href={`mailto:${hotel.email}`}>{hotel.email}</a></p>
          <div className="card-actions">
            <a className="btn primary" data-cta="contact-whatsapp" href={whatsappUrl()} target="_blank" rel="noreferrer">Direct WhatsApp</a>
            <a className="btn secondary" data-cta="email-enquiry" href={emailUrl()}>Direct Email</a>
          </div>
        </Reveal>
        <Reveal className="map-card">
          <iframe
            title={`Map showing ${hotel.name}`}
            src={hotel.mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <div className="map-card-footer">
            <span>Find the guesthouse inside Jaisalmer Fort near the Jain Temple.</span>
            <a className="btn primary" href={hotel.mapsUrl} target="_blank" rel="noreferrer">Open Location in Google Maps</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FAQ() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
  };
  return (
    <section className="section faq" id="faq">
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <Reveal><SectionTitle title="FAQ" /></Reveal>
      <div className="faq-list">
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const tripadvisorUrl = "https://www.tripadvisor.in/Hotel_Review-g297667-d1173534-Reviews-Desert_Haveli_Guest_House-Jaisalmer_Jaisalmer_District_Rajasthan.html";
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="footer-kicker">Inside Jaisalmer Fort</span>
        <h2>The Desert Haveli Guest House Jaisalmer</h2>
        <p>Experience heritage hospitality inside the Golden Fort of Jaisalmer.</p>
        <a className="tripadvisor-link" href={tripadvisorUrl} target="_blank" rel="noreferrer" aria-label="View Desert Haveli Guest House on Tripadvisor">
          <span className="tripadvisor-mark" aria-hidden="true">TA</span>
          <span><strong>Tripadvisor</strong><small>View our hotel page</small></span>
        </a>
      </div>
      <div className="footer-column footer-links">
        <h3>Explore</h3>
        {navItems.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </div>
      <div className="footer-column footer-contact">
        <h3>Contact the hotel</h3>
        <a data-cta="contact-whatsapp" href={whatsappUrl()} target="_blank" rel="noreferrer">{hotel.phone}</a>
        <a data-cta="email-enquiry" href={`mailto:${hotel.email}`}>{hotel.email}</a>
        <p>{hotel.address}</p>
      </div>
      <div className="footer-bottom">
        <small>Copyright {new Date().getFullYear()} The Desert Haveli Guest House Jaisalmer. All rights reserved.</small>
        <span>Direct bookings · Local hospitality · Golden Fort stay</span>
      </div>
    </footer>
  );
}

function Schemas() {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: hotel.name,
    image: images.hero,
    telephone: hotel.phone,
    email: hotel.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "National monument, the Golden Fort, near Jain Temple, Tewata Para, inside fort",
      addressLocality: "Jaisalmer",
      addressRegion: "Rajasthan",
      addressCountry: "IN"
    },
    url: "http://jaisalmerdesert.com/"
  };
  return <script type="application/ld+json">{JSON.stringify(localBusiness)}</script>;
}

function LegalPage({ type }) {
  const content = {
    privacy: {
      title: "Privacy Notice",
      intro: "This notice explains how Desert Haveli Guest House handles information shared through this website.",
      sections: [
        ["Information you share", "When you use the booking enquiry form, WhatsApp link, email link, or phone links, you may choose to share contact details, travel dates, guest count, room preference, and your message."],
        ["How enquiries are handled", "Enquiries are sent to the hotel through WhatsApp or your email application for availability and booking communication. This website does not provide an online payment or reservation-completion service."],
        ["Third-party services", "The website links to third-party services including WhatsApp, Google Maps, Google Reviews, and Tripadvisor. Their handling of your information is governed by their own policies."],
        ["Contact", "For questions about an enquiry or the information you have shared, contact the hotel using the phone number, WhatsApp link, or email address shown on this website."]
      ]
    },
    terms: {
      title: "Terms and Conditions",
      intro: "These website terms describe the enquiry process for Desert Haveli Guest House.",
      sections: [
        ["Enquiries are not confirmed bookings", "Submitting a website enquiry, WhatsApp message, or email does not reserve a room. Availability, final pricing, booking confirmation, and applicable stay conditions are confirmed directly by the hotel."],
        ["Information on this website", "Room, facility, restaurant, travel-assistance, and experience information is provided for general guest planning. Guests should confirm current availability and final details with the hotel before making travel arrangements."],
        ["Guest check-in", "Guests are asked to carry valid identification and complete the hotel's check-in formalities on arrival."],
        ["Contact", "For booking questions or clarification of stay conditions, contact the hotel directly using the contact details shown on this website."]
      ]
    },
    cancellation: {
      title: "Cancellation Policy",
      intro: "This website accepts booking enquiries rather than online reservations or payments.",
      sections: [
        ["Before confirmation", "An enquiry sent through this website, WhatsApp, or email is not a confirmed booking. Guests should contact the hotel directly if their travel dates change."],
        ["Confirmed bookings", "Cancellation terms, any applicable deadlines, and any payment-related conditions are confirmed directly by the hotel when a booking is confirmed."],
        ["Changes to travel plans", "For amendments or cancellations, contact the hotel as soon as possible using the WhatsApp, phone, or email details on this website and provide the booking details supplied at confirmation."],
        ["Contact", "The hotel can confirm the cancellation status of a direct booking and any terms that apply to that booking."]
      ]
    }
  }[type];

  return (
    <section className="section legal-page">
      <SectionTitle title={content.title}>{content.intro}</SectionTitle>
      <div className="faq-list">
        {content.sections.map(([heading, text]) => <article key={heading}><h2>{heading}</h2><p>{text}</p></article>)}
      </div>
    </section>
  );
}

function App({ initialSection, legalPage, pageMetadata }) {
  const [rooms, setRooms] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchPublicSiteImages()
      .then((items) => {
        if (cancelled) return;
        items.forEach((item) => {
          const url = siteImageUrl(item.storage_path);
          if (url && item.slot_key) images[item.slot_key] = url;
        });
        const ogImage = images.hero;
        const ogTag = document.querySelector('meta[property="og:image"]');
        if (ogTag && ogImage) ogTag.setAttribute("content", ogImage);
        setRooms((current) => [...current]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!initialSection || legalPage) return undefined;
    let stoppedByVisitor = false;
    const scrollToInitialSection = () => document.getElementById(initialSection)?.scrollIntoView({ block: "start" });
    const stopForVisitorInput = () => { stoppedByVisitor = true; };
    const frame = requestAnimationFrame(scrollToInitialSection);
    const settleTimer = window.setInterval(() => { if (stoppedByVisitor) return; scrollToInitialSection(); }, 400);
    const stopTimer = window.setTimeout(() => window.clearInterval(settleTimer), 10_000);
    window.addEventListener("pointerdown", stopForVisitorInput, { once: true });
    window.addEventListener("wheel", stopForVisitorInput, { once: true, passive: true });
    window.addEventListener("touchstart", stopForVisitorInput, { once: true, passive: true });
    window.addEventListener("keydown", stopForVisitorInput, { once: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(settleTimer);
      window.clearTimeout(stopTimer);
      window.removeEventListener("pointerdown", stopForVisitorInput);
      window.removeEventListener("wheel", stopForVisitorInput);
      window.removeEventListener("touchstart", stopForVisitorInput);
      window.removeEventListener("keydown", stopForVisitorInput);
    };
  }, [initialSection, legalPage]);

  useEffect(() => {
    if (!initialSection || legalPage || roomsLoading || galleryLoading || sectionsLoading) return undefined;
    const frame = requestAnimationFrame(() => document.getElementById(initialSection)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [initialSection, legalPage, roomsLoading, galleryLoading, sectionsLoading]);

  useEffect(() => {
    if (!pageMetadata) return;
    const setMeta = (selector, attributes) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        document.head.appendChild(element);
      }
      element.setAttribute("content", attributes.content);
    };
    document.title = pageMetadata.title;
    setMeta('meta[name="description"]', { name: "description", content: pageMetadata.description });
    setMeta('meta[property="og:title"]', { property: "og:title", content: pageMetadata.title });
    setMeta('meta[property="og:description"]', { property: "og:description", content: pageMetadata.description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: window.location.href });
    setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: pageMetadata.title });
    setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: pageMetadata.description });
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, [pageMetadata]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicGalleryImages()
      .then((items) => { if (!cancelled) setGalleryImages(items); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setGalleryLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPublicSections().then((items) => {
      if (cancelled) return;
      items.forEach((item) => { sectionContent[item.section_key] = { ...sectionContent[item.section_key], ...item }; });
      setRooms((current) => [...current]);
    }).catch(() => {}).finally(() => { if (!cancelled) setSectionsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPublicRooms()
      .then((data) => {
        if (!cancelled) setRooms(data);
      })
      .catch((err) => {
        if (!cancelled) setRoomsError(err.message);
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Schemas />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Navbar />
      <main id="main-content" tabIndex="-1">
        {legalPage ? <LegalPage type={legalPage} /> : <>
          <Hero />
          <BookingBar rooms={rooms} />
          <Showcase />
          <About />
          <Rooms rooms={rooms} loading={roomsLoading} error={roomsError} />
          <Restaurant />
          <Facilities />
          <Experiences />
          <Safari />
          <Gallery uploadedImages={galleryImages} />
          <Nearby />
          <BookingForm rooms={rooms} />
          <ReviewsTrust />
          <Contact />
          <FAQ />
        </>}
      </main>
      <Footer />
    </>
  );
}

export default App;
