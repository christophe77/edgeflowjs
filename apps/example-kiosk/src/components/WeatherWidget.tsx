import { useI18n } from "@edgeflow/i18n/react";
import { useWeather } from "../hooks/useWeather";

export default function WeatherWidget() {
  const i18n = useI18n();
  const weather = useWeather();
  const tempStr = i18n.formatNumber(weather.temp) + "°";

  return (
    <aside className="weather-widget" aria-label="Weather">
      <span className="weather-widget__temp">{tempStr}</span>
      <span className="weather-widget__icon" aria-hidden="true">
        {weather.icon}
      </span>
    </aside>
  );
}
