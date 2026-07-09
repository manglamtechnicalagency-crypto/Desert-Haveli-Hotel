import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  attractions,
  basicFacilities,
  faqs,
  hotel,
  images,
  requestFacilities,
  restaurantHighlights,
  reviews,
  rooms,
  safariServices,
  services
} from "./data";
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
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);
  return (
    <section className="hero" id="home">
      <motion.video
        style={{ y }}
        className="hero-bg"
        poster={images.hero}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Desert Haveli Guest House Jaisalmer heritage video"
      >
        <source src="/assets/hero-desert-haveli-video.mp4" type="video/mp4" />
      </motion.video>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          Stay Inside the Living Golden Fort of Jaisalmer
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.8 }}>
          Experience 450 years of heritage, royal haveli rooms, rooftop dining, desert views, and authentic Jaisalmer hospitality.
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

function BookingBar() {
  const [form, setForm] = useState({ checkin: "", checkout: "", guests: "", room: "Heritage Prince Room" });
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
    document.body.classList.toggle("booking-expanded", compact && expanded);
    return () => document.body.classList.remove("booking-expanded");
  }, [compact, expanded]);

  return (
    <section className={`booking-bar ${compact && !expanded ? "capsule" : ""}`} aria-label="Quick booking enquiry">
      {compact && !expanded ? (
        <button className="booking-capsule" type="button" onClick={() => setExpanded(true)}>
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
        <SectionTitle title="A Haveli Stay Framed by Golden Stone">
          Real hotel photos, heritage details, and warm direct hospitality create the atmosphere of a boutique stay inside the fort.
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
        <SectionTitle title="Rooftop Restaurant with Sweeping Views of Jaisalmer">
          Enjoy fresh, hygienic Rajasthani and Indian food from our rooftop restaurant while experiencing panoramic views of Jaisalmer's Golden Fort, old city streets, and desert skyline.
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
        <SectionTitle title="Hotel Facilities">
          We provide essential guest facilities for a comfortable heritage stay. Some services are included, while selected travel, food, pickup, and personal services may be chargeable or available on request.
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

function RoomCard({ room }) {
  const message = `Hello Desert Haveli Guest House,\nI want to enquire about the ${room.name}.\n\nCheck-in:\nCheck-out:\nGuests:\n\nPlease confirm availability and final price.`;
  return (
    <article className="room-card tilt">
      <img loading="lazy" src={room.image} alt={`${room.name} at Desert Haveli Guest House Jaisalmer`} />
      <div>
        <h3>{room.name}</h3>
        <strong>{room.price}</strong>
        <p>{room.description}</p>
        <ul>{room.features.slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <div className="card-actions">
          <a className="btn small ghost-light" href="#gallery">View Gallery</a>
          <a className="btn small primary" data-cta="room-booking" href={whatsappUrl(message)} target="_blank" rel="noreferrer">Book Now</a>
        </div>
      </div>
    </article>
  );
}

function Rooms() {
  return (
    <section className="section rooms" id="rooms">
      <Reveal>
        <SectionTitle title="Heritage Rooms Inside Jaisalmer Fort">
          Choose a traditional or modern heritage room and enquire directly with the hotel for availability and final confirmation.
        </SectionTitle>
      </Reveal>
      <div className="rooms-grid">{rooms.map((room) => <Reveal key={room.name}><RoomCard room={room} /></Reveal>)}</div>
      <Reveal className="table-wrap">
        <table>
          <thead>
            <tr><th>Room Name</th><th>Starting Price</th><th>Style</th><th>Best For</th><th>View / Highlight</th><th>CTA</th></tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.name}>
                <td>{room.name}</td><td>{room.price}</td><td>{room.style}</td><td>{room.bestFor}</td><td>{room.highlight}</td>
                <td><a data-cta="room-booking" href={whatsappUrl(`Hello Desert Haveli Guest House,\nI want to enquire about the ${room.name}.\n\nCheck-in:\nCheck-out:\nGuests:\n\nPlease confirm availability and final price.`)} target="_blank" rel="noreferrer">Enquire</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
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

function Gallery() {
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
  const tabs = ["All", "Rooms", "Restaurant", "Fort View", "Interior", "Exterior", "Jaisalmer"];
  const filtered = filter === "All" ? gallery : gallery.filter(([type]) => type === filter);

  return (
    <section className="section gallery" id="gallery">
      <Reveal>
        <SectionTitle title="Room Gallery">
          Browse the visual story of the fort, interiors, city views, and haveli atmosphere.
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
    ["Morning Inside the Fort", images.exterior],
    ["Heritage Room Details", images.heritage],
    ["Golden Sunset View", images.sunset],
    ["Traditional Haveli Ambience", images.interior],
    ["Jaisalmer Street Life", images.street]
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
  return (
    <section className="section nearby" id="explore">
      <Reveal>
        <SectionTitle title="Explore Jaisalmer">
          The hotel is a heritage base for Jaisalmer Fort, havelis, Jain temples, desert villages, dunes, local markets, and city walks.
        </SectionTitle>
      </Reveal>
      <div className="nearby-grid">
        {attractions.map(([name, text, src]) => (
          <Reveal className="attraction" key={name}>
            <img loading="lazy" src={src} alt={`${name} near Desert Haveli Guest House Jaisalmer`} />
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

function BookingForm() {
  const initial = { name: "", phone: "", email: "", checkin: "", checkout: "", guests: "", room: "", service: "Room Booking", message: "" };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const enquiryMessage = useMemo(() => `Hello Desert Haveli Guest House,\nI want to enquire about booking.\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\nCheck-in: ${form.checkin}\nCheck-out: ${form.checkout}\nGuests: ${form.guests}\nPreferred Room: ${form.room}\nService Interest: ${form.service}\nMessage: ${form.message}\n\nPlease confirm availability and price.`, [form]);

  const validate = () => {
    const next = {};
    ["name", "phone", "guests"].forEach((key) => {
      if (!form[key]) next[key] = "Required";
    });
    if (form.service === "Room Booking") {
      ["checkin", "checkout", "room"].forEach((key) => {
        if (!form[key]) next[key] = "Required";
      });
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const open = (type) => {
    if (!validate()) return;
    window.open(type === "whatsapp" ? whatsappUrl(enquiryMessage) : emailUrl(enquiryMessage), type === "whatsapp" ? "_blank" : "_self");
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
          ["name", "Full Name", "text"],
          ["phone", "Phone / WhatsApp Number", "tel"],
          ["email", "Email", "email"],
          ["checkin", "Check-in Date", "date"],
          ["checkout", "Check-out Date", "date"],
          ["guests", "Number of Guests", "number"]
        ].map(([name, label, type]) => (
          <label key={name}>{label}<input name={name} type={type} min={type === "number" ? "1" : undefined} value={form[name]} onChange={update} />{errors[name] && <small>{errors[name]}</small>}</label>
        ))}
        <label>Preferred Room
          <select name="room" value={form.room} onChange={update}>
            <option value="">Select room</option>
            {rooms.map((room) => <option key={room.name}>{room.name}</option>)}
            <option>Not Sure / Suggest Best Available Room</option>
          </select>
          {errors.room && <small>{errors.room}</small>}
        </label>
        <label>Service Interest
          <select name="service" value={form.service} onChange={update}>
            {["Room Booking", "Rooftop Restaurant", "Desert Safari", "Local Sightseeing", "Airport Pickup", "Taxi / Travel Assistance", "Other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="full">Message<textarea name="message" rows="5" value={form.message} onChange={update} placeholder="Share arrival time, room preference, or any special request." /></label>
        <div className="form-actions full">
          <button className="btn primary" data-cta="whatsapp-booking" type="button" onClick={() => open("whatsapp")}>Send Enquiry on WhatsApp</button>
          <button className="btn secondary" data-cta="email-enquiry" type="button" onClick={() => open("email")}>Send Email Enquiry</button>
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
        <SectionTitle title="Guest Experiences">
          Selected guest experiences are presented without unverified star ratings.
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
        <SectionTitle title="Contact The Desert Haveli Guest House Jaisalmer">
          The guesthouse is located inside Jaisalmer Fort near the Jain Temple area. Guests can contact the hotel on arrival for final walking guidance inside the fort.
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
        <Reveal className="map-card" aria-label="Google map placeholder">
          <div>
            <strong>Google Map Embed</strong>
            <span>Open the hotel location in Google Maps.</span>
            <a className="btn primary" href="https://www.google.com/maps/search/?api=1&query=Desert%20Haveli%20Guest%20House%20Jaisalmer" target="_blank" rel="noreferrer">Open Location in Google Maps</a>
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
  return (
    <>
      <Schemas />
      <Navbar />
      <main>
        <Hero />
        <BookingBar />
        <Showcase />
        <About />
        <Rooms />
        <Restaurant />
        <Facilities />
        <Experiences />
        <Safari />
        <Story />
        <Gallery />
        <Nearby />
        <BookingForm />
        <ReviewsTrust />
        <Contact />
        <FAQ />
      </main>
      <a className="floating-whatsapp" data-cta="whatsapp-booking" href={whatsappUrl()} target="_blank" rel="noreferrer" aria-label="Book on WhatsApp">WhatsApp</a>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
