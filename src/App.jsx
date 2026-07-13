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

  React.useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar ${solid || open ? "solid" : ""}`}>
      <a className="brand" href="#home" aria-label="Desert Haveli home">
        <span className="brand-mark">DH</span>
        <span><strong>The Desert Haveli</strong><small>Guest House Jaisalmer</small></span>
      </a>
      <button className="menu-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="main-menu">
        <span></span><span></span><span></span>
      </button>
      <nav id="main-menu" className={open ? "open" : ""}>
        {navItems.map(([label, id]) => (
          <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>
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
        <div className="hero-actions">
          <a className="btn primary" data-cta="whatsapp-booking" href={whatsappUrl()} target="_blank" rel="noreferrer">Book on WhatsApp</a>
          <a className="btn ghost" data-cta="email-enquiry" href={emailUrl()}>Send Email Enquiry</a>
          <a className="btn text" data-cta="room-booking" href="#rooms">View Rooms</a>
        </div>
        <div className="trust-row">
          {["450-Year Heritage Stay", "Inside Golden Fort", "Rooftop Restaurant", "Desert & City Views", "Direct WhatsApp Booking"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BookingBar({ rooms }) {
  const [form, setForm] = useState({ checkin: "", checkout: "", guests: "", room: rooms[0]?.name || "" });
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const message = `Hello Desert Haveli Guest House,\nI want to enquire about room booking.\n\nCheck-in: ${form.checkin}\nCheck-out: ${form.checkout}\nGuests: ${form.guests}\nPreferred Room: ${form.room}\n\nPlease confirm availability and price.`;

  React.useEffect(() => {
    const onScroll = () => {
      const shouldCompact = window.innerWidth <= 760 && window.scrollY > window.innerHeight * 0.45;
      setCompact(shouldCompact);
      if (!shouldCompact) setExpanded(false);
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
    document.body.classList.toggle("booking-expanded", compact && expanded);
    return () => document.body.classList.remove("booking-expanded");
  }, [compact, expanded]);

  return (
    <section className={`booking-bar ${compact && !expanded ? "capsule" : ""}`} aria-label="Quick booking enquiry">
      {compact && !expanded ? (
        <button className="booking-capsule" type="button" aria-expanded={expanded} onClick={() => setExpanded(true)}>
          <span>Check dates</span>
          <strong>Book Direct</strong>
        </button>
      ) : null}
      <label>Check-in<input name="checkin" type="date" value={form.checkin} onChange={update} /></label>
      <label>Check-out<input name="checkout" type="date" value={form.checkout} onChange={update} /></label>
      <label>Guests<input name="guests" min="1" type="number" placeholder="2" value={form.guests} onChange={update} /></label>
      <label>Preferred room<select name="room" value={form.room} onChange={update}>{rooms.map((room) => <option key={room.name}>{room.name}</option>)}</select></label>
      <a className="btn primary" data-cta="whatsapp-booking" href={whatsappUrl(message)} target="_blank" rel="noreferrer">Book on WhatsApp</a>
      {compact && expanded ? (
        <button className="booking-minimize" type="button" onClick={() => setExpanded(false)} aria-label="Minimize booking form">Minimize</button>
      ) : null}
    </section>
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
        <a className="btn secondary" href="#booking" data-cta="room-booking">Discover Our Story</a>
      </Reveal>
      <Reveal className="usp-panel">
        {usps.map((item, index) => (
          <div className="usp" key={item}>
            <Icon>{String(index + 1).padStart(2, "0")}</Icon>
            <span>{item}</span>
          </div>
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
          <Reveal className="service-card" key={title}><h3>{title}</h3><p>{text}</p></Reveal>
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
          {basicFacilities.map((item) => <span key={item}>{item}<small>Available</small></span>)}
        </Reveal>
        <Reveal className="facility-panel request">
          <h3>On-Request / Chargeable Facilities</h3>
          {requestFacilities.map((item, index) => <span key={item}>{item}<small>{index % 3 === 0 ? "Chargeable" : index % 3 === 1 ? "On Request" : "Ask Hotel"}</small></span>)}
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
        <ul>
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
    ["Rooms", images.demoModern, "Jaisalmer-themed demo modern heritage room"],
    ["Interior", images.roomDetailReal, "Real room mirror and heritage arch detail"],
    ["Interior", images.haveliSittingReal, "Real haveli sitting area inside Desert Haveli Guest House"],
    ["Interior", images.haveliInteriorReal, "Real haveli interior and window seating"],
    ["Restaurant", images.rooftopRestaurant, "Demo rooftop restaurant with Jaisalmer views"],
    ["Restaurant", images.rajasthaniThali, "Demo Rajasthani thali and Ker Sangri"],
    ["Fort View", images.fortView, "Golden fort and city view"],
    ["Exterior", images.exterior, "Golden Fort exterior"],
    ["Exterior", images.hotelExteriorReal, "Real Desert Haveli Guest House exterior"],
    ["Jaisalmer", images.sunset, "Sunset near Jaisalmer heritage architecture"],
    ["Interior", images.street, "Jaisalmer fort street life"],
    ["Rooms", images.demoPrincess, "Jaisalmer-themed demo premium heritage room"]
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
      <p className="asset-note">Real hotel images/videos can be replaced in the assets folder.</p>
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
  return (
    <section className="section nearby" id="explore">
      <Reveal>
        <SectionTitle title={sectionText("explore-jaisalmer", "title", "Explore Jaisalmer")}>
          {sectionText("explore-jaisalmer", "short_description", "The hotel is a heritage base for Jaisalmer Fort, havelis, Jain temples, desert villages, dunes, local markets, and city walks.")}
        </SectionTitle>
      </Reveal>
      <div className="nearby-grid">
        {attractions.map(([name, text, src]) => (
          <Reveal className="attraction" key={name}>
            <img loading="lazy" src={images[attractionImageKeys[name]] || src} alt={`${name} near Desert Haveli Guest House Jaisalmer`} />
            <h3>{name}</h3>
            <p>{text}</p>
            <small>Distance/time: please confirm locally</small>
            <a data-cta="contact-whatsapp" href={whatsappUrl(`Hello Desert Haveli Guest House,\nPlease guide me for visiting ${name}.`)} target="_blank" rel="noreferrer">Ask for Local Guidance</a>
          </Reveal>
        ))}
      </div>
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
            {label}{isRequired && <span aria-hidden="true"> *</span>}
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
        <label>Preferred Room{form.service === "Room Booking" && <span aria-hidden="true"> *</span>}
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
          <button className="btn primary" data-cta="whatsapp-booking" type="button" disabled={submitting} onClick={() => open("whatsapp")}>Send Enquiry on WhatsApp</button>
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
      </div>
      <div className="trust-points">
        {["Direct hotel contact", "Clear check-in process", "ID proof required at check-in", "Secure guest enquiry", "No unnecessary third-party redirection", "WhatsApp/email confirmation"].map((point) => <span key={point}>{point}</span>)}
      </div>
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
    <section className="section faq">
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
  return (
    <footer>
      <div>
        <h2>The Desert Haveli Guest House Jaisalmer</h2>
        <p>Experience heritage hospitality inside the Golden Fort of Jaisalmer.</p>
      </div>
      <div className="footer-links">
        {navItems.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </div>
      <div>
        <a data-cta="contact-whatsapp" href={whatsappUrl()} target="_blank" rel="noreferrer">{hotel.phone}</a>
        <a data-cta="email-enquiry" href={`mailto:${hotel.email}`}>{hotel.email}</a>
        <p>{hotel.address}</p>
      </div>
      <small>Copyright {new Date().getFullYear()} The Desert Haveli Guest House Jaisalmer. All rights reserved.</small>
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

function App() {
  const [rooms, setRooms] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
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
    let cancelled = false;
    fetchPublicGalleryImages().then((items) => { if (!cancelled) setGalleryImages(items); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPublicSections().then((items) => {
      if (cancelled) return;
      items.forEach((item) => { sectionContent[item.section_key] = { ...sectionContent[item.section_key], ...item }; });
      setRooms((current) => [...current]);
    }).catch(() => {});
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
      <Navbar />
      <main>
        <Hero />
        <BookingBar rooms={rooms} />
        <Showcase />
        <About />
        <Rooms rooms={rooms} loading={roomsLoading} error={roomsError} />
        <Restaurant />
        <Facilities />
        <Experiences />
        <Safari />
        <Story />
        <Gallery uploadedImages={galleryImages} />
        <Nearby />
        <BookingForm rooms={rooms} />
        <ReviewsTrust />
        <Contact />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}

export default App;
