// Initialize Leaflet Map
const map = L.map('map').setView([12.9716, 77.5946], 12); // Centered on Bengaluru

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

let originMarker, destinationMarker;
let searchHistory = [];  // Array to store search history

// Click event for marking origin and destination on map
let clickCounter = 0;
map.on('click', function (e) {
  if (clickCounter % 2 === 0) {
    if (originMarker) map.removeLayer(originMarker);
    originMarker = L.marker(e.latlng).addTo(map).bindPopup("Origin").openPopup();
    document.getElementById('lat1').value = e.latlng.lat;
    document.getElementById('lng1').value = e.latlng.lng;
  } else {
    if (destinationMarker) map.removeLayer(destinationMarker);
    destinationMarker = L.marker(e.latlng).addTo(map).bindPopup("Destination").openPopup();
    document.getElementById('lat2').value = e.latlng.lat;
    document.getElementById('lng2').value = e.latlng.lng;
  }
  clickCounter++;
});

// Find Path Button Click Handler
document.getElementById('findPathBtn').addEventListener('click', async () => {
  const lat1 = parseFloat(document.getElementById('lat1').value);
  const lng1 = parseFloat(document.getElementById('lng1').value);
  const lat2 = parseFloat(document.getElementById('lat2').value);
  const lng2 = parseFloat(document.getElementById('lng2').value);

  if (!lat1 || !lng1 || !lat2 || !lng2) {
    alert('Please enter both origin and destination coordinates.');
    return;
  }

  // Call OSRM or GraphHopper API for shortest path
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`);
  const data = await response.json();

  if (data.routes && data.routes.length > 0) {
    const pathCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    L.polyline(pathCoords, { color: 'blue' }).addTo(map);

    // Save the search to history
    const searchData = {
      origin: { lat: lat1, lng: lng1 },
      destination: { lat: lat2, lng: lng2 },
      path: pathCoords,
    };
    searchHistory.push(searchData);
    updateSearchHistoryDropdown();
  } else {
    alert('Failed to find a path.');
  }
});

// Function to update search history dropdown
function updateSearchHistoryDropdown() {
  const searchHistoryDropdown = document.getElementById('searchHistory');
  searchHistoryDropdown.innerHTML = '<option value="">Select a previous search</option>';  // Clear previous options

  searchHistory.forEach((search, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.text = `Search ${index + 1}: Origin (${search.origin.lat}, ${search.origin.lng}) - Destination (${search.destination.lat}, ${search.destination.lng})`;
    searchHistoryDropdown.appendChild(option);
  });
}

// Handle selecting a previous search from the history dropdown
document.getElementById('searchHistory').addEventListener('change', (event) => {
  const selectedIndex = event.target.value;
  if (selectedIndex !== "") {
    const selectedSearch = searchHistory[selectedIndex];
    map.setView([selectedSearch.origin.lat, selectedSearch.origin.lng], 12);

    // Clear previous markers
    if (originMarker) map.removeLayer(originMarker);
    if (destinationMarker) map.removeLayer(destinationMarker);

    // Add markers for selected search
    originMarker = L.marker([selectedSearch.origin.lat, selectedSearch.origin.lng]).addTo(map).bindPopup("Origin").openPopup();
    destinationMarker = L.marker([selectedSearch.destination.lat, selectedSearch.destination.lng]).addTo(map).bindPopup("Destination").openPopup();

    // Draw the path
    L.polyline(selectedSearch.path, { color: 'blue' }).addTo(map);
  }
});
