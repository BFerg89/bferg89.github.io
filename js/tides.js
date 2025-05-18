
  const API_KEY = "21160dd6-a6eb-4ba8-aa9b-fac6db020aa1";
  const LAT = 49.2827;
  const LON = -123.1207;
  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  fetch(`https://www.worldtides.info/api/v3?heights&lat=${LAT}&lon=${LON}&date=${todayDateStr}&days=7&datum=MLLW&key=${API_KEY}`)
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
        startTime.setHours(0, 0, 0, 0); // Round to midnight

        const endTime = new Date(times[times.length - 1]);
        endTime.setHours(0, 0, 0, 0);

        const dayBreaks = [];
        for (let d = new Date(startTime); d <= endTime; d.setDate(d.getDate() + 1)) {
        dayBreaks.push(new Date(d)); // clone to avoid mutation
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
                    displayFormats: {
                    hour: 'ccc ha' // e.g. "Mon 3PM"
                    },
                    tooltipFormat: 'ccc, LLL d, ha'
                },
                ticks: {
                    color: "#ffffff",
                    maxRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 14 // Adjust lower if still too busy (try 10 or 12)
                },
                grid: {
                    display: false
                }
                },
            y: {
              title: {
                display: true,
                text: 'Meters',
                color: "#fff"
              },
              ticks: {
                color: "#fff"
              },
              grid: {
                color: "rgba(255,255,255,0.1)"
              }
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

    const loadTodayTides = async () => {

    const res = await fetch(`https://www.worldtides.info/api/v3?heights&lat=${LAT}&lon=${LON}&date=${todayDateStr}&days=1&datum=MLLW&key=${API_KEY}`);
    const data = await res.json();

    const heightsToday = data.heights
      .filter(h => new Date(h.dt * 1000).getDate() === today.getDate());

    const labels = heightsToday.map(h => new Date(h.dt * 1000));
    const values = heightsToday.map(h => h.height);

    // Create mini chart
    new Chart(document.getElementById("todayChart"), {
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

    // Determine highs and lows
    const highs = heightsToday.filter(h => h.height === Math.max(...values));
    const lows = heightsToday.filter(h => h.height === Math.min(...values));

    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const format = (t) => new Date(t.dt * 1000).toLocaleTimeString([], timeOptions);

    document.getElementById("todayStats").innerHTML = `
      <p>High: </p><strong>${highs.map(format).join(", ")} — ${Math.max(...values).toFixed(2)} m</strong>
      <p>Low: </p><strong>${lows.map(format).join(", ")} — ${Math.min(...values).toFixed(2)} m</strong>
    `;
  };

  loadTodayTides();