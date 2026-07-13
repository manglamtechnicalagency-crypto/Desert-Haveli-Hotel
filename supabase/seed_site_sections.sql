insert into public.site_sections (section_key, internal_name, title, short_description, display_order, status, is_visible)
values
('hero', 'Hero Section', 'Stay Inside the Living Golden Fort of Jaisalmer', 'Experience 450 years of heritage, royal haveli rooms, rooftop dining, desert views, and authentic Jaisalmer hospitality.', 0, 'published', true),
('haveli-stay', 'A Haveli Stay Framed by Golden Stone', 'A Haveli Stay Framed by Golden Stone', 'Real hotel photos, heritage details, and warm direct hospitality create the atmosphere of a boutique stay inside the fort.', 1, 'published', true),
('heritage-rooms', 'Heritage Rooms Inside Jaisalmer Fort', 'Heritage Rooms Inside Jaisalmer Fort', 'Choose a traditional or modern heritage room and enquire directly with the hotel for availability and final confirmation.', 2, 'published', true),
('rooftop-restaurant', 'Rooftop Restaurant with Sweeping Views of Jaisalmer', 'Rooftop Restaurant with Sweeping Views of Jaisalmer', 'Enjoy fresh, hygienic Rajasthani and Indian food from our rooftop restaurant while experiencing panoramic views of Jaisalmer.', 3, 'published', true),
('morning-inside-fort', 'Morning Inside the Fort', 'Morning Inside the Fort', 'Wake up inside Jaisalmer''s living Golden Fort.', 4, 'published', true),
('heritage-room-details', 'Heritage Room Details', 'Heritage Room Details', 'Traditional details and comfortable heritage interiors.', 5, 'published', true),
('golden-sunset-view', 'Golden Sunset View', 'Golden Sunset View', 'Watch warm golden light settle over the fort and old city.', 6, 'published', true),
('traditional-haveli-ambience', 'Traditional Haveli Ambience', 'Traditional Haveli Ambience', 'A warm, character-rich haveli atmosphere.', 7, 'published', true),
('jaisalmer-street-life', 'Jaisalmer Street Life', 'Jaisalmer Street Life', 'Explore everyday life inside the historic fort.', 8, 'published', true),
('room-gallery', 'Gallery', 'Gallery', 'Browse the visual story of the fort, interiors, city views, and haveli atmosphere.', 9, 'published', true),
('explore-jaisalmer', 'Explore Jaisalmer', 'Explore Jaisalmer', 'The hotel is a heritage base for Jaisalmer Fort, havelis, Jain temples, desert villages, dunes, local markets, and city walks.', 10, 'published', true),
('guest-experiences', 'Guest Experiences', 'Guest Experiences', 'Selected guest experiences are presented without unverified star ratings.', 11, 'published', true),
('hotel-facilities', 'Hotel Facilities', 'Hotel Facilities', 'We provide essential guest facilities for a comfortable heritage stay.', 12, 'published', true),
('contact', 'Contact Section', 'Contact The Desert Haveli Guest House Jaisalmer', 'The guesthouse is located inside Jaisalmer Fort near the Jain Temple area.', 13, 'published', true),
('footer', 'Footer Visual Section', 'The Desert Haveli Guest House Jaisalmer', 'Experience heritage hospitality inside the Golden Fort of Jaisalmer.', 14, 'published', true)
on conflict (section_key) do nothing;
