import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  MapPin, 
  Star, 
  DollarSign,
  Filter,
  Globe
} from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string | null;
  description: string | null;
  image_url: string | null;
  cost_index: number;
  popularity_score: number;
  tags: string[];
  is_featured: boolean;
}

const destinationImages: Record<string, string> = {
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
  'New York City': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
  'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
  'Sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600',
  'Dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600',
  'Bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600',
  'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600',
  'Amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600',
  'Santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
  'Machu Picchu': 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600',
  'Reykjavik': 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600',
  'Marrakech': 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600',
  'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
  'Cape Town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600',
  'Lisbon': 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600',
  'Prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600',
};

export default function Explore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchDestinations() {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('popularity_score', { ascending: false });

      if (!error && data) {
        setDestinations(data);
      }
      setLoading(false);
    }

    fetchDestinations();
  }, []);

  const regions = ['all', ...new Set(destinations.map(d => d.region).filter(Boolean))];

  const filteredDestinations = destinations.filter(dest => {
    const matchesSearch = 
      dest.name.toLowerCase().includes(search.toLowerCase()) ||
      dest.country.toLowerCase().includes(search.toLowerCase()) ||
      dest.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesRegion = regionFilter === 'all' || dest.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const getCostLabel = (index: number) => {
    const labels = ['Budget', 'Affordable', 'Moderate', 'Premium', 'Luxury'];
    return labels[index - 1] || 'Moderate';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Explore Destinations | AI TRAVEL PLANNER</title>
        <meta name="description" content="Discover amazing travel destinations around the world. Find your next adventure." />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">Explore Destinations</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing places around the world. Find inspiration for your next adventure.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations, countries, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {regions.map((region) => (
                <Button
                  key={region}
                  variant={regionFilter === region ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRegionFilter(region)}
                  className="capitalize"
                >
                  {region === 'all' ? 'All Regions' : region}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground mb-6">
            {filteredDestinations.length} destinations found
          </p>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDestinations.map((destination, index) => (
                <Card
                  key={destination.id}
                  className="group overflow-hidden border-0 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${(index % 8) * 50}ms` }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={destinationImages[destination.name] || destination.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600'}
                      alt={destination.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                    
                    {destination.is_featured && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-travel-sunset text-primary-foreground text-xs font-medium">
                        Featured
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-sm font-medium">
                      <Star className="h-3.5 w-3.5 text-travel-sunset fill-travel-sunset" />
                      {destination.popularity_score}
                    </div>
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-display font-bold text-primary-foreground mb-1">
                        {destination.name}
                      </h3>
                      <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {destination.country}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {destination.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-4 w-4 text-travel-forest" />
                        <span className="font-medium">{getCostLabel(destination.cost_index)}</span>
                      </div>
                      <div className="flex gap-1">
                        {destination.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}