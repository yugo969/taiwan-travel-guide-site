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

const reflectionDialog = document.getElementById("reflection-dialog");
const reflectionOpeners = [...document.querySelectorAll("[data-open-reflection]")];
const reflectionClose = reflectionDialog?.querySelector("[data-close-reflection]");
let lastReflectionOpener = null;
reflectionOpeners.forEach((opener) => opener.addEventListener("click", (event) => {
  event.preventDefault();
  if (!reflectionDialog || reflectionDialog.open) return;
  lastReflectionOpener = opener;
  reflectionDialog.showModal();
  requestAnimationFrame(() => reflectionClose?.focus());
}));
reflectionClose?.addEventListener("click", () => reflectionDialog?.close());
reflectionDialog?.addEventListener("click", (event) => {
  if (event.target === reflectionDialog) reflectionDialog.close();
});
reflectionDialog?.addEventListener("close", () => lastReflectionOpener?.focus());
window.lucide?.createIcons({ attrs: { "stroke-width": 2.5 } });

const cityTabList = document.querySelector("[data-city-tabs]");
const cityTabs = [...(cityTabList?.querySelectorAll("[data-city-tab]") || [])];
const cityPanels = [...(cityTabList?.nextElementSibling?.querySelectorAll("[data-city-panel]") || [])];
const cityMobileQuery = window.matchMedia("(max-width: 680px)");
let selectedCity = "taichung";
const updateCityTabs = () => {
  const mobile = cityMobileQuery.matches;
  const focusedTab = cityTabList?.contains(document.activeElement);
  const focusedHiddenPanel = mobile && cityPanels.some((panel) => panel.dataset.cityPanel !== selectedCity && panel.contains(document.activeElement));
  cityTabList?.classList.toggle("is-ready", mobile);
  if (mobile) cityTabList?.setAttribute("role", "tablist");
  else cityTabList?.removeAttribute("role");
  cityTabs.forEach((tab) => {
    const selected = tab.dataset.cityTab === selectedCity;
    if (mobile) {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    } else {
      tab.removeAttribute("role");
      tab.removeAttribute("aria-selected");
      tab.tabIndex = 0;
    }
  });
  cityPanels.forEach((panel) => {
    panel.hidden = mobile && panel.dataset.cityPanel !== selectedCity;
    if (mobile) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `city-tab-${panel.dataset.cityPanel}`);
      panel.tabIndex = 0;
    } else {
      panel.removeAttribute("role");
      panel.removeAttribute("aria-labelledby");
      panel.tabIndex = -1;
    }
  });
  if (!mobile && focusedTab) cityPanels.find((panel) => panel.dataset.cityPanel === selectedCity)?.focus();
  if (focusedHiddenPanel) cityTabs.find((tab) => tab.dataset.cityTab === selectedCity)?.focus();
};
if (cityTabList && cityTabs.length === cityPanels.length) {
  cityTabs.forEach((tab) => tab.addEventListener("click", () => {
    selectedCity = tab.dataset.cityTab;
    updateCityTabs();
  }));
  cityTabList.addEventListener("keydown", (event) => {
    if (!cityMobileQuery.matches || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = cityTabs.indexOf(document.activeElement);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? cityTabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + cityTabs.length) % cityTabs.length;
    selectedCity = cityTabs[nextIndex].dataset.cityTab;
    updateCityTabs();
    cityTabs[nextIndex].focus();
  });
  cityMobileQuery.addEventListener("change", updateCityTabs);
  updateCityTabs();
}

const prepView = document.getElementById("prep-view");
const guideMain = document.getElementById("main");
const siteHeader = document.querySelector(".site-header");
const siteFooter = document.querySelector(".site-footer");
const mobileDock = document.querySelector(".mobile-dock");
const skipLink = document.querySelector(".skip-link");
const prepOpenButton = document.getElementById("prep-open");
const prepTabs = [...(prepView?.querySelectorAll("[data-prep-tab]") || [])];
const prepPanels = [...(prepView?.querySelectorAll("[role='tabpanel'][id^='prep-panel-']") || [])];
const prepBoardFrame = prepView?.querySelector("iframe[data-prep-board-src]");
let guideScrollY = 0;
const loadPrepBoard = () => {
  if (prepBoardFrame && !prepBoardFrame.hasAttribute("src")) {
    prepBoardFrame.setAttribute("src", prepBoardFrame.dataset.prepBoardSrc);
  }
};
const selectPrepTab = (tab) => {
  prepTabs.forEach((button) => {
    const selected = button === tab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  prepPanels.forEach((panel) => {
    panel.hidden = panel.id !== tab.getAttribute("aria-controls");
  });
  if (tab.dataset.prepTab === "board") loadPrepBoard();
};

const setPrepView = (isOpen, { restoreScroll = true } = {}) => {
  if (!prepView || !guideMain || !prepOpenButton) return;
  if (isOpen === !prepView.hidden) return;

  if (isOpen) {
    guideScrollY = window.scrollY;
    if (siteHeader) siteHeader.hidden = true;
    guideMain.hidden = true;
    if (siteFooter) siteFooter.hidden = true;
    if (mobileDock) mobileDock.hidden = true;
    prepView.hidden = false;
    document.body.classList.add("prep-mode");
    prepOpenButton.setAttribute("aria-expanded", "true");
    if (skipLink) skipLink.href = "#prep-view";
    window.scrollTo(0, 0);
    loadPrepBoard();
    requestAnimationFrame(() => prepTabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.focus());
    return;
  }

  prepView.hidden = true;
  if (siteHeader) siteHeader.hidden = false;
  guideMain.hidden = false;
  if (siteFooter) siteFooter.hidden = false;
  if (mobileDock) mobileDock.hidden = false;
  document.body.classList.remove("prep-mode");
  prepOpenButton.setAttribute("aria-expanded", "false");
  if (skipLink) skipLink.href = "#main";
  window.scrollTo(0, restoreScroll ? guideScrollY : 0);
  prepOpenButton.focus();
};

prepOpenButton?.addEventListener("click", () => setPrepView(prepView?.hidden ?? false));
prepView?.querySelector("[data-prep-close]")?.addEventListener("click", () => setPrepView(false));
prepTabs.forEach((tab) => tab.addEventListener("click", () => selectPrepTab(tab)));
prepView?.querySelector("[role='tablist']")?.addEventListener("keydown", (event) => {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const currentIndex = prepTabs.indexOf(document.activeElement);
  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? prepTabs.length - 1 : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + prepTabs.length) % prepTabs.length;
  prepTabs[nextIndex]?.focus();
  if (prepTabs[nextIndex]) selectPrepTab(prepTabs[nextIndex]);
});
prepView?.querySelectorAll("[data-prep-close-link]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  const target = document.querySelector(link.getAttribute("href"));
  setPrepView(false, { restoreScroll: false });
  if (!target) return;
  history.replaceState(null, "", link.getAttribute("href"));
  if (target.tagName === "DETAILS") target.open = true;
  requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
    target.querySelector("summary")?.focus({ preventScroll: true });
  });
}));

const prepChecks = [...document.querySelectorAll("[data-prep-check]")];
const prepProgressText = document.querySelector("[data-prep-progress]");
const prepProgressBar = document.querySelector("[data-prep-progress-bar]");
const prepCheckStorageKey = "taiwan-prep-checks-2026";
let savedPrepChecks = {};
try {
  savedPrepChecks = JSON.parse(localStorage.getItem(prepCheckStorageKey) || "{}");
} catch {
  savedPrepChecks = {};
}
const updatePrepProgress = () => {
  const completed = prepChecks.filter((checkbox) => checkbox.checked).length;
  if (prepProgressText) prepProgressText.textContent = `${completed} / ${prepChecks.length} 確認`;
  if (prepProgressBar) prepProgressBar.value = completed;
};
prepChecks.forEach((checkbox) => {
  checkbox.checked = savedPrepChecks[checkbox.dataset.prepCheck] === true;
  checkbox.addEventListener("change", () => {
    savedPrepChecks[checkbox.dataset.prepCheck] = checkbox.checked;
    try {
      localStorage.setItem(prepCheckStorageKey, JSON.stringify(savedPrepChecks));
    } catch {
      // The checklist remains usable for this page view if storage is unavailable.
    }
    updatePrepProgress();
  });
});
if (prepProgressBar) prepProgressBar.max = prepChecks.length;
updatePrepProgress();

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
