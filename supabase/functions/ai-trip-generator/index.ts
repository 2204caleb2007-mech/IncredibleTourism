import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, duration, travelStyle, interests, budget, additionalNotes } = await req.json();
    
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Create a detailed ${duration}-day travel itinerary for ${destination}.

Travel Style: ${travelStyle}
Interests: ${interests.join(", ")}
Budget Level: ${budget}
${additionalNotes ? `Special Requests: ${additionalNotes}` : ""}

Please provide:
1. A catchy trip name
2. A brief description (2-3 sentences)
3. Day-by-day breakdown with activities

Format your response as JSON:
{
  "name": "Trip Name",
  "description": "Brief description",
  "days": [
    {
      "day": 1,
      "city": "City Name",
      "activities": [
        { "name": "Activity", "duration": 2, "cost": 25, "description": "Brief desc" }
      ]
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert travel planner. Respond only with valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse AI response
    let tripData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      tripData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      tripData = { name: `${destination} Adventure`, description: `A ${duration}-day trip to ${destination}`, days: [] };
    }

    // Create trip in database
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        name: tripData.name,
        description: tripData.description,
        is_ai_generated: true,
        status: "planning",
      })
      .select()
      .single();

    if (tripError) throw tripError;

    return new Response(JSON.stringify({ tripId: trip.id, tripData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generator error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});