import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Loader2,
  Plane,
  DollarSign,
  Calendar,
  Heart,
  ArrowRight,
  MapPin
} from 'lucide-react';

const travelStyles = [
  { id: 'backpacker', label: 'Backpacker', icon: '🎒' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'comfort', label: 'Comfort', icon: '✨' },
  { id: 'luxury', label: 'Luxury', icon: '👑' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'solo', label: 'Solo', icon: '🧳' },
  { id: 'couple', label: 'Couple', icon: '💑' },
];

const interests = [
  { id: 'culture', label: 'Culture & History', icon: '🏛️' },
  { id: 'food', label: 'Food & Cuisine', icon: '🍜' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'beach', label: 'Beach & Relaxation', icon: '🏖️' },
  { id: 'nature', label: 'Nature & Wildlife', icon: '🌿' },
  { id: 'nightlife', label: 'Nightlife', icon: '🎉' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'art', label: 'Art & Museums', icon: '🎨' },
];

const budgetRanges = [
  { id: 'budget', label: '$500 - $1,500', description: 'Budget-friendly' },
  { id: 'moderate', label: '$1,500 - $3,500', description: 'Mid-range comfort' },
  { id: 'premium', label: '$3,500 - $7,000', description: 'Premium experience' },
  { id: 'luxury', label: '$7,000+', description: 'Luxury travel' },
];

export default function AiPlanner() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('7');
  const [travelStyle, setTravelStyle] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Call the AI edge function
      const response = await supabase.functions.invoke('ai-trip-generator', {
        body: {
          destination,
          duration: parseInt(duration),
          travelStyle,
          interests: selectedInterests,
          budget,
          additionalNotes,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { tripId } = response.data;
      toast.success('Trip generated successfully!');
      navigate(`/trips/${tripId}`);
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <title>AI Trip Planner | AI TRAVEL PLANNER</title>
        <meta name="description" content="Let AI create your perfect travel itinerary based on your preferences." />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex p-3 rounded-2xl gradient-sunset mb-4">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">AI Trip Planner</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Tell us about your dream trip and our AI will create a personalized itinerary just for you.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Destination & Duration */}
          {step === 1 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Where & When
                </CardTitle>
                <CardDescription>Tell us about your destination and travel dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="destination">Where do you want to go?</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Japan, Italy, Southeast Asia, or let AI surprise you"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a specific city, country, region, or leave blank for AI suggestions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">How many days?</Label>
                  <div className="flex gap-2">
                    {['5', '7', '10', '14', '21'].map((d) => (
                      <Button
                        key={d}
                        type="button"
                        variant={duration === d ? 'default' : 'outline'}
                        onClick={() => setDuration(d)}
                        className="flex-1"
                      >
                        {d} days
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={() => setStep(2)}
                  disabled={!destination.trim()}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Style & Interests */}
          {step === 2 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-travel-sunset" />
                  Your Style
                </CardTitle>
                <CardDescription>Help us understand how you like to travel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Travel Style</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {travelStyles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setTravelStyle(style.id)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          travelStyle === style.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{style.icon}</span>
                        <span className="text-sm font-medium">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>What are you interested in? (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {interests.map((interest) => (
                      <button
                        key={interest.id}
                        type="button"
                        onClick={() => toggleInterest(interest.id)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          selectedInterests.includes(interest.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{interest.icon}</span>
                        <span className="text-sm font-medium">{interest.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 h-12"
                    onClick={() => setStep(3)}
                    disabled={!travelStyle || selectedInterests.length === 0}
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Budget & Generate */}
          {step === 3 && (
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-travel-forest" />
                  Budget & Details
                </CardTitle>
                <CardDescription>Final details before we create your trip</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Budget Range (per person)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {budgetRanges.map((range) => (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setBudget(range.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          budget === range.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="font-semibold block">{range.label}</span>
                        <span className="text-sm text-muted-foreground">{range.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Any special requests? (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., I want to avoid crowds, prefer walking tours, need vegetarian food options..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <h4 className="font-semibold">Trip Summary</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📍 Destination: {destination}</p>
                    <p>📅 Duration: {duration} days</p>
                    <p>🎒 Style: {travelStyles.find(s => s.id === travelStyle)?.label}</p>
                    <p>❤️ Interests: {selectedInterests.map(i => interests.find(int => int.id === i)?.label).join(', ')}</p>
                    <p>💰 Budget: {budgetRanges.find(b => b.id === budget)?.label}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 h-12 gradient-sunset hover:opacity-90 text-primary-foreground"
                    onClick={handleGenerate}
                    disabled={!budget || loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate My Trip
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </>
  );
}