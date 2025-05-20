const API_KEY = "21160dd6-a6eb-4ba8-aa9b-fac6db020aa1";
const LAT = 49.2827;
const LON = -123.1207;

// Get current PST date string
function getPSTDate(offset = 0) {
  const now = new Date();
  const pstString = new Date(now.setDate(now.getDate() + offset)).toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  return new Date(pstString);
}

const todayPST = getPSTDate();
const yesterdayPST = getPSTDate(-1);
const todayStr = todayPST.toISOString().split("T")[0];
const yesterdayStr = yesterdayPST.toISOString().split("T")[0];

// ----------------------
// 7-DAY CHART
// ----------------------
fetch(`https://www.worldtides.info/api/v3?heights&lat=${LAT}&lon=${LON}&date=${todayStr}&days=7&datum=MLLW&key=${API_KEY}`)
  .then(res => {
    if (!res.ok) throw new Error("API error: " + res.status);
    return res.json();
  })
  .then(data => {
    if (!data.heights) throw new Error("Missing 'heights' in API response");

    const futureData = data.heights.filter(h => h.dt * 1000 > Date.now());
    const times = futureData.map(h => new Date(h.dt * 1000));
    const heights = futureData.map(h => h.height);
    const now = new Date();

    const startTime = new Date(times[0]);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(times[times.length - 1]);
    endTime.setHours(0, 0, 0, 0);

    const dayBreaks = [];
    for (let d = new Date(startTime); d <= endTime; d.setDate(d.getDate() + 1)) {
      dayBreaks.push(new Date(d));
    }

    const verticalLinePlugin = {
      id: 'verticalLines',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        ctx.save();

        // Now line
        const nowX = scales.x.getPixelForValue(now);
        if (nowX >= chartArea.left && nowX <= chartArea.right) {
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(nowX, chartArea.top);
          ctx.lineTo(nowX, chartArea.bottom);
          ctx.stroke();
        }

        // Day breaks
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        for (const day of dayBreaks) {
          const x = scales.x.getPixelForValue(day);
          if (x > chartArea.left && x < chartArea.right) {
            ctx.beginPath();
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    };

    new Chart(document.getElementById("tideChart"), {
      type: 'line',
      data: {
        labels: times,
        datasets: [{
          data: heights,
          fill: true,
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          borderColor: "rgba(0, 123, 255, 1)",
          pointRadius: 1,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              displayFormats: { hour: 'ccc ha' },
              tooltipFormat: 'ccc, LLL d, ha'
            },
            ticks: {
              color: "#ffffff",
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 14
            },
            grid: { display: false }
          },
          y: {
            title: {
              display: true,
              text: 'Meters',
              color: "#fff"
            },
            ticks: { color: "#fff" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'nearest',
            intersect: false,
            callbacks: {
              label: function(context) {
                const time = context.label;
                const height = context.raw.toFixed(2);
                return ` ${time} — ${height} m`;
              }
            },
            backgroundColor: "rgba(0,0,0,0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#ffffff",
            borderWidth: 1
          }
        }
      },
      plugins: [verticalLinePlugin]
    });
  })
  .catch(err => {
    console.error("Failed to load tide data:", err.message);
  });

// ----------------------
// TODAY SECTION (with fallback)
// ----------------------
const loadTodayTides = async () => {
  async function fetchTideData(dateStr) {
    const res = await fetch(`https://www.worldtides.info/api/v3?heights&lat=${LAT}&lon=${LON}&date=${dateStr}&days=1&datum=MLLW&key=${API_KEY}`);
    const data = await res.json();
    return data.heights || [];
  }

  // Try today
  let heights = await fetchTideData(todayStr);

  if (!heights || heights.length === 0) {
    console.warn("No data for today, using yesterday.");
    heights = await fetchTideData(yesterdayStr);
  }

  renderTodayChart(heights);
};

function renderTodayChart(heights) {
  if (!heights || heights.length === 0) {
    document.getElementById("todayStats").innerHTML = `<p>No tide data available.</p>`;
    return;
  }

  const labels = heights.map(h => new Date(h.dt * 1000));
  const values = heights.map(h => h.height);

  const ctx = document.getElementById("todayChart").getContext("2d");
  if (window.todayChart instanceof Chart) window.todayChart.destroy();

  window.todayChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        fill: true,
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        borderColor: "rgba(0, 123, 255, 1)",
        pointRadius: 1,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            displayFormats: { hour: 'ha' }
          },
          ticks: { color: "#fff" },
          grid: { display: false }
        },
        y: {
          title: {
            display: true,
            text: 'Meters',
            color: "#fff"
          },
          ticks: { color: "#fff" },
          grid: {
            color: "rgba(255,255,255,0.1)"
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              new Date(ctx.label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
              ` — ${ctx.raw.toFixed(2)} m`
          }
        }
      }
    }
  });

  // Stats
  const max = Math.max(...values);
  const min = Math.min(...values);
  const highs = heights.filter(h => h.height === max);
  const lows = heights.filter(h => h.height === min);

  const formatTime = (t) =>
    new Date(t.dt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  document.getElementById("todayStats").innerHTML = `
    <p>High: </p><strong>${highs.map(formatTime).join(", ")} — ${max.toFixed(2)} m</strong>
    <p>Low: </p><strong>${lows.map(formatTime).join(", ")} — ${min.toFixed(2)} m</strong>
  `;
}

loadTodayTides();
