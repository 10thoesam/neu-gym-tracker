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
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const gymClosed = hour === 0 || (hour < 5) || (hour === 5 && minute < 30);

        if (gymClosed) {
            document.getElementById('hero').innerHTML = `
                <div class="location">
                    <h3>Marino Center</h3>
                    <span class="count-number">Closed</span>
                    <span class="count-label">Opens at 5:30 AM</span>
                </div>
            `;
            document.getElementById('last-updated').textContent = '';
            return;
        }

        const res = await fetch('/api/current');
        if (!res.ok) return;
        const data = await res.json();

        let html = '';
        data.forEach(d => {
            let level, statusText;
            let capacity = d.location.includes('1st Floor') ? 32 : 65;
            let percent = d.count / capacity;

            if (percent < 0.5) { level = 'low'; statusText = 'Not Busy'; }
            else if (percent < 0.8) { level = 'medium'; statusText = 'Moderate'; }
            else { level = 'high'; statusText = 'Busy'; }

            const shortName = d.location.includes('3rd Floor') ? '3rd Floor Weight Room' : '1st Floor Weight Room';

            html += `
                <div class="location">
                    <h3>${shortName}</h3>
                    <span class="count-number">${d.count}</span>
                    <span class="count-label">people</span>
                    <div class="status-badge ${level}">${statusText}</div>
                </div>
            `;
        });
        document.getElementById('hero').innerHTML = html;

        const ts = new Date(data[0].timestamp);
        document.getElementById('last-updated').innerHTML =
            '<span class="live-dot"></span>Updated ' + ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

        const floor3 = data.filter(d => d.location.includes('3rd Floor'));
        const floor1 = data.filter(d => d.location.includes('1st Floor'));

        const labels = floor3.map(d => {
            const t = new Date(d.timestamp);
            return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });

        const ctx = document.getElementById('todayChart').getContext('2d');
        if (todayChart) todayChart.destroy();

        todayChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '1st Floor',
                        data: floor1.map(d => d.count),
                        borderColor: '#eab308',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(234, 179, 8, 0.1)',
                        pointRadius: 2,
                        pointBackgroundColor: '#eab308',
                    },
                    {
                        label: '3rd Floor',
                        data: floor3.map(d => d.count),
                        borderColor: '#c8102e',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(200, 16, 46, 0.1)',
                        pointRadius: 2,
                        pointBackgroundColor: '#c8102e',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#71717a', font: { family: 'DM Sans' } }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#71717a', maxTicksLimit: 12 }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#71717a' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Failed to load today chart:', err);
    }
}

// Heatmap
async function loadHeatmap() {
    await buildHeatmap('3rd Floor Weight Room', 'heatmap-3rd');
    await buildHeatmap('1st Floor Weight Room', 'heatmap-1st');
}

async function buildHeatmap(location, elementId) {
    try {
        const res = await fetch('/api/averages?location=' + encodeURIComponent(location));
        const averages = await res.json();
        if (Object.keys(averages).length === 0) {
            document.getElementById(elementId).innerHTML = '<p style="color:#71717a;text-align:center;padding:20px;">Collecting data... check back in a few days</p>';
            return;
        }

        let maxVal = 0;
        for (const day in averages) {
            for (const hour in averages[day]) {
                maxVal = Math.max(maxVal, averages[day][hour]);
            }
        }

        const displayHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

        let html = '<table><tr><th></th>';
        displayHours.forEach(h => {
            let label;
            if (h === 12) label = '12p';
            else if (h > 12) label = (h - 12) + 'p';
            else label = h + 'a';
            html += '<th>' + label + '</th>';
        });
        html += '</tr>';

        DAYS.forEach((day, i) => {
            html += '<tr><td class="day-label">' + day + '</td>';
            displayHours.forEach(hour => {
                const val = averages[i]?.[hour] || 0;
                const intensity = maxVal > 0 ? val / maxVal : 0;

                let bg, textColor;
                if (val === 0) {
                    bg = 'rgba(255,255,255,0.03)';
                    textColor = '#3f3f46';
                } else {
                    const hue = 120 - (intensity * 120);
                    bg = 'hsla(' + hue + ', 70%, 40%, ' + (0.3 + intensity * 0.7) + ')';
                    textColor = intensity > 0.4 ? '#fff' : '#a1a1aa';
                }

                html += '<td style="background:' + bg + ';color:' + textColor + '">';
                html += val > 0 ? Math.round(val) : '-';
                html += '</td>';
            });
            html += '</tr>';
        });
        html += '</table>';

        document.getElementById(elementId).innerHTML = html;
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

// Prediction
async function fetchPrediction() {
    const day = document.getElementById('predict-day').value;
    const hour = document.getElementById('predict-hour').value;
    const resultEl = document.getElementById('predict-result');

    resultEl.textContent = 'Predicting...';

    try {
        const res = await fetch(`/api/predict?day=${day}&hour=${hour}`);
        const data = await res.json();

        if (res.ok) {
            let level, color;
            if (data.predicted_count < 30) { level = 'Not Busy'; color = '#22c55e'; }
            else if (data.predicted_count < 60) { level = 'Moderate'; color = '#eab308'; }
            else { level = 'Busy'; color = '#c8102e'; }

            resultEl.innerHTML = `
                <span style="color:${color}">${Math.round(data.predicted_count)} people</span>
                <span style="color:#71717a;font-size:13px;font-weight:400;margin-left:8px">${level} · based on ${data.based_on_readings} readings</span>
            `;
        } else {
            resultEl.innerHTML = '<span style="color:#71717a">Not enough data yet — check back after a few days</span>';
        }
    } catch (err) {
        resultEl.innerHTML = '<span style="color:#71717a">Failed to load prediction</span>';
    }
}