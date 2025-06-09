// Global variables
let map;
let markers = [];
let solarData = [];
let filteredData = [];
let markersLayer;

// Function to fetch solar data from JSON file
async function loadSolarData() {
  try {
    const response = await fetch('solar_radiance_sample.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Could not load solar data:", error);
    // You could display an error message to the user here
    return []; // Return empty array on error
  }
}

// Utility functions
function getMarkerColor(solarClass) {
  switch (solarClass) {
    case 'High': return '#e74c3c';
    case 'Medium': return '#f39c12';
    case 'Low': return '#f1c40f';
    default: return '#95a5a6';
  }
}

function createCustomIcon(solarClass) {
  const color = getMarkerColor(solarClass);
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
    className: 'custom-marker'
  });
}

function createPopupContent(point) {
  return `
    <div class="popup-title">${point.city}</div>
    <div class="popup-metrics">
      <div class="popup-metric">
        <div class="popup-metric-label">PVOUT</div>
        <div class="popup-metric-value">${point.pvout_daily} kWh/m²/day</div>
      </div>
      <div class="popup-metric">
        <div class="popup-metric-label">GHI</div>
        <div class="popup-metric-value">${point.ghi_daily} kWh/m²/day</div>
      </div>
      <div class="popup-metric">
        <div class="popup-metric-label">DNI</div>
        <div class="popup-metric-value">${point.dni_daily} kWh/m²/day</div>
      </div>
      <div class="popup-metric">
        <div class="popup-metric-label">DHI</div>
        <div class="popup-metric-value">${point.dhi_daily} kWh/m²/day</div>
      </div>
    </div>
    <div class="popup-details">
      <strong>Region:</strong> ${point.region}<br>
      <strong>Solar Class:</strong> ${point.solar_class}<br>
      <strong>Data Quality:</strong> ${point.data_quality}<br>
      <strong>Elevation:</strong> ${point.elevation}m<br>
      <strong>Temperature:</strong> ${point.air_temperature}°C<br>
      <strong>Sunshine Hours:</strong> ${point.sunshine_hours}/day<br>
      <strong>Coordinates:</strong> ${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}
    </div>
    <div class="popup-actions">
      <button class="popup-btn" onclick="zoomToLocation(${point.latitude}, ${point.longitude})">Zoom Here</button>
    </div>
  `;
}

// Map functions
function initializeMap() {
  console.log('Initializing map...');
  
  map = L.map('map', {
    center: [51.5014, -0.1419], // Centered on Westminster
    zoom: 13, // Zoomed in to the city level
    minZoom: 2,
    maxZoom: 18
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  
  console.log('Map initialized successfully');
}

function addMarkersToMap(data) {
  console.log('Adding markers to map:', data.length, 'points');
  
  markersLayer.clearLayers();
  markers = [];

  data.forEach((point, index) => {
    try {
      const icon = createCustomIcon(point.solar_class);
      const marker = L.marker([point.latitude, point.longitude], { icon })
        .bindPopup(createPopupContent(point), {
          maxWidth: 300,
          className: 'custom-popup'
        });
      
      marker.solarData = point;
      markers.push(marker);
      markersLayer.addLayer(marker);
      
      console.log(`Added marker ${index + 1}: ${point.city} (${point.solar_class})`);
    } catch (error) {
      console.error(`Error adding marker for ${point.city}:`, error);
    }
  });
  
  console.log(`Successfully added ${markers.length} markers to map`);
}

function zoomToLocation(lat, lng) {
  map.setView([lat, lng], 10);
}

// Filter functions
function getActiveFilters() {
  const filters = {
    solarClasses: [],
    region: document.getElementById('region-filter').value,
    dataQuality: document.getElementById('quality-filter').value,
    pvoutMax: parseFloat(document.getElementById('pvout-range').value),
    searchTerm: document.getElementById('search').value.toLowerCase()
  };

  // Get checked solar classes
  document.querySelectorAll('.filter-checkbox[data-filter="solar-class"]:checked').forEach(cb => {
    filters.solarClasses.push(cb.value);
  });

  return filters;
}

function applyFilters() {
  console.log('Applying filters...');
  
  const filters = getActiveFilters();
  console.log('Active filters:', filters);
  
  filteredData = solarData.filter(point => {
    // Solar class filter
    if (filters.solarClasses.length > 0 && !filters.solarClasses.includes(point.solar_class)) {
      return false;
    }

    // Region filter
    if (filters.region && point.region !== filters.region) {
      return false;
    }

    // Data quality filter
    if (filters.dataQuality && point.data_quality !== filters.dataQuality) {
      return false;
    }

    // PVOUT range filter
    if (point.pvout_daily > filters.pvoutMax) {
      return false;
    }

    // Search filter
    if (filters.searchTerm && !point.city.toLowerCase().includes(filters.searchTerm)) {
      return false;
    }

    return true;
  });

  console.log(`Filtered data: ${filteredData.length} points`);
  
  addMarkersToMap(filteredData);
  updateStatistics();
  updateDataTable();
}

function clearFilters() {
  console.log('Clearing all filters...');
  
  // Reset checkboxes
  document.querySelectorAll('.filter-checkbox[data-filter="solar-class"]').forEach(cb => {
    cb.checked = true;
  });

  // Reset selects
  document.getElementById('region-filter').value = '';
  document.getElementById('quality-filter').value = '';

  // Reset range
  document.getElementById('pvout-range').value = 7;
  document.getElementById('pvout-value').textContent = '7.0';

  // Reset search
  document.getElementById('search').value = '';

  applyFilters();
}

// Statistics functions
function calculateStatistics(data) {
  if (data.length === 0) {
    return {
      totalLocations: 0,
      avgPVOUT: 0,
      highestPVOUT: 0,
      lowestPVOUT: 0
    };
  }

  const pvoutValues = data.map(point => point.pvout_daily);
  const totalLocations = data.length;
  const avgPVOUT = pvoutValues.reduce((sum, val) => sum + val, 0) / totalLocations;
  const highestPVOUT = Math.max(...pvoutValues);
  const lowestPVOUT = Math.min(...pvoutValues);

  return {
    totalLocations,
    avgPVOUT: avgPVOUT.toFixed(2),
    highestPVOUT: highestPVOUT.toFixed(2),
    lowestPVOUT: lowestPVOUT.toFixed(2)
  };
}

function updateStatistics() {
  const stats = calculateStatistics(filteredData);
  
  // Update sidebar summary
  const visibleCountEl = document.getElementById('visible-count');
  const avgPvoutEl = document.getElementById('avg-pvout');
  
  if (visibleCountEl) visibleCountEl.textContent = stats.totalLocations;
  if (avgPvoutEl) avgPvoutEl.textContent = `${stats.avgPVOUT} kWh/m²/day`;

  // Update right sidebar statistics
  const totalLocationsEl = document.getElementById('total-locations');
  const avgGlobalPvoutEl = document.getElementById('avg-global-pvout');
  const highestPvoutEl = document.getElementById('highest-pvout');
  
  if (totalLocationsEl) totalLocationsEl.textContent = stats.totalLocations;
  if (avgGlobalPvoutEl) avgGlobalPvoutEl.textContent = stats.avgPVOUT;
  if (highestPvoutEl) highestPvoutEl.textContent = stats.highestPVOUT;
}

// Tab functions
function switchTab(tabName) {
  console.log('Switching to tab:', tabName);
  
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('tab-content--active');
  });

  // Remove active class from all nav tabs
  document.querySelectorAll('.nav__tab').forEach(tab => {
    tab.classList.remove('nav__tab--active');
  });

  // Show selected tab content
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.add('tab-content--active');
  }

  // Add active class to selected nav tab
  const selectedNavTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedNavTab) {
    selectedNavTab.classList.add('nav__tab--active');
  }

  // If switching to table tab, update the table
  if (tabName === 'table') {
    updateDataTable();
  }
  
  // If switching back to map tab, invalidate map size
  if (tabName === 'map' && map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}

// Table functions
function updateDataTable() {
  const tableBody = document.getElementById('table-body');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';

  filteredData.forEach(point => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${point.city}</td>
      <td>${point.region}</td>
      <td>${point.pvout_daily}</td>
      <td>${point.ghi_daily}</td>
      <td>${point.dni_daily}</td>
      <td><span class="solar-class-${point.solar_class.toLowerCase()}">${point.solar_class}</span></td>
      <td>${point.data_quality}</td>
      <td>${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function sortTable(column) {
  const table = document.getElementById('solar-table');
  const header = document.querySelector(`[data-sort="${column}"]`);
  if (!header) return;
  
  const isAscending = !header.classList.contains('sort-asc');

  // Remove sort classes from all headers
  document.querySelectorAll('.sortable').forEach(h => {
    h.classList.remove('sort-asc', 'sort-desc');
  });

  // Add appropriate class to current header
  header.classList.add(isAscending ? 'sort-asc' : 'sort-desc');

  // Sort the data
  filteredData.sort((a, b) => {
    let valueA = a[column];
    let valueB = b[column];

    // Handle numeric columns
    if (typeof valueA === 'number') {
      return isAscending ? valueA - valueB : valueB - valueA;
    }

    // Handle string columns
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();

    if (valueA < valueB) return isAscending ? -1 : 1;
    if (valueA > valueB) return isAscending ? 1 : -1;
    return 0;
  });

  updateDataTable();
}

// Export function
function exportToCSV() {
  console.log('Exporting CSV...');
  
  const headers = ['City', 'Region', 'PVOUT (kWh/m²/day)', 'GHI (kWh/m²/day)', 'DNI (kWh/m²/day)', 'DHI (kWh/m²/day)', 'Solar Class', 'Data Quality', 'Latitude', 'Longitude', 'Elevation (m)', 'Air Temperature (°C)', 'Sunshine Hours'];
  
  const csvContent = [
    headers.join(','),
    ...filteredData.map(point => [
      `"${point.city}"`,
      `"${point.region}"`,
      point.pvout_daily,
      point.ghi_daily,
      point.dni_daily,
      point.dhi_daily,
      `"${point.solar_class}"`,
      `"${point.data_quality}"`,
      point.latitude,
      point.longitude,
      point.elevation,
      point.air_temperature,
      point.sunshine_hours
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'solar_radiance_data.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  console.log('CSV export completed');
}

// Search function
function setupSearch() {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;
  
  let searchTimeout;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFilters();
    }, 300);
  });
}

// Responsive sidebar functions
function toggleSidebar(sidebar) {
  sidebar.classList.toggle('sidebar--open');
}

function setupResponsiveSidebars() {
  if (window.innerWidth <= 1024) {
    document.querySelectorAll('.sidebar__toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const sidebar = e.target.closest('.sidebar');
        toggleSidebar(sidebar);
      });
    });
  }
}

// Event listeners setup
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Tab navigation
  document.querySelectorAll('.nav__tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const tabName = e.target.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Filter controls
  const applyFiltersBtn = document.getElementById('apply-filters');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);

  // PVOUT range slider
  const pvoutRange = document.getElementById('pvout-range');
  const pvoutValue = document.getElementById('pvout-value');
  
  if (pvoutRange && pvoutValue) {
    pvoutRange.addEventListener('input', (e) => {
      pvoutValue.textContent = parseFloat(e.target.value).toFixed(1);
    });

    pvoutRange.addEventListener('change', applyFilters);
  }

  // Filter checkboxes and selects
  document.querySelectorAll('.filter-checkbox, .filter-select').forEach(control => {
    control.addEventListener('change', applyFilters);
  });

  // Map controls
  const resetViewBtn = document.getElementById('reset-view');
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', () => {
      map.setView([51.5014, -0.1419], 13); // Reset to Westminster
    });
  }

  // Table sorting
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', (e) => {
      const sortColumn = e.target.getAttribute('data-sort');
      sortTable(sortColumn);
    });
  });

  // Export CSV
  const exportCsvBtn = document.getElementById('export-csv');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  // Search functionality
  setupSearch();

  // Responsive sidebar toggles
  setupResponsiveSidebars();

  // Window resize handler
  window.addEventListener('resize', () => {
    setupResponsiveSidebars();
    if (map) {
      map.invalidateSize();
    }
  });
  
  console.log('Event listeners setup completed');
}

// Initialization
function showLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}

// Main application initialization
async function initializeApp() {
  showLoading();
  solarData = await loadSolarData();
  
  // Exit if data loading failed
  if (solarData.length === 0) {
    hideLoading();
    // Optionally, display a more prominent error message on the page
    alert("Failed to load solar data. Please check the console for details and try again later.");
    return;
  }

  filteredData = [...solarData];

  initializeMap();
  addMarkersToMap(solarData);
  updateStatistics();
  updateDataTable();
  setupEventListeners();
  setupResponsiveSidebars();
  
  hideLoading();
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, starting application...');
  // Small delay to show loading animation
  setTimeout(initializeApp, 500);
});

// Global functions for popup actions
window.zoomToLocation = zoomToLocation;