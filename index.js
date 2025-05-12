const apiKey = 'NubI1wXPPQa6xf4bFjzcg8nH3ss2CjDD';
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
    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(city)}&apikey=${apiKey}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const temperature = data.data.values.temperature;
    const code = data.data.values.weatherCode;
    const condition = weatherCodes[code] || "Unknown";

    const currentTemp = `${temperature}°C`;
    const currentCondition = `${condition}`;

    document.getElementById("currentTemp").textContent = currentTemp;
    document.getElementById("weatherCondition").textContent = currentCondition;

  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    document.getElementById("currentTemp").textContent = "Error";
    document.getElementById("weatherCondition").textContent = "Error";
  }
}

// Fetch now
fetchCurrentWeather();

// Auto-refresh every 5 minutes (300,000 ms)
setInterval(fetchCurrentWeather, 300000);