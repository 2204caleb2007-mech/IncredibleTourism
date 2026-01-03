import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface Trip {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_ai_generated: boolean;
  status: string;
}

const tripImages = [
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600',
];

export default function RecentTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrips() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        setTrips(data);
      }
      setLoading(false);
    }

    fetchTrips();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-travel-lavender/20 text-travel-lavender';
      case 'upcoming': return 'bg-travel-sky/20 text-travel-sky';
      case 'ongoing': return 'bg-travel-forest/20 text-travel-forest';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">Your Trips</h2>
            <p className="text-muted-foreground">Continue planning your adventures</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex items-center gap-2" asChild>
            <Link to="/trips">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {trips.length === 0 ? (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No trips yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                Start planning your first adventure! Let AI help you create the perfect itinerary.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link to="/ai-planner">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Plan with AI
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/trips/new">Create Manually</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trips.map((trip, index) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="group"
              >
                <Card className="overflow-hidden border-0 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in-up h-full"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={trip.cover_image_url || tripImages[index % tripImages.length]}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                    
                    {/* Status & AI badge */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(trip.status)}`}>
                        {trip.status}
                      </span>
                      {trip.is_ai_generated && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-travel-sunset/90 text-primary-foreground text-xs font-medium">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {trip.name}
                    </h3>
                    
                    {trip.start_date && trip.end_date ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-4 w-4" />
                        <span>Dates not set</span>
                      </div>
                    )}

                    {trip.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Add new trip card */}
            <Link to="/trips/new" className="group">
              <Card className="h-full border-dashed border-2 hover:border-primary/50 transition-all duration-300 flex items-center justify-center min-h-[250px]">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    New Trip
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}