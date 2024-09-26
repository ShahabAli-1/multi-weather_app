import React, { useState, useEffect } from "react";

function App() {
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefetch weather data for a default city when the app loads here we have london as default
  useEffect(() => {
    const fetchDefaultWeather = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:4000/fetchWeather?city=London`
        );
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setWeather(data);
      } catch (err) {
        setError("Failed to load default weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchDefaultWeather();
  }, []);

  const fetchWeatherByCity = async () => {
    const url = `http://localhost:4000/fetchWeather?city=${city}`;
    setLoading(true);

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setWeather(data);
      setError("");
    } catch (err) {
      setError(`Failed to fetch weather data: ${err.message}`);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByLatLon = async () => {
    const url = `http://localhost:4000/fetchWeather?lat=${lat}&lon=${lon}`;
    setLoading(true);

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setWeather(data);
      setError("");
    } catch (err) {
      setError(`Failed to fetch weather data: ${err.message}`);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCity = (e) => {
    e.preventDefault();
    // Clearing data before new fetch request
    setError("");
    setWeather(null);
    if (!city) {
      setError("Please enter a city.");
      return;
    }
    fetchWeatherByCity();
  };

  const handleSubmitLatLon = (e) => {
    e.preventDefault();

    setError("");
    setWeather(null);
    if (!lat || !lon) {
      setError("Please enter both latitude and longitude.");
      return;
    }
    fetchWeatherByLatLon();
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1>Weather App</h1>

      {/* City -> search form */}
      <form
        onSubmit={handleSubmitCity}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "50%",
          marginBottom: "20px",
        }}
      >
        <h2>Search by City</h2>
        <input
          style={{ height: "30px", padding: "5px" }}
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city"
        />
        <button
          style={{
            marginTop: "10px",
            padding: "10px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
          type="submit"
        >
          Get Weather by City
        </button>
      </form>

      {/* latitude/longitude -> search form */}
      <form
        onSubmit={handleSubmitLatLon}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "50%",
        }}
      >
        <h2>Search by Latitude and Longitude</h2>
        <input
          style={{ height: "30px", padding: "5px", marginBottom: "5px" }}
          type="text"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Enter latitude"
        />
        <input
          style={{ height: "30px", padding: "5px", marginBottom: "5px" }}
          type="text"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder="Enter longitude"
        />
        <button
          style={{
            marginTop: "10px",
            padding: "10px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
          type="submit"
        >
          Get Weather by Latitude/Longitude
        </button>
      </form>

      {/* Showing error msg in case of error */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading && <p>Loading...</p>}

      {/* Display fetched weather data */}
      {weather && !loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <h2>
            Location:{" "}
            <span style={{ fontStyle: "italic", fontWeight: "normal" }}>
              {weather.city}
            </span>
          </h2>
          <p>
            <span style={{ fontWeight: "bold" }}>Temperature:</span>{" "}
            {weather.temperature}°C
          </p>
          <p style={{ fontWeight: "bold" }}>Humidity: {weather.humidity}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
