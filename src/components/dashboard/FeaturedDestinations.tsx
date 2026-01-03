import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Star, DollarSign, ArrowRight } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  image_url: string | null;
  cost_index: number;
  popularity_score: number;
  tags: string[];
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
  'Santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
  'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
};

export default function FeaturedDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDestinations() {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_featured', true)
        .order('popularity_score', { ascending: false })
        .limit(6);

      if (!error && data) {
        setDestinations(data);
      }
      setLoading(false);
    }

    fetchDestinations();
  }, []);

  const getCostLabel = (index: number) => {
    const labels = ['Budget', 'Affordable', 'Moderate', 'Premium', 'Luxury'];
    return labels[index - 1] || 'Moderate';
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">Popular Destinations</h2>
            <p className="text-muted-foreground">Discover where travelers are heading</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex items-center gap-2" asChild>
            <Link to="/explore">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination, index) => (
            <Card
              key={destination.id}
              className="group overflow-hidden border-0 shadow-soft hover:shadow-medium transition-all duration-300 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={destinationImages[destination.name] || destination.image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600'}
                  alt={destination.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur text-sm font-medium">
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

        <div className="sm:hidden mt-6 text-center">
          <Button variant="outline" asChild>
            <Link to="/explore">
              View All Destinations
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}