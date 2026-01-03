import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/dashboard/HeroSection';
import RecentTrips from '@/components/dashboard/RecentTrips';
import FeaturedDestinations from '@/components/dashboard/FeaturedDestinations';
import { Helmet } from 'react-helmet-async';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your adventures...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>AI Travel Planner</title>
        <meta name="description" content="Plan your perfect trip with AI-powered itineraries, discover destinations, and manage your travel adventures." />
      </Helmet>
      <Layout>
        <HeroSection />
        <RecentTrips />
        <FeaturedDestinations />
      </Layout>
    </>
  );
}