-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  travel_style TEXT CHECK (travel_style IN ('backpacker', 'budget', 'comfort', 'luxury', 'family', 'solo', 'couple')),
  interests TEXT[] DEFAULT '{}',
  preferred_budget TEXT CHECK (preferred_budget IN ('budget', 'moderate', 'premium', 'luxury')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create destinations table (pre-seeded cities)
CREATE TABLE public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  description TEXT,
  image_url TEXT,
  cost_index INTEGER CHECK (cost_index >= 1 AND cost_index <= 5), -- 1=cheap, 5=expensive
  popularity_score INTEGER DEFAULT 0,
  best_months TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_by UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('sightseeing', 'food', 'adventure', 'culture', 'nature', 'nightlife', 'shopping', 'relaxation')),
  estimated_cost DECIMAL(10, 2),
  duration_hours DECIMAL(4, 2),
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  is_ai_generated BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  total_budget DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('planning', 'upcoming', 'ongoing', 'completed')) DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trip_stops table (links trips to destinations)
CREATE TABLE public.trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES public.destinations(id),
  custom_destination_name TEXT, -- for user-added destinations not in db
  arrival_date DATE,
  departure_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  accommodation_budget DECIMAL(10, 2),
  transport_budget DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stop_activities table
CREATE TABLE public.stop_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_stop_id UUID NOT NULL REFERENCES public.trip_stops(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id),
  custom_activity_name TEXT, -- for user-added activities
  custom_activity_description TEXT,
  scheduled_date DATE,
  scheduled_time TIME,
  duration_hours DECIMAL(4, 2),
  estimated_cost DECIMAL(10, 2),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_ai_recommended BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table for AI assistant
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stop_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Destinations policies (public read, admin/creator write)
CREATE POLICY "Anyone can view destinations" ON public.destinations
  FOR SELECT USING (true);

CREATE POLICY "Users can create destinations" ON public.destinations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update destinations" ON public.destinations
  FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete destinations" ON public.destinations
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Activities policies
CREATE POLICY "Anyone can view activities" ON public.activities
  FOR SELECT USING (true);

CREATE POLICY "Users can create activities" ON public.activities
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update activities" ON public.activities
  FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete activities" ON public.activities
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Trips policies
CREATE POLICY "Users can view their own trips" ON public.trips
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create trips" ON public.trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (auth.uid() = user_id);

-- Trip stops policies
CREATE POLICY "Users can view stops of their trips" ON public.trip_stops
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND (trips.user_id = auth.uid() OR trips.is_public = true))
  );

CREATE POLICY "Users can manage stops of their trips" ON public.trip_stops
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can update stops of their trips" ON public.trip_stops
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid())
  );

CREATE POLICY "Users can delete stops of their trips" ON public.trip_stops
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.trips WHERE trips.id = trip_stops.trip_id AND trips.user_id = auth.uid())
  );

-- Stop activities policies
CREATE POLICY "Users can view activities of their trip stops" ON public.stop_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trip_stops ts
      JOIN public.trips t ON t.id = ts.trip_id
      WHERE ts.id = stop_activities.trip_stop_id AND (t.user_id = auth.uid() OR t.is_public = true)
    )
  );

CREATE POLICY "Users can manage activities of their trip stops" ON public.stop_activities
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_stops ts
      JOIN public.trips t ON t.id = ts.trip_id
      WHERE ts.id = stop_activities.trip_stop_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities of their trip stops" ON public.stop_activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trip_stops ts
      JOIN public.trips t ON t.id = ts.trip_id
      WHERE ts.id = stop_activities.trip_stop_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities of their trip stops" ON public.stop_activities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trip_stops ts
      JOIN public.trips t ON t.id = ts.trip_id
      WHERE ts.id = stop_activities.trip_stop_id AND t.user_id = auth.uid()
    )
  );

-- Chat messages policies
CREATE POLICY "Users can view their own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create trigger for new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed popular destinations
INSERT INTO public.destinations (name, country, region, description, cost_index, popularity_score, best_months, tags, latitude, longitude, is_featured) VALUES
('Paris', 'France', 'Europe', 'The City of Light, famous for the Eiffel Tower, Louvre, and world-class cuisine.', 4, 95, ARRAY['Apr', 'May', 'Jun', 'Sep', 'Oct'], ARRAY['romantic', 'culture', 'food', 'art'], 48.8566, 2.3522, true),
('Tokyo', 'Japan', 'Asia', 'A dazzling blend of ultra-modern and traditional, from neon-lit skyscrapers to ancient temples.', 4, 92, ARRAY['Mar', 'Apr', 'Oct', 'Nov'], ARRAY['culture', 'food', 'technology', 'shopping'], 35.6762, 139.6503, true),
('New York City', 'USA', 'North America', 'The city that never sleeps, offering iconic landmarks, Broadway, and endless energy.', 5, 94, ARRAY['Apr', 'May', 'Sep', 'Oct', 'Dec'], ARRAY['culture', 'food', 'nightlife', 'shopping'], 40.7128, -74.0060, true),
('Barcelona', 'Spain', 'Europe', 'A vibrant coastal city with stunning Gaudí architecture, beaches, and amazing tapas.', 3, 88, ARRAY['May', 'Jun', 'Sep', 'Oct'], ARRAY['beach', 'culture', 'food', 'art'], 41.3851, 2.1734, true),
('Bali', 'Indonesia', 'Asia', 'A tropical paradise with lush rice terraces, ancient temples, and beautiful beaches.', 2, 90, ARRAY['Apr', 'May', 'Jun', 'Sep'], ARRAY['beach', 'nature', 'relaxation', 'culture'], -8.3405, 115.0920, true),
('Rome', 'Italy', 'Europe', 'The Eternal City, home to the Colosseum, Vatican, and incredible Italian cuisine.', 3, 91, ARRAY['Apr', 'May', 'Sep', 'Oct'], ARRAY['history', 'culture', 'food', 'art'], 41.9028, 12.4964, true),
('Sydney', 'Australia', 'Oceania', 'A stunning harbor city with the iconic Opera House, beautiful beaches, and vibrant culture.', 4, 85, ARRAY['Sep', 'Oct', 'Nov', 'Mar', 'Apr'], ARRAY['beach', 'culture', 'nature', 'adventure'], -33.8688, 151.2093, true),
('Dubai', 'UAE', 'Middle East', 'A futuristic metropolis rising from the desert with luxury shopping and stunning architecture.', 4, 87, ARRAY['Nov', 'Dec', 'Jan', 'Feb', 'Mar'], ARRAY['luxury', 'shopping', 'architecture', 'adventure'], 25.2048, 55.2708, true),
('Bangkok', 'Thailand', 'Asia', 'A bustling capital with ornate temples, incredible street food, and vibrant nightlife.', 2, 86, ARRAY['Nov', 'Dec', 'Jan', 'Feb'], ARRAY['culture', 'food', 'nightlife', 'budget'], 13.7563, 100.5018, true),
('London', 'UK', 'Europe', 'A historic metropolis with world-class museums, royal palaces, and diverse neighborhoods.', 5, 93, ARRAY['May', 'Jun', 'Jul', 'Sep'], ARRAY['culture', 'history', 'shopping', 'food'], 51.5074, -0.1278, true),
('Amsterdam', 'Netherlands', 'Europe', 'A charming city of canals, bicycles, world-famous museums, and vibrant nightlife.', 3, 84, ARRAY['Apr', 'May', 'Jun', 'Sep'], ARRAY['culture', 'nightlife', 'art', 'romantic'], 52.3676, 4.9041, false),
('Santorini', 'Greece', 'Europe', 'A stunning island with iconic blue-domed churches, dramatic sunsets, and volcanic beaches.', 4, 89, ARRAY['May', 'Jun', 'Sep', 'Oct'], ARRAY['romantic', 'beach', 'relaxation', 'photography'], 36.3932, 25.4615, true),
('Machu Picchu', 'Peru', 'South America', 'The ancient Incan citadel set high in the Andes Mountains, a bucket-list destination.', 2, 88, ARRAY['Apr', 'May', 'Sep', 'Oct'], ARRAY['history', 'adventure', 'culture', 'hiking'], -13.1631, -72.5450, true),
('Reykjavik', 'Iceland', 'Europe', 'Gateway to stunning natural wonders including the Northern Lights, geysers, and glaciers.', 5, 82, ARRAY['Jun', 'Jul', 'Aug', 'Sep', 'Feb', 'Mar'], ARRAY['nature', 'adventure', 'unique'], 64.1466, -21.9426, false),
('Marrakech', 'Morocco', 'Africa', 'A sensory feast of colorful souks, historic palaces, and exotic cuisine.', 2, 83, ARRAY['Mar', 'Apr', 'May', 'Oct', 'Nov'], ARRAY['culture', 'food', 'shopping', 'exotic'], 31.6295, -7.9811, false),
('Kyoto', 'Japan', 'Asia', 'Japan''s cultural heart with thousands of temples, traditional geisha districts, and zen gardens.', 3, 87, ARRAY['Mar', 'Apr', 'Oct', 'Nov'], ARRAY['culture', 'history', 'nature', 'relaxation'], 35.0116, 135.7681, true),
('Cape Town', 'South Africa', 'Africa', 'A stunning coastal city with Table Mountain, beautiful beaches, and incredible wine country.', 2, 84, ARRAY['Nov', 'Dec', 'Jan', 'Feb', 'Mar'], ARRAY['nature', 'adventure', 'beach', 'wine'], -33.9249, 18.4241, false),
('Lisbon', 'Portugal', 'Europe', 'A charming hillside city with colorful tiles, historic trams, and delicious pastéis de nata.', 2, 85, ARRAY['Apr', 'May', 'Jun', 'Sep', 'Oct'], ARRAY['culture', 'food', 'budget', 'romantic'], 38.7223, -9.1393, false),
('Singapore', 'Singapore', 'Asia', 'A futuristic city-state with incredible food, stunning gardens, and world-class attractions.', 4, 86, ARRAY['Feb', 'Mar', 'Apr', 'Oct', 'Nov'], ARRAY['food', 'shopping', 'culture', 'family'], 1.3521, 103.8198, false),
('Prague', 'Czech Republic', 'Europe', 'A fairy-tale city with Gothic architecture, charming old town, and great beer.', 2, 84, ARRAY['Apr', 'May', 'Sep', 'Oct', 'Dec'], ARRAY['culture', 'history', 'budget', 'romantic'], 50.0755, 14.4378, false);

-- Seed some activities for popular destinations
INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags) 
SELECT d.id, 'Eiffel Tower Visit', 'Iconic iron lattice tower with stunning city views', 'sightseeing', 28.00, 2.5, ARRAY['iconic', 'views', 'romantic']
FROM public.destinations d WHERE d.name = 'Paris';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Louvre Museum', 'World''s largest art museum housing the Mona Lisa', 'culture', 17.00, 4.0, ARRAY['art', 'history', 'culture']
FROM public.destinations d WHERE d.name = 'Paris';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Seine River Cruise', 'Romantic boat cruise along the Seine', 'sightseeing', 15.00, 1.5, ARRAY['romantic', 'scenic', 'relaxing']
FROM public.destinations d WHERE d.name = 'Paris';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Senso-ji Temple', 'Tokyo''s oldest and most famous Buddhist temple', 'culture', 0.00, 2.0, ARRAY['temple', 'history', 'free']
FROM public.destinations d WHERE d.name = 'Tokyo';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Tsukiji Outer Market Food Tour', 'Experience the freshest sushi and Japanese street food', 'food', 50.00, 3.0, ARRAY['food', 'local', 'authentic']
FROM public.destinations d WHERE d.name = 'Tokyo';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Shibuya Crossing', 'Experience the world''s busiest pedestrian crossing', 'sightseeing', 0.00, 0.5, ARRAY['iconic', 'free', 'photography']
FROM public.destinations d WHERE d.name = 'Tokyo';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Colosseum Tour', 'Explore ancient Rome''s iconic amphitheater', 'culture', 18.00, 3.0, ARRAY['history', 'iconic', 'ancient']
FROM public.destinations d WHERE d.name = 'Rome';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Vatican Museums & Sistine Chapel', 'Marvel at Michelangelo''s masterpiece', 'culture', 20.00, 4.0, ARRAY['art', 'history', 'religious']
FROM public.destinations d WHERE d.name = 'Rome';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Tegallalang Rice Terraces', 'Stunning green rice paddies with jungle swing', 'nature', 15.00, 3.0, ARRAY['nature', 'photography', 'scenic']
FROM public.destinations d WHERE d.name = 'Bali';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Uluwatu Temple Sunset', 'Cliffside temple with traditional Kecak fire dance', 'culture', 10.00, 3.0, ARRAY['temple', 'sunset', 'performance']
FROM public.destinations d WHERE d.name = 'Bali';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Statue of Liberty & Ellis Island', 'Iconic symbol of freedom and immigration history', 'sightseeing', 24.00, 4.0, ARRAY['iconic', 'history', 'views']
FROM public.destinations d WHERE d.name = 'New York City';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Broadway Show', 'World-class theater experience', 'culture', 150.00, 3.0, ARRAY['theater', 'entertainment', 'nightlife']
FROM public.destinations d WHERE d.name = 'New York City';

INSERT INTO public.activities (destination_id, name, description, category, estimated_cost, duration_hours, tags)
SELECT d.id, 'Central Park', 'Iconic urban park perfect for walking, biking, or picnicking', 'nature', 0.00, 3.0, ARRAY['nature', 'free', 'relaxing']
FROM public.destinations d WHERE d.name = 'New York City';