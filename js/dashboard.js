// dashboard.js - KECHY KDS Dashboard Logic (Sunum Modu)
// - Backend: /api/products, /api/sales-history
// - Filo/ihlal/yakıt: simülasyon (sunum için deterministik)

const API_BASE = 'http://localhost:3000/api';
const REFRESH_INTERVAL = 30000; // 30 saniye

let map;
let fleetData = [];
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    showLoading(true);
    try {
        initMap();
        setupEventListeners();
        await updateDashboardData();
        setInterval(updateDashboardData, REFRESH_INTERVAL);
    } finally {
        showLoading(false);
    }
});

async function updateDashboardData() {
    const now = new Date();
    try {
        const [products, salesData] = await Promise.all([
            fetchJSON('/products'),
            fetchJSON('/sales-history')
        ]);

        // 1) Filo + ihlal simülasyonu
        fleetData = simulateFleet(20, now);
        const violations = simulateViolations(fleetData, products, now);

        // 2) KPI
        const kpiData = buildKPIs(salesData, fleetData, violations);

        // 3) Grafik veri setleri
        const demandSeries = buildMonthlyDemandSeries(salesData);
        const fuelSeries = buildFuelSeries(fleetData);

        updateKPIs(kpiData);
        updateMap(fleetData);
        updateCharts(kpiData, fuelSeries, violations, demandSeries);
        updateTables(fleetData, violations);

        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) lastUpdatedEl.innerText = now.toLocaleTimeString('tr-TR');
    } catch (error) {
        console.error('Dashboard veri güncelleme hatası:', error);
    }
}

async function fetchJSON(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    return await res.json();
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function simulateFleet(count, now) {
    // Ege bölgesi sınırları
    const bounds = { minLat: 36.8, maxLat: 40.2, minLng: 26.0, maxLng: 29.9 };
    const depots = [
        { name: 'İzmir - Bornova', lat: 38.46, lng: 27.22 },
        { name: 'Manisa - Merkez', lat: 38.62, lng: 27.43 },
        { name: 'Aydın - Efeler', lat: 37.85, lng: 27.84 },
        { name: 'Denizli - Merkez', lat: 37.77, lng: 29.09 },
        { name: 'Muğla - Bodrum', lat: 37.03, lng: 27.43 }
    ];
    const drivers = [
        { first: 'Mehmet', last: 'Yılmaz' },
        { first: 'Ali', last: 'Demir' },
        { first: 'Ahmet', last: 'Kaya' },
        { first: 'Mustafa', last: 'Öz' },
        { first: 'Hasan', last: 'Şahin' },
        { first: 'İbrahim', last: 'Çelik' },
        { first: 'Osman', last: 'Arslan' }
    ];

    const seed = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`);
    const rng = mulberry32(seed);

    const fleet = [];
    for (let i = 0; i < count; i++) {
        const depot = pick(rng, depots);
        const driver = pick(rng, drivers);
        const tempBase = -18 + (rng() - 0.5) * 2; // -19..-17
        const tempDrift = (rng() - 0.5) * 6; // ihlal olasılığı için
        const temperature = parseFloat((tempBase + tempDrift).toFixed(1));
        const status = temperature > -15 ? 'RISK' : 'ACTIVE';

        const lat = clamp(depot.lat + (rng() - 0.5) * 0.35, bounds.minLat, bounds.maxLat);
        const lng = clamp(depot.lng + (rng() - 0.5) * 0.35, bounds.minLng, bounds.maxLng);

        fleet.push({
            plate_number: `35 KCH ${String(100 + i)}`,
            first_name: driver.first,
            last_name: driver.last,
            depot_name: depot.name,
            current_location: depot.name,
            status,
            temperature_c: temperature,
            latitude: lat,
            longitude: lng,
            fuel_l_100km: parseFloat((26 + rng() * 10).toFixed(1))
        });
    }
    return fleet;
}

function simulateViolations(fleet, products, now) {
    const rng = mulberry32(now.getDate() * 1000 + now.getMonth() + 7);
    const categories = (products || []).map(p => p.category).filter(Boolean);
    const safeCategories = categories.length ? categories : ['Dondurulmuş', 'Süt Ürünleri', 'Taze Sebze', 'Taze Balık'];

    const violators = fleet
        .filter(v => v.status === 'RISK')
        .slice(0, 6);

    return violators.map((v, idx) => {
        const target = -18;
        const amount = Math.max(0, v.temperature_c - target);
        return {
            vehicle_plate: v.plate_number,
            product_category: pick(rng, safeCategories),
            temperature_c: v.temperature_c,
            violation_amount: amount,
            timestamp: new Date(now.getTime() - (idx + 1) * 7 * 60 * 1000).toISOString()
        };
    });
}

function buildKPIs(salesData, fleet, violations) {
    const revenue = (salesData || []).reduce((sum, r) => sum + (Number(r.sales) || 0), 0);
    const activeVehicles = fleet.filter(v => v.status === 'ACTIVE').length;
    const otifRate = clamp(92 + (fleet.length ? (activeVehicles / fleet.length) * 6 : 0), 85, 99.5);
    return {
        revenue: { current: revenue, target: 500000 },
        activeVehicles,
        violations: { count: (violations || []).length },
        otif: { rate: parseFloat(otifRate.toFixed(1)) }
    };
}

function buildMonthlyDemandSeries(salesData) {
    // sales_history: date, sales
    const byMonth = new Map(); // YYYY-MM -> sum
    for (const r of (salesData || [])) {
        const d = new Date(r.date);
        if (Number.isNaN(d.getTime())) continue;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        byMonth.set(key, (byMonth.get(key) || 0) + (Number(r.sales) || 0));
    }
    const entries = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
    const last = entries.slice(-6);
    return last.map(([key, total]) => ({
        month: key,
        total_demand: total
    }));
}

function buildFuelSeries(fleet) {
    return fleet
        .slice()
        .sort((a, b) => b.fuel_l_100km - a.fuel_l_100km)
        .slice(0, 5)
        .map(v => ({
            plate_number: v.plate_number,
            real_consumption_avg: v.fuel_l_100km
        }));
}

// --- UI Updates ---
function updateKPIs(data) {
    // Helper to animate numbers
    const animateValue = (id, end, suffix = '') => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = end.toLocaleString('tr-TR') + suffix;
    };

    animateValue('kpi-revenue', data.revenue.current, ' ₺');
    animateValue('kpi-active-vehicles', data.activeVehicles);
    animateValue('kpi-violations', data.violations.count);
    animateValue('kpi-otif', data.otif.rate, '%');

    // Trend Indicators
    document.getElementById('otif-trend').innerHTML =
        data.otif.rate >= 95 ? '<span class="text-success"><i class="fas fa-arrow-up"></i> Hedef Üstü</span>' :
            '<span class="text-warning"><i class="fas fa-minus"></i> İyileştirilmeli</span>';
}

function updateTables(fleet, violations) {
    // 1. Kritik İhlaller Tablosu
    const violationBody = document.getElementById('violation-tbody');
    violationBody.innerHTML = violations.slice(0, 5).map(v => `
        <tr>
            <td><span class="badge bg-danger">${v.vehicle_plate}</span></td>
            <td>${v.product_category}</td>
            <td>${v.temperature_c}°C</td>
            <td><small class="text-danger">+${v.violation_amount.toFixed(1)}°C</small></td>
            <td>${new Date(v.timestamp).toLocaleTimeString()}</td>
        </tr>
    `).join('');

    // 2. Aktif Filo Tablosu
    const fleetBody = document.getElementById('fleet-tbody');
    fleetBody.innerHTML = fleet.slice(0, 10).map(v => `
        <tr>
            <td class="fw-bold">${v.plate_number}</td>
            <td>${v.first_name || '-'} ${v.last_name || '-'}</td>
            <td>${v.current_location || v.depot_name || 'Yolda'}</td>
            <td>
                <span class="${v.temperature_c > -18 ? 'text-danger fw-bold' : 'text-success'}">
                    ${v.temperature_c ? v.temperature_c + '°C' : '-'}
                </span>
            </td>
            <td>
                <span class="badge ${v.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'}">
                    ${v.status}
                </span>
            </td>
        </tr>
    `).join('');
}

// --- Charts ---
function updateCharts(kpi, fuel, thermal, demand) {
    // 1. Gelir/Hedef Grafiği (Doughnut)
    updateChart('revenueChart', 'doughnut', {
        labels: ['Gerçekleşen', 'Kalan Hedef'],
        datasets: [{
            data: [kpi.revenue.current, Math.max(0, kpi.revenue.target - kpi.revenue.current)],
            backgroundColor: ['#1cc88a', '#2d3748'],
            borderWidth: 0
        }]
    });

    // 2. Mevsimsel Talep Analizi (Line)
    updateChart('demandChart', 'line', {
        labels: demand.map(d => d.month),
        datasets: [{
            label: 'Talep (Adet)',
            data: demand.map(d => d.total_demand),
            borderColor: '#4e73df',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(78, 115, 223, 0.1)'
        }]
    });

    // 3. Yakıt Tüketim Analizi (Bar)
    updateChart('fuelChart', 'bar', {
        labels: fuel.slice(0, 5).map(f => f.plate_number),
        datasets: [{
            label: 'Tüketim (L/100km)',
            data: fuel.slice(0, 5).map(f => f.real_consumption_avg),
            backgroundColor: fuel.slice(0, 5).map(f => f.real_consumption_avg > 32 ? '#e74a3b' : '#36b9cc')
        }]
    });
}

function updateChart(canvasId, type, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Destroy existing
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: data,
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { labels: { color: '#e2e8f0' } }
            },
            scales: type !== 'doughnut' ? {
                y: { grid: { color: '#2d3748' }, ticks: { color: '#858796' } },
                x: { grid: { display: false }, ticks: { color: '#858796' } }
            } : {}
        }
    });
}

// --- Maps ---
function initMap() {
    map = L.map('map', {
        center: [38.4, 27.6], // Ege
        zoom: 7,
        zoomControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // sabitle
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.touchZoom.disable();
}

function updateMap(vehicles) {
    // Clear existing markers (Basic implementation)
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    const truckIcon = L.divIcon({
        html: '<i class="fas fa-truck text-white" style="font-size: 1.2rem;"></i>',
        className: 'marker-icon',
        iconSize: [20, 20]
    });

    vehicles.forEach(v => {
        if (v.latitude && v.longitude) {
            const popup = `
                <div class="text-dark p-2">
                    <strong>${v.plate_number}</strong><br>
                    Sürücü: ${v.first_name} ${v.last_name}<br>
                    Sıcaklık: <b>${v.temperature_c}°C</b>
                </div>
            `;
            L.marker([v.latitude, v.longitude], { icon: truckIcon })
                .bindPopup(popup)
                .addTo(map);
        }
    });
}

// --- Utils ---
function showLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function setupEventListeners() {
    // Rapor İndirme Butonları
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const reportType = e.currentTarget?.dataset?.report || 'genel';
            generateReport(reportType);
        });
    });
}

// Rapor Fonksiyonu (Simüle Edilmiş PDF İndirme)
function generateReport(type) {
    // Sunum modu: kullanıcıyı popup ile bölmeyelim.
    // İleride backend'den PDF stream edilebilir.
    console.info(`[Rapor] ${String(type).toUpperCase()} raporu oluşturma isteği (demo).`);
}
