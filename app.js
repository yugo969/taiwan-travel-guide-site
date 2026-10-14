const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = [...new Set(navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean))];
const setCurrent = (sectionId) => {
  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${sectionId}`;
    link.classList.toggle("is-current", isCurrent);
    link.toggleAttribute("aria-current", isCurrent);
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    if (window.scrollY < 80) {
      setCurrent(null);
      return;
    }
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    setCurrent(visible.target.id);
  },
  { rootMargin: "-25% 0px -65%", threshold: [0.05, 0.25, 0.6] },
);

sections.forEach((section) => observer.observe(section));
window.addEventListener("scroll", () => {
  if (window.scrollY < 80) setCurrent(null);
}, { passive: true });

const weatherCities = {
  Taipei: { latitude: 25.033, longitude: 121.5654 },
  Taichung: { latitude: 24.1477, longitude: 120.6736 },
  Tainan: { latitude: 22.9997, longitude: 120.227 },
};

const weatherLabels = {
  0: ["sun", "晴れ"], 1: ["sun", "おおむね晴れ"], 2: ["cloud", "くもりがち"], 3: ["cloud", "くもり"],
  45: ["cloud-fog", "霧"], 48: ["cloud-fog", "霧"], 51: ["cloud-drizzle", "霧雨"], 53: ["cloud-drizzle", "霧雨"], 55: ["cloud-drizzle", "霧雨"],
  56: ["cloud-drizzle", "凍結性の霧雨"], 57: ["cloud-drizzle", "凍結性の霧雨"], 61: ["cloud-rain", "小雨"], 63: ["cloud-rain", "雨"], 65: ["cloud-rain-wind", "強い雨"],
  66: ["cloud-rain", "凍結性の雨"], 67: ["cloud-rain-wind", "凍結性の雨"], 71: ["cloud-snow", "雪"], 73: ["cloud-snow", "雪"], 75: ["cloud-snow", "強い雪"],
  77: ["cloud-snow", "雪粒"], 80: ["cloud-rain", "にわか雨"], 81: ["cloud-rain", "にわか雨"], 82: ["cloud-rain-wind", "強いにわか雨"],
  85: ["cloud-snow", "にわか雪"], 86: ["cloud-snow", "強いにわか雪"], 95: ["cloud-lightning", "雷雨"], 96: ["cloud-lightning", "雷雨と雹"], 99: ["cloud-lightning", "強い雷雨と雹"],
};

const weatherFor = (code) => weatherLabels[code] || ["cloud", "観測中"];
const weatherUrl = ({ latitude, longitude }) => new URL(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=weather_code&forecast_hours=9&timezone=Asia%2FTaipei`);
const insertWeatherIcon = (target, iconName, label) => {
  const icon = document.createElement("i");
  icon.dataset.lucide = iconName;
  icon.textContent = label;
  icon.setAttribute("aria-hidden", "true");
  target.replaceChildren(icon);
  target.setAttribute("role", "img");
  target.setAttribute("aria-label", label);
};
const hydrateWeatherIcons = () => window.lucide?.createIcons({ attrs: { "stroke-width": 2.75 } });

const updateWeatherCard = (card, data) => {
  const current = data.current;
  const [icon, label] = weatherFor(current.weather_code);
  const trend = data.hourly.weather_code
    .map((code) => weatherFor(code))
    .filter((item, index, items) => index === 0 || item[1] !== items[index - 1][1])
    .slice(0, 3);
  const trendText = trend.map(([, text]) => text).join(" → ");
  insertWeatherIcon(card.querySelector("[data-weather-icon]"), icon, label);
  card.querySelector("[data-weather-temperature]").textContent = `${Math.round(current.temperature_2m)}°`;
  card.querySelector("[data-weather-humidity]").textContent = `湿度 ${current.relative_humidity_2m}%`;
  const trendSlot = card.querySelector("[data-weather-trend]");
  trendSlot.replaceChildren(...trend.flatMap(([iconName, text], index) => {
    const step = document.createElement("span");
    step.className = "weather-trend-step";
    insertWeatherIcon(step, iconName, text);
    if (!index) return step;
    const separator = document.createElement("i");
    separator.className = "weather-trend-separator";
    separator.dataset.lucide = "chevron-right";
    separator.setAttribute("aria-hidden", "true");
    return [separator, step];
  }));
  trendSlot.setAttribute("aria-label", `この先: ${trendText}`);
  hydrateWeatherIcons();
};

const weatherCards = [...document.querySelectorAll("[data-weather-city]")];
Promise.allSettled(weatherCards.map(async (card) => {
  const response = await fetch(weatherUrl(weatherCities[card.dataset.weatherCity]), { cache: "no-store" });
  if (!response.ok) throw new Error("Weather request failed");
  updateWeatherCard(card, await response.json());
})).then((results) => {
  const updated = document.querySelector("[data-weather-updated]");
  if (!updated) return;
  const succeeded = results.filter((result) => result.status === "fulfilled").length;
  updated.textContent = succeeded
    ? `更新: ${new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit" }).format(new Date())}（台湾時間）`
    : "天気を取得できません。時間をおいて更新してください。";
});
