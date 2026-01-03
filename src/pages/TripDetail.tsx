import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Sparkles,
  Edit,
  Trash2,
  Share2,
  Plus,
  DollarSign
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
  total_budget: number | null;
  currency: string;
}

interface TripStop {
  id: string;
  destination_id: string | null;
  custom_destination_name: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  order_index: number;
  destination?: {
    name: string;
    country: string;
    image_url: string | null;
  };
}

export default function TripDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchTrip() {
      if (!user || !id) return;

      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .single();

      if (tripError) {
        toast.error('Trip not found');
        navigate('/trips');
        return;
      }

      setTrip(tripData);

      const { data: stopsData } = await supabase
        .from('trip_stops')
        .select(`
          *,
          destination:destinations(name, country, image_url)
        `)
        .eq('trip_id', id)
        .order('order_index');

      if (stopsData) {
        setStops(stopsData);
      }

      setLoading(false);
    }

    if (user) {
      fetchTrip();
    }
  }, [user, id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete trip');
    } else {
      toast.success('Trip deleted');
      navigate('/trips');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-travel-lavender/20 text-travel-lavender';
      case 'upcoming': return 'bg-travel-sky/20 text-travel-sky';
      case 'ongoing': return 'bg-travel-forest/20 text-travel-forest';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-64 rounded-2xl mb-8" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!trip) return null;

  return (
    <>
      <Helmet>
        <title>{trip.name} | AI TRAVEL PLANNER</title>
        <meta name="description" content={trip.description || `View your ${trip.name} trip itinerary`} />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Button variant="ghost" className="mb-6" onClick={() => navigate('/trips')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Button>

          {/* Hero section */}
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
            <img
              src={trip.cover_image_url || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200'}
              alt={trip.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(trip.status)}`}>
                  {trip.status}
                </span>
                {trip.is_ai_generated && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-travel-sunset text-primary-foreground text-sm font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Generated
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">
                {trip.name}
              </h1>
              
              {trip.start_date && trip.end_date && (
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(trip.start_date), 'MMMM d')} - {format(new Date(trip.end_date), 'MMMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="icon" variant="secondary" className="rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" className="rounded-full" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {trip.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>About this trip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{trip.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Itinerary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Itinerary</CardTitle>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>
                </CardHeader>
                <CardContent>
                  {stops.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No stops added yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your itinerary by adding destinations
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Stop
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stops.map((stop, index) => (
                        <div
                          key={stop.id}
                          className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {stop.destination?.name || stop.custom_destination_name}
                            </h4>
                            {stop.destination?.country && (
                              <p className="text-sm text-muted-foreground">
                                {stop.destination.country}
                              </p>
                            )}
                            {stop.arrival_date && stop.departure_date && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(stop.arrival_date), 'MMM d')} - {format(new Date(stop.departure_date), 'MMM d')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Budget */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trip.total_budget ? (
                    <div>
                      <p className="text-3xl font-bold">
                        {trip.currency} {trip.total_budget.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">Total estimated</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-3">No budget set</p>
                      <Button size="sm" variant="outline">Set Budget</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to={`/chat?trip=${id}`}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ask AI for suggestions
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share trip
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}