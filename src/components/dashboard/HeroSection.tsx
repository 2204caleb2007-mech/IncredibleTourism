import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, Plane, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function HeroSection() {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Traveler';

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-95" />
      
      {/* Pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-medium mb-6 backdrop-blur">
            <Sparkles className="h-4 w-4" />
            AI-Powered Travel Planning
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6 leading-tight">
            Hey {firstName}! 👋
            <br />
            <span className="text-travel-sand">Where to next?</span>
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl">
            Let AI craft your perfect itinerary. Just tell us your dream destination, budget, and travel style—we'll handle the rest.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold bg-travel-sunset hover:bg-travel-sunset/90 text-primary-foreground group"
              asChild
            >
              <Link to="/ai-planner">
                <Sparkles className="h-5 w-5 mr-2" />
                Plan with AI
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/50"
              asChild
            >
              <Link to="/trips/new">
                <Plane className="h-5 w-5 mr-2" />
                Create Trip Manually
              </Link>
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="hidden lg:block absolute top-20 right-20 animate-float">
          <div className="p-6 glass rounded-2xl">
            <div className="flex items-center gap-3 text-primary-foreground">
              <div className="p-2 rounded-lg bg-travel-sunset/20">
                <Plane className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Paris → Tokyo</p>
                <p className="text-sm opacity-80">5 cities • 14 days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block absolute bottom-20 right-40 animate-float" style={{ animationDelay: '2s' }}>
          <div className="p-4 glass rounded-2xl">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Sparkles className="h-5 w-5 text-travel-sand" />
              <span className="font-medium">AI optimized route</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}