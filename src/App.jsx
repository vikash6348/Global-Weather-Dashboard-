import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [weather, setWeather] = useState(null);
  const [time, setTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState({
    name: "Guntur, Andhra Pradesh",
    latitude: 16.3067,
    longitude: 80.4365
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch weather data when selected city changes
  useEffect(() => {
    if (selectedCity) {
      setIsLoading(true);
      setError(null);
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.latitude}&longitude=${selectedCity.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_mean,windspeed_10m_max,winddirection_10m_dominant&timezone=auto`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Weather data fetch failed");
          return res.json();
        })
        .then((data) => {
          setWeather(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching weather:", error);
          setError("Failed to fetch weather data. Please try again.");
          setIsLoading(false);
        });
    }
  }, [selectedCity]);

  // ⏰ Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Search for cities using Open-Meteo Geocoding API
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
        );
        if (!response.ok) throw new Error("Geocoding API request failed");
        
        const data = await response.json();
        if (data.results) {
          setSearchResults(data.results);
          setShowSuggestions(true);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error fetching city data:", err);
        setError("Failed to search for cities. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity({
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      country: city.country,
      admin1: city.admin1
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowSuggestions(false);
  };

  // Get weather description from weather code
  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      56: "Light freezing drizzle",
      57: "Dense freezing drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      66: "Light freezing rain",
      67: "Heavy freezing rain",
      71: "Slight snow fall",
      73: "Moderate snow fall",
      75: "Heavy snow fall",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail"
    };
    return weatherCodes[code] || "Unknown";
  };

  // Get weather icon from weather code
  const getWeatherIcon = (code, isDay = 1) => {
    if (isDay !== 1) {
      // Night icons
      if ([0, 1].includes(code)) return "🌙";
      if ([2, 3].includes(code)) return "☁️";
      if ([45, 48].includes(code)) return "🌫️";
      if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
      if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
      if ([95, 96, 99].includes(code)) return "⛈️";
    } else {
      // Day icons
      if ([0].includes(code)) return "☀️";
      if ([1].includes(code)) return "🌤️";
      if ([2].includes(code)) return "⛅";
      if ([3].includes(code)) return "☁️";
      if ([45, 48].includes(code)) return "🌫️";
      if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
      if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
      if ([95, 96, 99].includes(code)) return "⛈️";
    }
    return "❓";
  };

  // Get day name from date string
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  };

  // Determine weather class for dynamic backgrounds
  function getWeatherClass(weather) {
    if (!weather || !weather.current_weather) return "day";

    const code = weather.current_weather.weathercode;
    const isDay = weather.current_weather.is_day;

    if (isDay === 1) {
      if ([0].includes(code)) return "day";
      if ([1, 2, 3].includes(code)) return "cloudy";
      if ([45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rainy";
      if ([71, 73, 75, 77, 85, 86].includes(code)) return "snowy";
      if ([95, 96, 99].includes(code)) return "stormy";
      return "day";
    } else {
      if ([0, 1].includes(code)) return "night";
      if ([2, 3].includes(code)) return "cloudy-night";
      if ([45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rainy-night";
      if ([71, 73, 75, 77, 85, 86].includes(code)) return "snowy-night";
      if ([95, 96, 99].includes(code)) return "stormy-night";
      return "night";
    }
  }

  const weatherClass = weather ? getWeatherClass(weather) : "day";
  const currentWeather = weather ? weather.current_weather : null;
  
  // Check if it's night and clear (no precipitation)
  const isClearNight = weatherClass === "night" && 
                      currentWeather && 
                      ![45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(currentWeather.weathercode);

  // Check if visibility might be low (night or rainy conditions)
  const isLowVisibilityMode = ["night", "rainy", "rainy-night", "stormy", "stormy-night"].includes(weatherClass);

  return (
    <div className={`app ${weatherClass}`}>
      {/* Search Box */}
      <div className="search-container">
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="🔍 Search for any city worldwide..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
            onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
          />
          {isLoading && <div className="search-loader"></div>}
          {showSuggestions && searchResults.length > 0 && (
            <div className="suggestions-list">
              {searchResults.map((city, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleCitySelect(city)}
                >
                  <span className="city-name">{city.name}</span>
                  {city.admin1 && <span className="city-region">{city.admin1}, </span>}
                  <span className="city-country">{city.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <h1>🌤️ Global Weather Dashboard</h1>
      <h2>
        {selectedCity.name}
        {selectedCity.admin1 && `, ${selectedCity.admin1}`}
        {selectedCity.country && `, ${selectedCity.country}`}
      </h2>

      {/* ⏰ Clock + Date */}
      <h3 className="clock">{time.toLocaleTimeString()}</h3>
      <h4 className="date">{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>

      {/* Weather elements */}
      {currentWeather?.is_day === 1 && weatherClass === "day" && <div className="sun"></div>}

      {isClearNight && (
        <>
          <div className="moon"></div>
          {[...Array(50)].map((_, i) => (
            <div key={i} className="star" style={{
              '--x': Math.random(),
              '--y': Math.random(),
              '--size': `${Math.random() * 3 + 1}px`,
              '--delay': `${Math.random() * 5}s`,
              '--duration': `${Math.random() * 3 + 2}s`
            }}></div>
          ))}
        </>
      )}

      {(weatherClass === "cloudy" || weatherClass === "cloudy-night") && (
        <>
          <div className="cloud" style={{ 
            '--size': '120px', 
            '--top': '100px', 
            '--left': '20%', 
            '--speed': '20s',
            '--delay': '0s'
          }}></div>
          <div className="cloud" style={{ 
            '--size': '180px', 
            '--top': '150px', 
            '--left': '50%', 
            '--speed': '25s',
            '--delay': '5s'
          }}></div>
          <div className="cloud" style={{ 
            '--size': '140px', 
            '--top': '200px', 
            '--left': '75%', 
            '--speed': '30s',
            '--delay': '10s'
          }}></div>
          <div className="cloud" style={{ 
            '--size': '100px', 
            '--top': '80px', 
            '--left': '40%', 
            '--speed': '22s',
            '--delay': '7s'
          }}></div>
          <div className="cloud" style={{ 
            '--size': '160px', 
            '--top': '180px', 
            '--left': '10%', 
            '--speed': '28s',
            '--delay': '3s'
          }}></div>
        </>
      )}

      {["rainy", "rainy-night"].includes(weatherClass) &&
        [...Array(50)].map((_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{ left: `${Math.random() * 100}vw`, animationDelay: `${Math.random()}s` }}
          ></div>
        ))}

      {["snowy", "snowy-night"].includes(weatherClass) &&
        [...Array(30)].map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{ left: `${Math.random() * 100}vw`, animationDuration: `${3 + Math.random() * 5}s` }}
          ></div>
        ))}

      {["stormy", "stormy-night"].includes(weatherClass) && (
        <>
          <div className="lightning"></div>
          <div className="lightning"></div>
        </>
      )}

      {/* Weather Data */}
      {error ? (
        <div className="error-card">
          <p>❌ {error}</p>
        </div>
      ) : isLoading ? (
        <div className="loading-card">
          <div className="loader"></div>
          <p>Fetching weather data...</p>
        </div>
      ) : weather && currentWeather ? (
        <div className="weather-container">
          <div className="weather-card current-weather">
            <h3>Current Weather</h3>
            <div className="weather-icon">
              {getWeatherIcon(currentWeather.weathercode, currentWeather.is_day)}
            </div>
            <p className="temperature">{currentWeather.temperature}°C</p>
            <p className="weather-desc">{getWeatherDescription(currentWeather.weathercode)}</p>
            <div className="weather-details">
              <p>💨 Wind: {currentWeather.windspeed} km/h</p>
              <p>🧭 Direction: {currentWeather.winddirection}°</p>
            </div>
          </div>

          {weather.daily && (
            <div className="forecast-container">
              <h3 className={isLowVisibilityMode ? "low-visibility-text" : ""}>7-Day Forecast</h3>
              <div className="forecast-cards">
                {weather.daily.time.map((date, index) => (
                  <div key={index} className={`forecast-card ${isLowVisibilityMode ? "low-visibility" : ""}`}>
                    <p className={`forecast-date ${isLowVisibilityMode ? "low-visibility-text" : ""}`}>
                      {getDayName(date)}
                    </p>
                    <p className="forecast-icon">
                      {getWeatherIcon(weather.daily.weathercode[index])}
                    </p>
                    <p className={`forecast-temp-max ${isLowVisibilityMode ? "low-visibility-text" : ""}`}>
                      {Math.round(weather.daily.temperature_2m_max[index])}°
                    </p>
                    <p className={`forecast-temp-min ${isLowVisibilityMode ? "low-visibility-text" : ""}`}>
                      {Math.round(weather.daily.temperature_2m_min[index])}°
                    </p>
                    <div className="forecast-details">
                      <p className={`precipitation ${isLowVisibilityMode ? "low-visibility-text" : ""}`}>
                        💧 {weather.daily.precipitation_probability_mean[index] || 0}%
                      </p>
                      <p className={`wind ${isLowVisibilityMode ? "low-visibility-text" : ""}`}>
                        💨 {Math.round(weather.daily.windspeed_10m_max[index])} km/h
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="loading-card">
          <div className="loader"></div>
          <p>Loading weather data...</p>
        </div>
      )}
    </div>
  );
}

export default App;