const http = require("http");
const https = require("https");
const fs = require("fs");
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "user",
  password: "password",
  database: "weather_db",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// Fetch data from open weather using lat and lon
const fetchWeather = (lat, lon, callback) => {
  const apiKey = "4ee5e701d87089c20a8bc8cb9965ff35"; // Replace with your OpenWeather API key
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  https
    .get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const weatherData = JSON.parse(data);
        if (weatherData.main) {
          const temperature = weatherData.main.temp;
          const humidity = weatherData.main.humidity;
          callback(null, { city: weatherData.name, temperature, humidity });
        } else {
          callback(new Error("Location not found"));
        }
      });
    })
    .on("error", (e) => {
      fs.appendFileSync("error.log", `${new Date()} - Error: ${e.message}\n`);
      callback(e);
    });
};

// // Fetch data from open weather-- first get lat and lon for city requested by user.
const getCoordinates = (city, callback) => {
  const apiKey = "4ee5e701d87089c20a8bc8cb9965ff35";
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

  http
    .get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const geoData = JSON.parse(data);
        if (geoData && geoData.length > 0) {
          const { lat, lon } = geoData[0];
          callback(null, lat, lon);
        } else {
          callback(new Error("City not found"));
        }
      });
    })
    .on("error", (e) => {
      fs.appendFileSync("error.log", `${new Date()} - Error: ${e.message}\n`);
      callback(e);
    });
};

// Checking cache
const checkCache = (city, callback) => {
  const query =
    "SELECT city, temperature, humidity FROM weather_logs WHERE city = ? AND timestamp >= NOW() - INTERVAL 10 MINUTE";
  connection.query(query, [city], (err, results) => {
    if (err) return callback(err);
    if (results.length > 0) {
      callback(null, results[0]);
    } else {
      // No cache found
      callback(null, null);
    }
  });
};

// Storing data in MySQL
const storeWeatherData = (city, temperature, humidity, callback) => {
  const query =
    "INSERT INTO weather_logs (city, temperature, humidity) VALUES (?, ?, ?)";
  connection.query(query, [city, temperature, humidity], (err) => {
    if (err) {
      fs.appendFileSync(
        "error.log",
        `${new Date()} - MySQL Error: ${err.message}\n`
      );
      return callback(err);
    }
    callback(null);
  });
};

// http server
const server = http.createServer((req, res) => {
  // Enable CORS for all routes
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.url.startsWith("/fetchWeather") && req.method === "GET") {
    const queryParams = new URL(req.url, `http://${req.headers.host}`)
      .searchParams;
    const city = queryParams.get("city");
    const lat = queryParams.get("lat");
    const lon = queryParams.get("lon");

    if (city) {
      // Check cache for city weather data
      checkCache(city, (err, cachedData) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Database error" }));
        }

        if (cachedData) {
          // return cached data if its there.
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(cachedData));
        }

        // fetch new data if nothing in cache.
        getCoordinates(city, (err, lat, lon) => {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: err.message }));
          }

          fetchWeather(lat, lon, (err, weather) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(
                JSON.stringify({ error: "Failed to fetch weather data" })
              );
            }

            storeWeatherData(
              weather.city,
              weather.temperature,
              weather.humidity,
              (err) => {
                if (err) {
                  res.writeHead(500, { "Content-Type": "application/json" });
                  return res.end(
                    JSON.stringify({ error: "Failed to save data" })
                  );
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(weather));
              }
            );
          });
        });
      });
    } else if (lat && lon) {
      // Fetch weather data using lat/lon
      fetchWeather(lat, lon, (err, weather) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "Failed to fetch weather data" })
          );
        }

        storeWeatherData(
          weather.city,
          weather.temperature,
          weather.humidity,
          (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Failed to save data" }));
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(weather));
          }
        );
      });
    } else {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Please provide either city or coordinates (lat, lon)",
        })
      );
    }
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Route not found");
  }
});

server.listen(4000, () => {
  console.log("Server is running on port 4000");
});
