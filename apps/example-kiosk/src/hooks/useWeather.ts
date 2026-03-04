import { useState, useEffect } from "react";

export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "partly-cloudy";

export type Weather = {
  temp: number;
  condition: WeatherCondition;
  icon: string;
};

const WEATHER_ICONS: Record<WeatherCondition, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  "partly-cloudy": "⛅",
};

/** Mock weather for demo. In production, replace with device.weather or API. */
export function useWeather(): Weather {
  const [weather, setWeather] = useState<Weather>({
    temp: 22,
    condition: "sunny",
    icon: WEATHER_ICONS.sunny,
  });

  useEffect(() => {
    // Simulate slight temp variation for demo (optional)
    const conditions = ["sunny", "partly-cloudy", "cloudy"] as const;
    const t = setInterval(() => {
      const cond = conditions[Math.floor(Math.random() * conditions.length)];
      setWeather((w) => ({
        ...w,
        temp: 20 + Math.round(Math.random() * 6),
        condition: cond,
        icon: WEATHER_ICONS[cond],
      }));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  return weather;
}
