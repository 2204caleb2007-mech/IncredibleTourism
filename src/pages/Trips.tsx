import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { 
  Plus, 
  Search, 
  Calendar, 
  Sparkles,
  Filter,
  Plane
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
  created_at: string;
}

const tripImages = [
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600',
];

export default function Trips() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchTrips() {
      if (!user) return;

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTrips(data);
      }
      setLoading(false);
    }

    if (user) {
      fetchTrips();
    }
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

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(search.toLowerCase()) ||
      trip.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <title>My Trips | AI TRAVEL PLANNER</title>
        <meta name="description" content="View and manage all your travel plans and itineraries." />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">My Trips</h1>
              <p className="text-muted-foreground">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link to="/ai-planner">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Plan with AI
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/trips/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Trip
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trips..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'planning', 'upcoming', 'ongoing', 'completed'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Trips Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Plane className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">
                  {search || statusFilter !== 'all' ? 'No trips found' : 'No trips yet'}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  {search || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Start planning your first adventure! Let AI help you create the perfect itinerary.'}
                </p>
                {!search && statusFilter === 'all' && (
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link to="/ai-planner">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Plan with AI
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip, index) => (
                <Link
                  key={trip.id}
                  to={`/trips/${trip.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in-up h-full"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={trip.cover_image_url || tripImages[index % tripImages.length]}
                        alt={trip.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                      
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
                      <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                        {trip.name}
                      </h3>
                      
                      {trip.start_date && trip.end_date ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
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
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}