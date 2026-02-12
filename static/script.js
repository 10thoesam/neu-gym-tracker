const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5);
let todayChart = null;

// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCurrent();
    loadTodayChart();
    loadHeatmap();
    loadStats();
    setInterval(loadCurrent, 120000);
});

// Current count
async function loadCurrent() {
    try {
        const res = await fetch('/api/current');
        if (!res.ok) return;
        const data = await res.json();

        let html = '';
        data.forEach(d => {
            let level, statusText;
            if (d.count < 30) { level = 'low'; statusText = 'Not Busy'; }
            else if (d.count < 60) { level = 'medium'; statusText = 'Moderate'; }
            else { level = 'high'; statusText = 'Busy'; }

            html += `
                <div class="location">
                    <h3>${d.location}</h3>
                    <span class="count-number">${d.count}</span>
                    <span class="count-label">people</span>
                    <div class="status-badge ${level}">${statusText}</div>
                </div>
            `;
        });
        document.getElementById('hero').innerHTML = html;

        const ts = new Date(data[0].timestamp);
        document.getElementById('last-updated').textContent =
            'Updated ' + ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
        console.error('Failed to load current:', err);
    }
}

// Today's chart
async function loadTodayChart() {
    try {
        const res = await fetch('/api/today');
        const data = await res.json();
        if (!data.length) return;

        const labels = data.map(d => {
            const t = new Date(d.timestamp);
            return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        const counts = data.map(d => d.count);

        const ctx = document.getElementById('todayChart').getContext('2d');
        if (todayChart) todayChart.destroy();

        todayChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Occupancy',
                    data: counts,
                    borderColor: '#c8102e',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(200, 16, 46, 0.1)',
                    pointRadius: 3,
                    pointBackgroundColor: '#c8102e',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (err) {
        console.error('Failed to load today chart:', err);
    }
}

// Heatmap
async function loadHeatmap() {
    try {
        const res = await fetch('/api/averages');
        const averages = await res.json();
        if (Object.keys(averages).length === 0) return;

        let maxVal = 0;
        for (const day in averages) {
            for (const hour in averages[day]) {
                maxVal = Math.max(maxVal, averages[day][hour]);
            }
        }

        let html = '<table><tr><th></th>';
        HOURS.forEach(h => {
            const label = h > 12 ? (h - 12) + 'p' : h + 'a';
            html += '<th>' + label + '</th>';
        });
        html += '</tr>';

        DAYS.forEach((day, i) => {
            html += '<tr><td style="text-align:right;padding-right:8px;font-weight:600;color:#71717a">' + day + '</td>';
            HOURS.forEach(hour => {
                const val = averages[i]?.[hour] || 0;
                const intensity = maxVal > 0 ? val / maxVal : 0;
                const r = Math.round(30 + intensity * 170);
                const g = Math.round(80 - intensity * 60);
                const b = Math.round(80 - intensity * 40);
                const a = 0.3 + intensity * 0.7;
                const color = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
                const textColor = intensity > 0.5 ? '#fff' : '#a1a1aa';
                html += '<td style="background:' + color + ';color:' + textColor + '">' + Math.round(val) + '</td>';
            });
            html += '</tr>';
        });
        html += '</table>';

        document.getElementById('heatmap').innerHTML = html;
    } catch (err) {
        console.error('Failed to load heatmap:', err);
    }
}

// Stats
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('stat-readings').textContent = data.total_readings || '—';
        document.getElementById('stat-avg').textContent = data.average_count || '—';
        document.getElementById('stat-peak').textContent = data.max_count || '—';
        document.getElementById('stat-low').textContent = data.min_count || '—';
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}