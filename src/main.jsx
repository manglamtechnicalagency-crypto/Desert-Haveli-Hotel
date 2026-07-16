import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";

const AdminApp = lazy(() => import("./admin/AdminApp"));

const pageMetadata = {
  "/": ["Desert Haveli Guest House Jaisalmer | Heritage Stay Inside Golden Fort", "Book a heritage stay at Desert Haveli Guest House Jaisalmer, a 450-year-old haveli inside the Golden Fort with traditional rooms, desert views, and direct WhatsApp booking."],
  "/about": ["Heritage Stay in Jaisalmer Fort | Desert Haveli", "Discover Desert Haveli Guest House, a heritage stay inside Jaisalmer Fort near the Jain Temple."],
  "/rooms": ["Heritage Rooms in Jaisalmer Fort | Desert Haveli", "Explore heritage rooms at Desert Haveli Guest House inside Jaisalmer Fort and enquire directly for availability."],
  "/rooftop-restaurant": ["Rooftop Restaurant in Jaisalmer Fort | Desert Haveli", "Ask about rooftop dining with Jaisalmer views at Desert Haveli Guest House inside the Golden Fort."],
  "/experiences": ["Jaisalmer Desert Safari & Travel Assistance | Desert Haveli", "Enquire about desert safari and travel assistance from Desert Haveli Guest House in Jaisalmer."],
  "/gallery": ["Desert Haveli Jaisalmer Gallery | Heritage Stay Photos", "Browse room, rooftop, fort-view and heritage-haveli photos from Desert Haveli Guest House Jaisalmer."],
  "/explore-jaisalmer": ["Explore Jaisalmer from Desert Haveli Guest House", "Plan visits to Jaisalmer Fort, Jain Temples, havelis, markets and desert landscapes with local guidance."],
  "/contact": ["Contact Desert Haveli Guest House Jaisalmer", "Contact Desert Haveli inside Jaisalmer Fort for room availability, direct WhatsApp booking and location guidance."],
  "/faq": ["Desert Haveli Jaisalmer FAQs | Booking & Stay Information", "Find answers about booking, rooms, location, check-in and guest facilities at Desert Haveli Guest House."],
  "/privacy-policy": ["Privacy Notice | Desert Haveli Guest House Jaisalmer", "Read how Desert Haveli Guest House handles information shared through website enquiries."],
  "/terms-and-conditions": ["Terms and Conditions | Desert Haveli Guest House Jaisalmer", "Read the website enquiry terms for Desert Haveli Guest House Jaisalmer."],
  "/cancellation-policy": ["Cancellation Policy | Desert Haveli Guest House Jaisalmer", "Read cancellation information for direct booking enquiries at Desert Haveli Guest House."],
};

function metadataFor(path) {
  const [title, description] = pageMetadata[path] || pageMetadata["/"];
  return { title, description };
}

// Minimal top-level error boundary. Without this, any uncaught render-time
// exception (e.g. an unexpected null/undefined field from Supabase) blanks
// the entire page for the guest or admin instead of failing gracefully.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "3rem 1.5rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page. If this keeps happening, contact the hotel directly.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotFound() {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "5rem 1.5rem", textAlign: "center" }}>
      <div><p className="eyebrow">404</p><h1>Page not found</h1><p>The page you requested does not exist.</p><a className="btn primary" href="/">Return to the hotel website</a></div>
    </main>
  );
}

function PublicRoute() {
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const sectionByPath = {
    "/about": "about",
    "/rooms": "rooms",
    "/rooftop-restaurant": "restaurant",
    "/experiences": "safari",
    "/gallery": "gallery",
    "/explore-jaisalmer": "explore",
    "/contact": "contact",
    "/faq": "faq"
  };
  const legalByPath = {
    "/privacy-policy": "privacy",
    "/terms-and-conditions": "terms",
    "/cancellation-policy": "cancellation"
  };
  if (legalByPath[path]) return <App legalPage={legalByPath[path]} pageMetadata={metadataFor(path)} />;
  if (sectionByPath[path]) return <App initialSection={sectionByPath[path]} pageMetadata={metadataFor(path)} />;
  if (path === "/" || path.startsWith("/rooms/")) return <App pageMetadata={metadataFor(path === "/" ? path : "/rooms")} />;
  return <NotFound />;
}

function Root() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
          <Route path="/*" element={<PublicRoute />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </ErrorBoundary>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
