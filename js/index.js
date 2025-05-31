const supabaseUrl = 'https://afsauvbufltrpcmufhjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmc2F1dmJ1Zmx0cnBjbXVmaGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU1ODcyOCwiZXhwIjoyMDY0MTM0NzI4fQ.7zuyshGeDdhwbfEr7Ij5F22x1e1ZG4tEjaQivKTS9F0';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

const weatherCodes = {
  1000: "Clear",
  1100: "Mostly Clear",
  1101: "Partly Cloudy",
  1102: "Mostly Cloudy",
  1001: "Cloudy",
  2000: "Fog",
  2100: "Light Fog",
  4000: "Drizzle",
  4001: "Rain",
  4200: "Light Rain",
  4201: "Heavy Rain",
  5000: "Snow",
  5100: "Light Snow",
  5101: "Heavy Snow",
  8000: "Thunderstorm"
};

async function fetchWeatherFromSupabase() {
  const { data, error } = await supabaseClient
    .from('HomePage')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Failed to fetch weather from Supabase:', error);
    updateWeatherDisplay("Error", "Error");
    return null;
  }
  return data;
}

function updateWeatherDisplay(temp, conditionCode) {
  const tempElement = document.getElementById("currentTemp");
  const condition = weatherCodes[conditionCode] || "Unknown";
  tempElement.textContent = `${temp}°C`;
  document.getElementById("weatherCondition").textContent = condition;

  // Style as before
  tempElement.style.color = 'white';
  switch (condition) {
    case "Clear": case "Mostly Clear":
      tempElement.style.color = 'orange'; break;
    case "Partly Cloudy": case "Mostly Cloudy":
      tempElement.style.color = 'skyblue'; break;
    case "Cloudy":
      tempElement.style.color = 'gray'; break;
    case "Rain": case "Light Rain": case "Heavy Rain":
      tempElement.style.color = 'dodgerblue'; break;
    case "Snow": case "Light Snow": case "Heavy Snow":
      tempElement.style.color = 'white'; break;
    case "Thunderstorm":
      tempElement.style.color = 'plum'; break;
    case "Fog": case "Light Fog":
      tempElement.style.color = 'lightgray'; break;
    default:
      tempElement.style.color = 'white';
  }
}

function updateHighLowDisplay(high, low) {
  document.getElementById("highLow").textContent = `High: ${high}° Low: ${low}°`;
}

function updateAirQualityDisplay(aqi) {
  let quality = "Unknown";
  if (aqi <= 50) quality = "Good";
  else if (aqi <= 100) quality = "Moderate";
  else if (aqi <= 150) quality = "Unhealthy for Sensitive Groups";
  else if (aqi <= 200) quality = "Unhealthy";
  else if (aqi <= 300) quality = "Very Unhealthy";
  else quality = "Hazardous";
  document.getElementById("airQuality").textContent = `Air Quality: ${aqi} – ${quality}`;
}

function renderForecastChart(forecastArray) {
  // forecastArray is already parsed as an array from Supabase
  const labels = forecastArray.map(day => {
    // Try to use day.date as a short day of week (e.g., Thu)
    if (!day.date) return "";
    const date = new Date(day.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });

  const highs = forecastArray.map(day => day.high);
  const lows = forecastArray.map(day => day.low);

  const canvas = document.getElementById('forecastChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'High (°C)',
          data: highs,
          borderColor: 'orange',
          backgroundColor: 'rgba(255,165,0,0.2)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'white',
          pointBorderColor: 'orange'
        },
        {
          label: 'Low (°C)',
          data: lows,
          borderColor: 'skyblue',
          backgroundColor: 'rgba(135,206,235,0.2)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'white',
          pointBorderColor: 'skyblue'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'white' } },
        title: {
          display: true,
          text: '\u00A0\u00A0\u00A0Forecast',
          color: 'white',
          font: { size: 25 },
          align: 'start',
          padding: { top: 10, bottom: 5 }
        }
      },
      scales: {
        x: { ticks: { color: 'white', font: { size: 16 } } },
        y: { ticks: { color: 'white' }, beginAtZero: false }
      }
    }
  });
}

// Master function to update everything from Supabase
async function updateAllWeatherFromSupabase() {
  const weather = await fetchWeatherFromSupabase();
  if (!weather) return;

  updateWeatherDisplay(weather.temp, weather.conditions);
  updateHighLowDisplay(weather.high, weather.low);
  updateAirQualityDisplay(weather.air_quality);
  renderForecastChart(weather.forecast);
}

// Call once on load and optionally set up an interval to auto-refresh
updateAllWeatherFromSupabase();
setInterval(updateAllWeatherFromSupabase, 5 * 60 * 1000); // every 5 min