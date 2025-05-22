const opnKey = 'c0e335d771d50680ef05958d5df7f0cb';
const lat = 49.2827; // Vancouver latitude
const lon = -123.1207; // Vancouver longitude

function fetchCurrentPrecip() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${opnKey}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const rain = data.rain ? data.rain["1h"] || 0 : 0;
      const humidity = data.main.humidity;
      const clouds = data.clouds.all;

      document.querySelector('.current').innerHTML += `
        <h3>Humidity: ${humidity}%</h3>
        <h3>Cloud Cover: ${clouds}%</h3>
        <h3>Precip (last hour): ${rain} mm</h3>
      `;
    })
    .catch(err => console.error('Current precip error:', err));
}

function fetchHourlyPrecip() {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${opnKey}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const hourlyDiv = document.querySelector('.hourly');
      const container = document.createElement('div');
      container.className = 'hourly-scroll';

      for (let i = 0; i < 8; i++) {
        const hour = data.list[i];
        const time = new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const pop = Math.round(hour.pop * 100); // probability of precipitation
        const volume = hour.rain ? hour.rain["3h"] || 0 : 0;

        const box = document.createElement('div');
        box.className = 'hour-box';
        box.innerHTML = `
          <div class="hour-time">${time}</div>
          <div class="hour-prob">${pop}% chance</div>
          <div class="hour-vol">${volume} mm</div>
        `;
        container.appendChild(box);
      }

      hourlyDiv.appendChild(container);
    })
    .catch(err => console.error('Hourly precip error:', err));
}

const options = {
    // Required: API key
    key: 'cuszC2Or2TuOezpVsO43dKh422UkcC8D', // REPLACE WITH YOUR KEY !!!

    // Put additional console output
    verbose: true,

    // Optional: Initial state of the map
    lat: 49,
    lon: -123,
    zoom: 7,
    overlay: 'rain'
};

// Windy setup
windyInit(options, windyAPI => {
    // windyAPI is ready, and contain 'map', 'store',
    // 'picker' and other usefull stuff

    const { map } = windyAPI;
    // .map is instance of Leaflet map
});

// Init
fetchCurrentPrecip();
fetchHourlyPrecip();
