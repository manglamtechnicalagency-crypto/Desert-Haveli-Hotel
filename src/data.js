export const hotel = {
  name: "The Desert Haveli Guest House Jaisalmer",
  shortName: "Desert Haveli",
  phone: "+91-7568455656",
  phonePlain: "917568455656",
  alternatePhone: "+91-2992251555",
  email: "deserthaveliguesthouse@gmail.com",
  address:
    "National monument, the Golden Fort, near Jain Temple, Tewata Para, inside fort, Jaisalmer, Rajasthan, India",
  whatsappBase: "https://wa.me/917568455656",
  emailSubject: "Room Booking Enquiry - Desert Haveli Guest House"
};

// Replace these project assets with real hotel images/videos using the same filenames.
// Requested slots: hero-fort-haveli.jpg, heritage-room-1.jpg, modern-room.jpg,
// princess-room.jpg, hakam-queen-room.jpg, haveli-interior.jpg,
// jaisalmer-fort-view.jpg, sunset-terrace.jpg, desert-experience.mp4,
// jaisalmer-street-life.jpg, golden-fort-exterior.jpg.
export const images = {
  hero: "/assets/hero-fort-haveli.jpg",
  heritage: "/assets/heritage-room-1.jpg",
  modern: "/assets/modern-room.jpg",
  princess: "/assets/princess-room.jpg",
  hakam: "/assets/hakam-queen-room.jpg",
  interior: "/assets/haveli-interior.jpg",
  fortView: "/assets/jaisalmer-fort-view.jpg",
  sunset: "/assets/sunset-terrace.jpg",
  street: "/assets/jaisalmer-street-life.jpg",
  exterior: "/assets/golden-fort-exterior.jpg"
  ,
  hotelExteriorReal: "/assets/hotel-exterior-real.jpg",
  heritageRoomReal: "/assets/heritage-room-real.jpg",
  roomDetailReal: "/assets/room-detail-real.jpg",
  haveliSittingReal: "/assets/haveli-sitting-real.jpg",
  haveliInteriorReal: "/assets/haveli-interior-real.jpg",
  demoModern: "/assets/demo-modern-room.jpg",
  demoPrincess: "/assets/demo-princess-room.jpg",
  demoHakam: "/assets/demo-hakam-queen-room.jpg",
  rooftopRestaurant: "/assets/rooftop-restaurant.jpg",
  rajasthaniThali: "/assets/rajasthani-thali.jpg",
  kerSangri: "/assets/ker-sangri.jpg"
};

export const rooms = [
  {
    name: "Heritage Prince Room",
    price: "INR 2499 / night",
    style: "Traditional heritage",
    bestFor: "Authentic fort stay",
    highlight: "Fort ambience",
    image: images.heritageRoomReal,
    description:
      "A traditional heritage-style room designed for guests who want an authentic fort stay with comfort and character.",
    features: ["Heritage interiors", "En-suite bathroom", "Hot & cold water", "Fort ambience", "Direct booking enquiry"]
  },
  {
    name: "Modern Prince Room",
    price: "INR 3300 / night",
    style: "Modern heritage",
    bestFor: "Comfort-focused travellers",
    highlight: "Elegant interiors",
    image: images.demoModern,
    description:
      "A refined room blending modern comfort with the warm character of Jaisalmer's heritage setting.",
    features: ["Modern comfort", "En-suite bathroom", "Hot & cold water", "Elegant interiors", "Direct booking enquiry"]
  },
  {
    name: "Heritage Princess Room",
    price: "INR 3500 / night",
    style: "Premium heritage",
    bestFor: "Couples and families",
    highlight: "Refined haveli experience",
    image: images.demoPrincess,
    description:
      "A premium heritage room with traditional charm, suitable for guests looking for a more refined haveli experience.",
    features: ["Heritage styling", "Comfortable bedding", "En-suite bathroom", "Hot & cold water", "Fort experience"]
  },
  {
    name: "Heritage Hakam Queen Room",
    price: "Enquire for price",
    style: "Character heritage",
    bestFor: "Enquiry-based stays",
    highlight: "Traditional room design",
    image: images.haveliSittingReal,
    description: "A character-rich heritage room inspired by traditional Jaisalmer hospitality.",
    features: ["Traditional room design", "En-suite bathroom", "Hot & cold water", "Heritage ambience", "Enquiry-based availability"]
  }
];

export const services = [
  ["Heritage Fort Stay", "Live within the walls of Jaisalmer's Golden Fort in a character-rich haveli setting."],
  ["Desert & City View Rooms", "Enjoy atmospheric views across the fort, desert city, and sandstone skyline where available."],
  ["Hot & Cold Water", "Essential comfort for a practical heritage stay."],
  ["En-suite Bathrooms", "Attached bathrooms for convenience and privacy."],
  ["Sunrise / Sunset Views", "Ask the hotel team about the best times and viewpoints during your stay."],
  ["Walking Access to Jain Temples", "Stay near the Jain Temple area and explore the living fort on foot."],
  ["Local Jaisalmer Guidance", "Receive direct guidance for arrival, local streets, markets, and sightseeing plans."],
  ["Desert Safari Enquiry Assistance", "Available on request for guests who want help planning desert experiences."],
  ["Camel Safari Enquiry", "Available on request through local guidance."],
  ["Jeep Safari Enquiry", "Available on request for desert travel planning."],
  ["Pickup Guidance", "Available on request for arrival support and final walking guidance inside the fort."],
  ["Fort Walk Guidance", "Available on request for guests who want to understand the old city better."],
  ["Local Market Walk", "Available on request for nearby fort market exploration."]
];

export const restaurantHighlights = [
  ["Rajasthani Thali", "Fresh, hygienic thali-style meals served in a warm heritage setting."],
  ["Ker Sangri", "A classic desert vegetable preparation available on request."],
  ["Desert Curry", "Comforting Indian flavours suited to the Jaisalmer rooftop atmosphere."],
  ["Indian Masala Tea", "A simple, warming rooftop favourite."],
  ["Rooftop Views", "Enjoy changing views of the fort, old city streets, and desert skyline by changing your seat."],
  ["Homemade-Style Food", "Comforting meals with a guesthouse-style sense of care."]
];

export const basicFacilities = [
  "Free Parking",
  "Room Service",
  "Safe Deposit Box",
  "Currency Exchange",
  "Internet",
  "Medical Assistance",
  "Restaurant",
  "Front Desk - 24 Hours",
  "Meeting Facilities",
  "Children Permitted",
  "Historic Site Stay"
];

export const requestFacilities = [
  "Laundry",
  "Drop Service",
  "Beauty Salon",
  "Gift Shop",
  "Airport Pickup",
  "Breakfast",
  "Bicycle Rental",
  "Desert Safari",
  "Jeep / Car Trip",
  "Taxi Services",
  "Railway Booking Assistance",
  "Bus Booking Assistance",
  "Air Booking Assistance",
  "Money Exchange Assistance",
  "Local Sightseeing Assistance"
];

export const safariServices = [
  "Camel safari enquiry",
  "Jeep safari enquiry",
  "Car/taxi trip around Jaisalmer",
  "Kuldhara village visit",
  "Khaba village visit",
  "Sam Sand Dunes visit",
  "Royal gardens and cenotaphs",
  "Jain temples visit",
  "Railway booking assistance",
  "Bus booking assistance",
  "Air booking assistance",
  "Car/taxi services across India",
  "Money exchange assistance"
];

export const attractions = [
  ["Jaisalmer Fort / Sonar Quila", "Popularly known as Sonar Quila, Jaisalmer Fort dominates the skyline of the golden city. Built in 1156 AD by Rawal Jaisal, the fort is one of Rajasthan's oldest living forts.", images.exterior],
  ["Jain Temples", "Historic temple architecture within walking proximity of the guesthouse near the Jain Temple area.", images.interior],
  ["Patwon Ki Haveli", "One of Jaisalmer's grandest mansions and an open-air masterpiece of stone carving, known for carved balconies and sandstone shadows.", images.fortView],
  ["Gadisar Lake", "Built in 1156 AD and later rebuilt in 1367 AD, Gadisar Lake is a peaceful picnic spot known for calm water and winter migratory birds.", images.sunset],
  ["Sam Sand Dunes", "A classic desert excursion area for dune sunsets and safari enquiries available on request.", images.street],
  ["Local Fort Market", "Traditional lanes, textiles, handicrafts, cafes, and everyday life inside the fort.", images.hero],
  ["Bada Bagh / Bara Bagh", "Known for cenotaphs built in memory of Jaisalmer's rulers, surrounded by trees and desert landscapes.", images.rooftopRestaurant],
  ["Kuldhara and Khaba", "Deserted village routes can be explored with local travel guidance. Charges may apply.", images.rajasthaniThali],
  ["Wood Fossil Park", "Near Akal on the Barmer Road, the park offers a glimpse into the Jurassic period with fossilised trees.", images.fortView]
];

export const faqs = [
  ["Is the guesthouse inside Jaisalmer Fort?", "Yes. The guesthouse is located inside the Golden Fort of Jaisalmer near the Jain Temple area."],
  ["Can I book directly through WhatsApp?", "Yes. You can send your dates, guest count, and preferred room directly on WhatsApp for availability confirmation."],
  ["Does the hotel have a rooftop restaurant?", "Yes. The website presents a rooftop restaurant experience; confirm timing and availability directly with the hotel."],
  ["What food is available at the rooftop restaurant?", "Guests can enquire about Rajasthani Thali, Ker Sangri, Indian food, masala tea, and homemade-style meals."],
  ["What are the check-in and check-out steps?", "Send an enquiry, receive availability confirmation, confirm as per hotel policy, arrive near the Golden Fort/Jain Temple area, contact the hotel for final guidance, and complete ID check-in formalities."],
  ["Are hot and cold water available?", "Yes, hot and cold water are listed among the guest comfort features."],
  ["Do rooms have attached bathrooms?", "Yes, the room information includes en-suite bathrooms."],
  ["Is the Jain Temple nearby?", "Yes. The address places the guesthouse near the Jain Temple area inside the fort."],
  ["Are desert or city views available?", "The hotel positioning mentions desert and city views. Ask during booking so the team can confirm the best available option."],
  ["Is ID proof required for check-in?", "Yes. Guests should carry valid ID proof for check-in formalities."],
  ["Can the hotel help with desert safari enquiry?", "Safari and travel assistance may be available on request. Charges may apply."],
  ["Are airport pickup and travel services chargeable?", "Selected travel, pickup, booking, and personal services may be chargeable or available on request. Please confirm directly with the hotel."],
  ["How do I confirm availability?", "Use the WhatsApp or email enquiry button with your dates, guests, and preferred room."]
];

export const reviews = [
  ["You Just Have to Stay Here", "This was heaven. We had the honeymoon room and stayed for three nights. The team took great care of us and nothing felt impossible. Even if you are not staying here, the rooftop food is worth experiencing.", ""],
  ["The Desert Haveli Is the Best", "We planned to stay only a couple of nights but liked it so much that we stayed longer. The haveli has a friendly atmosphere, rooms with character, a lovely rooftop terrace, and some of the best food we had in India. The Rajasthani Thali and Ker Sangri were wonderful.", "ChocolateCharlie"],
  ["The Great Experience of Thar", "It was a great experience to stay at Jaisalmer Desert Haveli. It is calm and peaceful, the service is great, and the staff is very supportive. The location is close to the city and famous sights.", "Raj Bothra, Mumbai"],
  ["Nice People, Romantic Place", "We enjoyed our stay at Desert Haveli very much. The people were like family and helped us wherever they could. The room and rooftop restaurant were very romantic, and the location inside the fort was great.", "Jan, Berlin"],
  ["Great Place, Great Staff", "The highlight of our trip to Jaisalmer was the wonderful staff at Desert Haveli. The rooms were nice, the location was great, and the staff made the stay memorable.", ""]
];
