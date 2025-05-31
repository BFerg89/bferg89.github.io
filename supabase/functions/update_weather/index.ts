import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get environment variables securely
const tmrApiKey = Deno.env.get('TMR_API_KEY');
const visApiKey = Deno.env.get('VIS_API_KEY');
const airKey = Deno.env.get('AIR_KEY');
const city = '49.2827,-123.1207';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Allow both GET and POST for easy browser/API testing
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    //Fetch current weather
    const weatherRes = await fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(city)}&apikey=${tmrApiKey}`);
    const weatherData = await weatherRes.json();
    const temp = Math.round(weatherData.data.values.temperature);
    const conditionCode = weatherData.data.values.weatherCode;

    //Fetch today's high/low
    const forecastRes = await fetch(`https://api.tomorrow.io/v4/weather/forecast?location=${encodeURIComponent(city)}&apikey=${tmrApiKey}`);
    const forecastData = await forecastRes.json();
    const today = forecastData.timelines.daily[0].values;
    const high = Math.round(today.temperatureMax);
    const low = Math.round(today.temperatureMin);

    //Fetch AQI
    const airRes = await fetch(`https://api.airvisual.com/v2/nearest_city?key=${airKey}`);
    const airData = await airRes.json();
    const airQuality = airData.data.current.pollution.aqius;

    //Fetch 5-day forecast (from Visual Crossing)
    const vcRes = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Vancouver?unitGroup=metric&key=${visApiKey}&contentType=json`);
    const vcData = await vcRes.json();
    const forecastDays = vcData.days.slice(1, 6); // Next 5 days

    const forecastJson = forecastDays.map(day => ({
      date: day.datetime,
      high: Math.round(day.tempmax),
      low: Math.round(day.tempmin),
      code: day.icon || null,        
      text: day.conditions || null   
    }));

    // 5. Update the Supabase table
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from('HomePage') 
      .upsert([{
        id: 1,
        temp: temp,
        conditions: conditionCode,
        high: high,
        low: low,
        air_quality: airQuality,
        forecast: forecastJson,
      }], { onConflict: ['id'] });

    if (error) {
      console.error("Supabase DB error:", error);
      return new Response(JSON.stringify({ success: false, db_error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    // Log and return error
    console.error("Function error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
});
