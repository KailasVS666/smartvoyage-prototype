import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

export interface WeatherForecast {
  date: string; // ISO date string
  icon: string;
  temperature: number; // Celsius
  condition: string;
}

// OpenWeatherMap 5-day/3-hour forecast API response types (partial)
interface OWMForecastResponse {
  list: Array<{
    dt: number;
    main: { temp: number };
    weather: Array<{ icon: string; main: string; description: string }>;
    dt_txt: string;
  }>;
}

// Helper to find the forecast closest to the target date
function findClosestForecast(list: OWMForecastResponse['list'], targetDate: Date): WeatherForecast | null {
  let minDiff = Infinity;
  let closest: OWMForecastResponse['list'][0] | null = null;
  for (const entry of list) {
    const entryDate = new Date(entry.dt_txt);
    const diff = Math.abs(entryDate.getTime() - targetDate.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  if (!closest) return null;
  return {
    date: closest.dt_txt,
    icon: closest.weather[0].icon,
    temperature: Math.round(closest.main.temp - 273.15), // Kelvin to Celsius
    condition: closest.weather[0].main,
  };
}

export async function getDailyWeatherForecast(lat: number, lng: number, date: Date): Promise<WeatherForecast | null> {
  if (!API_KEY) throw new Error('OpenWeatherMap API key is missing');
  try {
    const res = await axios.get<OWMForecastResponse>(BASE_URL, {
      params: {
        lat,
        lon: lng,
        appid: API_KEY,
      },
    });
    return findClosestForecast(res.data.list, date);
  } catch (err) {
    console.error('Weather fetch error:', err);
    return null;
  }
} 