// 🌗 THEME TOGGLE
const toggleBtn = document.getElementById("themeToggle");

// Load saved theme
if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light");
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  // Save preference
  if (document.body.classList.contains("light")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});
  console.log("JS LOADED");

let climateData = [];
let tempChart = null;

document.getElementById("startBtn").addEventListener("click", () => {
  console.log("Button clicked");

  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (!start || !end) {
    document.getElementById("output").innerText =
      "❌ Select start and end month";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      document.getElementById("output").innerHTML =
        `📍 Lat: ${lat}<br>📍 Lon: ${lon}<br>⏳ Fetching data...`;

      fetchMonthlyData(lat, lon, start + "-01", end + "-01");
    },
    () => alert("Location permission denied")
  );
});

function fetchMonthlyData(lat, lon, start, end) {
  fetch(
    `https://meteostat.p.rapidapi.com/point/monthly?lat=${lat}&lon=${lon}&start=${start}&end=${end}`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "3964bdca7cmsh2c7ae64210ae13ap15cb37jsn7855832a4e0b",
        "X-RapidAPI-Host": "meteostat.p.rapidapi.com"
      }
    }
  )
    .then(res => res.json())
    .then(data => {
      console.log("API DATA:", data);

      climateData = data.data;

      document.getElementById("output").innerHTML +=
        "<br>✅ Data fetched";

      drawGraph(climateData);
    })
    .catch(err => {
      console.error(err);
      document.getElementById("output").innerText =
        "❌ API error";
    });
}

function getExactMonthTemp() {
  const month = document.getElementById("singleMonth").value;

  if (!month) {
    alert("Select a month");
    return;
  }

  const record = climateData.find(d =>
    d.date.startsWith(month)
  );

  if (!record) {
    document.getElementById("output").innerHTML +=
      `<br>❌ No data for ${month}`;
    return;
  }

  document.getElementById("output").innerHTML += `
    <br><b>${month}</b>
    <br>🌡 Avg: ${record.tavg ?? "N/A"} °C
    <br>🔺 Max: ${record.tmax ?? "N/A"} °C
    <br>🔻 Min: ${record.tmin ?? "N/A"} °C
  `;
}

function drawGraph(data) {
  const labels = data.map(d => d.date.substring(0, 7));
  const temps = data.map(d => d.tavg);

  const ctx = document.getElementById("tempChart").getContext("2d");

  // Destroy old chart if exists
  if (tempChart) tempChart.destroy();

  // Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(0, 229, 255, 0.6)");
  gradient.addColorStop(1, "rgba(0, 229, 255, 0.05)");

  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Avg Monthly Temperature (°C)",
        data: temps,
        borderColor: "#00e5ff",
        backgroundColor: gradient,
        fill: true,
        tension: 0.45,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "#00e5ff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
            font: { size: 14 }
          }
        },
        tooltip: {
          backgroundColor: "#000",
          titleColor: "#00e5ff",
          bodyColor: "#ffffff",
          borderColor: "#00e5ff",
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#ffffff"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        },
        y: {
          ticks: {
            color: "#ffffff"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });
}
function downloadCSV() {
  if (climateData.length === 0) {
    alert("No data to export. Fetch temperature data first.");
    return;
  }

  let csv = "Month,Avg Temperature (°C),Max Temperature (°C),Min Temperature (°C)\n";

  climateData.forEach(d => {
    const month = d.date.substring(0, 7);
    const avg = d.tavg ?? "";
    const max = d.tmax ?? "";
    const min = d.tmin ?? "";

    csv += `${month},${avg},${max},${min}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "temperature-data.csv";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
function searchCity() {
  const city = document.getElementById("cityInput").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  if (!city) {
    alert("Please enter a city name");
    return;
  }

  if (!start || !end) {
    alert("Please select start and end month first");
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("City search failed");
      return res.json();
    })
    .then(data => {
      if (!data || data.length === 0) {
        alert("City not found");
        return;
      }

      const lat = data[0].lat;
      const lon = data[0].lon;

      document.getElementById("output").innerHTML = `
        🏙️ City: <b>${city}</b><br>
        📍 Latitude: ${lat}<br>
        📍 Longitude: ${lon}<br>
        ⏳ Fetching climate data...
      `;

      // ✅ CORRECT CALL (THIS WAS THE BUG)
      fetchClimateData(lat, lon, start + "-01", end + "-01");
    })
    .catch(err => {
      console.error(err);
      alert("Error searching city. Try again.");
    });
}
function predictFuture() {
  if (climateData.length < 6) {
    alert("Not enough data to predict");
    return;
  }

  // Convert temps to numbers
  const temps = climateData.map(d => d.tavg).filter(v => v !== null);

  const n = temps.length;

  // x = 1,2,3,...n
  const x = Array.from({ length: n }, (_, i) => i + 1);

  // Linear regression formulas
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = temps.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * temps[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope =
    (n * sumXY - sumX * sumY) /
    (n * sumX2 - sumX * sumX);

  const intercept = (sumY - slope * sumX) / n;

  // Predict next 12 months
  const futureTemps = [];
  for (let i = n + 1; i <= n + 12; i++) {
    futureTemps.push(Number((slope * i + intercept).toFixed(2)));
  }

  extendGraphWithPrediction(futureTemps);
}
function extendGraphWithPrediction(predictedTemps) {
  const lastDate = climateData[climateData.length - 1].date;
  const [year, month] = lastDate.split("-").map(Number);

  const futureLabels = [];
  let y = year;
  let m = month;

  for (let i = 0; i < predictedTemps.length; i++) {
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    futureLabels.push(`${y}-${String(m).padStart(2, "0")}`);
  }

  // Extend chart
  tempChart.data.labels.push(...futureLabels);

  tempChart.data.datasets.push({
    label: "Predicted Temperature (°C)",
    data: [...Array(climateData.length).fill(null), ...predictedTemps],
    borderColor: "#ff9800",
    borderDash: [8, 6],
    pointRadius: 3,
    tension: 0.4,
    fill: false
  });

  tempChart.update();

  document.getElementById("output").innerHTML += `
    <br><b>🤖 Prediction:</b> Next 12 months estimated using trend analysis.
  `;
}
