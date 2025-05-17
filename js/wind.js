const opnKey = 'c0e335d771d50680ef05958d5df7f0cb';

const stations = [
  { name: 'Vancouver Intl Airport (YVR)', lat: 49.1934, lon: -123.1751 },
  { name: 'Victoria Intl Airport (YYJ)', lat: 48.6469, lon: -123.4269 },
  { name: 'Abbotsford Intl Airport (YXX)', lat: 49.0253, lon: -122.3608 },
  { name: 'Squamish Airport (YSE)', lat: 49.7817, lon: -123.1622 },
  { name: 'Sechelt-Gibsons Airport (YHS)', lat: 49.4722, lon: -123.8069 }
];

const dropdownContent = document.getElementById('stationDropdown');
const stationButton = document.getElementById('stationButton');

stations.forEach(station => {
  const a = document.createElement('a');
  a.href = '#';
  a.textContent = station.name;
  a.addEventListener('click', () => {
    stationButton.textContent = station.name;  // Update the button label
    fetchWindData(station.lat, station.lon);
  });
  dropdownContent.appendChild(a);
});

function fetchWindData(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${opnKey}&units=metric`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const speedMs = data.wind.speed;
      const directionDeg = data.wind.deg;

      const speedKnots = (speedMs * 1.94384).toFixed(1);
      const directionCompass = degToCompass(directionDeg);

      document.getElementById('currentSpeed').textContent = `Speed: ${Math.round(speedKnots)} knots`;
      document.getElementById('currentDirection').textContent = `Direction: ${directionCompass}`;
    })
    .catch(err => console.error('Error:', err));
}

function degToCompass(deg) {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.floor((deg / 22.5) + 0.5) % 16;
  return directions[index];
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
};

// Initialize Windy API
windyInit(options, windyAPI => {
    // windyAPI is ready, and contain 'map', 'store',
    // 'picker' and other usefull stuff

    const { map } = windyAPI;
    // .map is instance of Leaflet map
});