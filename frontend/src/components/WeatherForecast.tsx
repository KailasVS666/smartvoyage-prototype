import React, { useEffect, useState } from 'react';
import { getDailyWeatherForecast, WeatherForecast as WeatherForecastType } from '@/services/weatherService';
import { Card } from '@/components/ui/card';

interface WeatherForecastProps {
  lat: number;
  lng: number;
  date: Date;
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({ lat, lng, date }) => {
  const [weather, setWeather] = useState<WeatherForecastType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setWeather(null);
    getDailyWeatherForecast(lat, lng, date)
      .then((data) => {
        if (isMounted) setWeather(data);
      })
      .catch((err) => {
        if (isMounted) setError('Could not fetch weather');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [lat, lng, date]);

  return (
    <Card className="mt-4 bg-gray-900 border-gray-800 p-4 flex items-center gap-4">
      {loading && <span className="text-gray-400">Loading weather...</span>}
      {error && <span className="text-red-400">{error}</span>}
      {!loading && !error && weather && (
        <div className="flex items-center gap-4">
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.condition}
            className="w-12 h-12"
          />
          <div>
            <div className="text-lg font-semibold text-teal-400">{weather.temperature}&deg;C</div>
            <div className="text-gray-300 text-sm">{weather.condition}</div>
            <div className="text-gray-500 text-xs">{new Date(weather.date).toLocaleDateString()}</div>
          </div>
        </div>
      )}
      {!loading && !error && !weather && (
        <span className="text-gray-400">No forecast available</span>
      )}
    </Card>
  );
};

export default WeatherForecast; 