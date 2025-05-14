const tmrApiKey = 'NubI1wXPPQa6xf4bFjzcg8nH3ss2CjDD';
const visApiKey = '54N5M9USVSFDLKR6HQQ5MJE72';
const city = '49.2827,-123.1207';

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

async function fetchCurrentWeather() {
  try {
    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(city)}&apikey=${tmrApiKey}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const temperature = data.data.values.temperature;
    const code = data.data.values.weatherCode;
    const condition = weatherCodes[code] || "Unknown";

    const currentTemp = `${Math.round(temperature)}°C`;
    const currentCondition = `${condition}`;

    document.getElementById("currentTemp").textContent = currentTemp;
    document.getElementById("weatherCondition").textContent = currentCondition;

  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    document.getElementById("currentTemp").textContent = "Error";
    document.getElementById("weatherCondition").textContent = "Error";
  }
}

async function fetchForecastAndRenderChart() {
  try {
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/Vancouver?unitGroup=metric&key=${visApiKey}&contentType=json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const forecastDays = data.days.slice(1, 6); // Skip today, get next 5 days

    const labels = forecastDays.map(day => {
      const date = new Date(day.datetime);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const highs = forecastDays.map(day => day.tempmax);
    const lows = forecastDays.map(day => day.tempmin);

    const ctx = document.getElementById('forecastChart').getContext('2d');
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
            pointRadius: 3,
          },
          {
            label: 'Low (°C)',
            data: lows,
            borderColor: 'skyblue',
            backgroundColor: 'rgba(135,206,235,0.2)',
            borderWidth: 2,
            pointRadius: 3,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
          x: { ticks: { color: 'white' } },
          y: { ticks: { color: 'white' }, beginAtZero: false }
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch Visual Crossing forecast:', error);
  }
}


// Fetch now
fetchCurrentWeather();
fetchForecastAndRenderChart();

// Auto-refresh every 5 minutes (300,000 ms)
setInterval(fetchCurrentWeather, 300000);
setInterval(fetchForecastAndRenderChart, 3600000);