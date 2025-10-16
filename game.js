// game.js - PickTheAppliance: Select two closest stations
let map;
try {
    map = L.map('map').setView([-38.07, 145.30], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
} catch (error) {
    alert('Map failed to initialize: ' + error.message);
}

let emergencyMarker, stationMarkers = [];
let currentStations = [], emergencyPos;
let selectedStations = [];  // Track user's two selections
let score = 0, round = 1;
const maxRounds = 5;

// Your real fire stations
const realStations = [
    { name: 'FRV 88 Hallam Fire Station', lat: -38.004075, lon: 145.274025 },
    { name: 'Devon Meadows Fire Station', lat: -38.158238, lon: 145.301785 },
    { name: 'FRV 92 Cranbourne Fire Station', lat: -38.103696, lon: 145.284140 },
    { name: 'Narre Warren Fire Station', lat: -38.057891, lon: 145.300831 },
    { name: 'Hampton Park Fire Station', lat: -38.031041, lon: 145.258489 },
    { name: 'Clyde North Fire Station', lat: -38.091732, lon: 145.340497 },
    { name: 'Berwick Fire Station', lat: -38.037256, lon: 145.344073 }
];

// Fixed bounds from ALL stations
const allLats = realStations.map(s => s.lat);
const allLons = realStations.map(s => s.lon);
const fixedMinLat = Math.min(...allLats);
const fixedMaxLat = Math.max(...allLats);
const fixedMinLon = Math.min(...allLons);
const fixedMaxLon = Math.max(...allLons);

// Icons
const fireIcon = L.icon({
    iconUrl: 'images/fire.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});
const stationIcon = L.icon({
    iconUrl: 'images/station.png',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
});

function startRound() {
    // Clear old
    if (emergencyMarker) emergencyMarker.remove();
    stationMarkers.forEach(m => m.remove());
    stationMarkers = [];
    selectedStations = [];  // Reset selections
    currentStations = realStations;  // All 7

    // Random emergency
    emergencyPos = [
        fixedMinLat + Math.random() * (fixedMaxLat - fixedMinLat),
        fixedMinLon + Math.random() * (fixedMaxLon - fixedMinLon)
    ];

    // Add emergency
    emergencyMarker = L.marker(emergencyPos, { icon: fireIcon }).addTo(map)
        .bindPopup('Fire Emergency! Select the two closest stations.').openPopup();

    // Add stations (clickable)
    currentStations.forEach((station) => {
        let pos = [station.lat, station.lon];
        let marker = L.marker(pos, { icon: stationIcon }).addTo(map)
            .bindPopup(`${station.name}`);
        marker.on('click', () => handleStationClick(pos, station.name, marker));
        stationMarkers.push(marker);
    });

    // Tight zoom
    let group = new L.featureGroup([emergencyMarker, ...stationMarkers]);
    map.fitBounds(group.getBounds().pad(0.2));

    document.getElementById('info').innerText = `Round ${round}: Select the TWO closest fire stations to the emergency (click one, then the next).`;
}

function handleStationClick(selectedPos, stationName, marker) {
    if (selectedStations.length >= 2) return;  // Already selected two

    // Add to selections and disable marker
    selectedStations.push({ pos: selectedPos, name: stationName });
    marker.setOpacity(0.5);  // Visual feedback: Fade selected
    marker.off('click');  // Disable further clicks

    if (selectedStations.length === 2) {
        // Done selecting: Check vs actual two closest
        checkSelections();
    } else {
        alert(`Selected ${stationName} as #${selectedStations.length}. Now pick the next closest.`);
    }
}

function checkSelections() {
    // Calculate all straight-line distances
    let distanceMap = currentStations.map(s => ({
        name: s.name,
        pos: [s.lat, s.lon],
        dist: L.latLng(emergencyPos).distanceTo(L.latLng([s.lat, s.lon]))
    }));
    distanceMap.sort((a, b) => a.dist - b.dist);  // Sort closest first
    const actualClosest = distanceMap.slice(0, 2).map(s => s.name).sort().join(',');  // Top 2 names

    // User's selections (check names match, any order)
    const userNames = selectedStations.map(sel => sel.name).sort().join(',');
    const isCorrect = userNames === actualClosest;

    // Scoring
    let roundScore = 0;
    if (isCorrect) {
        const avgUserDist = selectedStations.reduce((sum, sel) => sum + L.latLng(emergencyPos).distanceTo(L.latLng(sel.pos)), 0) / 2;
        roundScore = Math.max(0, 100 - Math.floor(avgUserDist / 100)) + 20;  // Bonus for correct
        alert(`Correct! The two closest are ${actualClosest}. Round score: ${roundScore}`);
    } else {
        roundScore = -50;  // Penalty
        alert(`No Radar!! – Wrong! The two closest are ${actualClosest}.`);
    }
    score += roundScore;
    document.getElementById('score').innerText = `Score: ${score}`;

    round++;
    if (round > maxRounds) alert(`Game Over! Total Score: ${score}. Thanks for playing!`);
    else startRound();
}

// Start after delay
setTimeout(() => {
    if (map) {
        startRound();
    } else {
        alert('Map not ready. Refresh and check internet.');
    }
}, 1500);