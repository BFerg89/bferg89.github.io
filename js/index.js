const tmrApiKey = 'NubI1wXPPQa6xf4bFjzcg8nH3ss2CjDD';
const visApiKey = '54N5M9USVSFDLKR6HQQ5MJE72';
const airKey = 'd840f968-fc34-45bb-bd6b-1f063ffbf32d';
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
  const cacheKey = 'cachedWeather';
  const cacheExpiryKey = 'cachedWeatherExpiry';
  const now = Date.now();

  const cachedData = localStorage.getItem(cacheKey);
  const cacheExpiry = localStorage.getItem(cacheExpiryKey);

  if (cachedData && cacheExpiry && now < parseInt(cacheExpiry)) {
    const weather = JSON.parse(cachedData);
    updateWeatherDisplay(weather.temp, weather.condition);
    return;
  }

  try {
    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(city)}&apikey=${tmrApiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const temp = Math.round(data.data.values.temperature);
    const conditionCode = data.data.values.weatherCode;
    const condition = weatherCodes[conditionCode] || "Unknown";

    // Save to cache
    localStorage.setItem(cacheKey, JSON.stringify({ temp, condition }));
    localStorage.setItem(cacheExpiryKey, now + 5 * 60 * 1000); // 5 minutes

    updateWeatherDisplay(temp, condition);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    updateWeatherDisplay("Error", "Error");
  }
}

async function fetchTodayHighLow() {
  try {
    const url = `https://api.tomorrow.io/v4/weather/forecast?location=${encodeURIComponent(city)}&apikey=${tmrApiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const today = data.timelines.daily[0].values;
    const high = Math.round(today.temperatureMax);
    const low = Math.round(today.temperatureMin);

    document.getElementById("highLow").textContent = `High: ${high}° Low: ${low}°`;
  } catch (error) {
    console.error('Failed to fetch high/low temps from Tomorrow.io:', error);
  }
}

async function fetchAirQuality() {
  try {
    const url = `https://api.airvisual.com/v2/nearest_city?key=${airKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const aqi = data.data.current.pollution.aqius;
    let quality = "Unknown";
    if (aqi <= 50) quality = "Good";
    else if (aqi <= 100) quality = "Moderate";
    else if (aqi <= 150) quality = "Unhealthy for Sensitive Groups";
    else if (aqi <= 200) quality = "Unhealthy";
    else if (aqi <= 300) quality = "Very Unhealthy";
    else quality = "Hazardous";

    document.getElementById("airQuality").textContent = `Air Quality: ${aqi} – ${quality}`;
  } catch (error) {
    console.error('Failed to fetch AQI from IQAir:', error);
  }
}

function updateWeatherDisplay(temp, condition) {
  const tempElement = document.getElementById("currentTemp");
  tempElement.textContent = `${temp}°C`;
  document.getElementById("weatherCondition").textContent = condition;

  // Reset style
  tempElement.style.color = 'white';

  // Set color based on condition
  switch (condition) {
    case "Clear":
    case "Mostly Clear":
      tempElement.style.color = 'orange';
      break;
    case "Partly Cloudy":
    case "Mostly Cloudy":
      tempElement.style.color = 'skyblue';
      break;
    case "Cloudy":
      tempElement.style.color = 'gray';
      break;
    case "Rain":
    case "Light Rain":
    case "Heavy Rain":
      tempElement.style.color = 'dodgerblue';
      break;
    case "Snow":
    case "Light Snow":
    case "Heavy Snow":
      tempElement.style.color = 'white';
      break;
    case "Thunderstorm":
      tempElement.style.color = 'plum';
      break;
    case "Fog":
    case "Light Fog":
      tempElement.style.color = 'lightgray';
      break;
    default:
      tempElement.style.color = 'white';
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
      const [year, month, dayNum] = day.datetime.split('-').map(Number);
      const date = new Date(year, month - 1, dayNum);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const highs = forecastDays.map(day => day.tempmax);
    const lows = forecastDays.map(day => day.tempmin);

    const canvas = document.getElementById('forecastChart');
    const ctx = canvas.getContext('2d');

    // Scale for high-DPI screens
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
        plugins: { legend: { labels: { color: 'white' } }, title: {display: true,
      text: '\u00A0\u00A0\u00A0Forecast',
      color: 'white',
      font: {size: 25},
      align: 'start',
      padding: {top: 10, bottom: 5}} },
        scales: {
          x: { ticks: { color: 'white', font: {size: 16} } },
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
fetchTodayHighLow();
fetchAirQuality();


// Auto-refresh every 5 minutes (300,000 ms)
setInterval(fetchCurrentWeather, 300000);
setInterval(fetchForecastAndRenderChart, 3600000);