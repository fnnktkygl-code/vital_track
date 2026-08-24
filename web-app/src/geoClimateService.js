/**
 * geoClimateService.js - Real-time Location, Climate, Season & Bioregion Engine
 * Provides factual, empirical geo-detection (GPS + Timezone fallback + Open-Meteo live weather)
 * Auto-infers bioregions without requiring arbitrary manual dropdown selection.
 */

import { store } from './storage.js';

export const WMO_WEATHER_MAP = {
  0: { labelFr: 'Ciel dégagé', labelEn: 'Clear sky', labelEs: 'Cielo despejado', icon: '☀️' },
  1: { labelFr: 'Ensoleillé / Voilé', labelEn: 'Mainly clear', labelEs: 'Mayormente despejado', icon: '🌤️' },
  2: { labelFr: 'Partiellement nuageux', labelEn: 'Partly cloudy', labelEs: 'Parcialmente nublado', icon: '⛅' },
  3: { labelFr: 'Couvert', labelEn: 'Overcast', labelEs: 'Nublado', icon: '☁️' },
  45: { labelFr: 'Brouillard', labelEn: 'Fog', labelEs: 'Niebla', icon: '🌫️' },
  48: { labelFr: 'Brouillard givrant', labelEn: 'Depositing rime fog', labelEs: 'Niebla escarchada', icon: '🌫️' },
  51: { labelFr: 'Bruine légère', labelEn: 'Light drizzle', labelEs: 'Llovizna ligera', icon: '🌦️' },
  53: { labelFr: 'Bruine modérée', labelEn: 'Moderate drizzle', labelEs: 'Llovizna moderada', icon: '🌦️' },
  55: { labelFr: 'Bruine dense', labelEn: 'Dense drizzle', labelEs: 'Llovizna densa', icon: '🌧️' },
  61: { labelFr: 'Pluie faible', labelEn: 'Slight rain', labelEs: 'Lluvia débil', icon: '🌧️' },
  63: { labelFr: 'Pluie modérée', labelEn: 'Moderate rain', labelEs: 'Lluvia moderada', icon: '🌧️' },
  65: { labelFr: 'Pluie intense', labelEn: 'Heavy rain', labelEs: 'Lluvia intensa', icon: '🌧️' },
  71: { labelFr: 'Chute de neige faible', labelEn: 'Slight snowfall', labelEs: 'Nevada ligera', icon: '🌨️' },
  73: { labelFr: 'Chute de neige modérée', labelEn: 'Moderate snowfall', labelEs: 'Nevada moderada', icon: '❄️' },
  75: { labelFr: 'Chute de neige forte', labelEn: 'Heavy snowfall', labelEs: 'Nevada fuerte', icon: '❄️' },
  80: { labelFr: 'Averses légères', labelEn: 'Slight rain showers', labelEs: 'Chubascos leves', icon: '🌦️' },
  81: { labelFr: 'Averses modérées', labelEn: 'Moderate rain showers', labelEs: 'Chubascos moderados', icon: '🌧️' },
  82: { labelFr: 'Averses violentes', labelEn: 'Violent rain showers', labelEs: 'Chubascos violentos', icon: '⛈️' },
  95: { labelFr: 'Orage', labelEn: 'Thunderstorm', labelEs: 'Tormenta', icon: '⛈️' }
};

export const BIOREGIONS = {
  boreal: {
    id: 'boreal',
    icon: '🌲',
    nameFr: 'Boréale / Nordique',
    nameEn: 'Boreal / Nordic',
    nameEs: 'Boreal / Nórdica',
    descFr: 'Climat froid à saisons marquées (Canada, Scandinavie, Alpes)',
    descEn: 'Cold climate with marked seasons (Canada, Scandinavia, Alps)',
    descEs: 'Clima frío con estaciones marcadas (Canadá, Escandinavia, Alpes)',
    vitalAdviceFr: 'Privilégiez les baies sauvages, racines douces, soupes tièdes crues et tisanes rénales en hiver.'
  },
  temperate: {
    id: 'temperate',
    icon: '🍂',
    nameFr: 'Tempérée Océanique / Continentale',
    nameEn: 'Temperate Oceanic / Continental',
    nameEs: 'Templada Oceánica / Continental',
    descFr: 'Climat doux à 4 saisons équilibrées (France, Europe Centrale, USA Nord)',
    descEn: 'Mild 4-season climate (France, Central Europe, Northern USA)',
    descEs: 'Clima suave con 4 estaciones equilibradas (Francia, Europa Central)',
    vitalAdviceFr: 'Transition saisonnière fluide : verdures abondantes au printemps, fruits denses en été, racines en automne/hiver.'
  },
  mediterranean: {
    id: 'mediterranean',
    icon: '☀️',
    nameFr: 'Méditerranéenne / Subtropicale',
    nameEn: 'Mediterranean / Subtropical',
    nameEs: 'Mediterránea / Subtropical',
    descFr: 'Ensoleillement élevé, hivers doux et étés chauds (Sud France, Espagne, Italie, Californie)',
    descEn: 'High sunlight, mild winters and warm summers (Southern France, Spain, Italy, California)',
    descEs: 'Alta radiación solar, inviernos suaves y veranos cálidos (Sur de Francia, España, Italia)',
    vitalAdviceFr: 'Excellente abondance en melons, pastèques, figues, tomates anciennes, olives et herbes sauvages bio-minérales.'
  },
  tropical: {
    id: 'tropical',
    icon: '🌴',
    nameFr: 'Tropicale / Équatoriale',
    nameEn: 'Tropical / Equatorial',
    nameEs: 'Tropical / Ecuatorial',
    descFr: 'Chaleur continue et humidité vivante (Antilles, Afrique de l\'Ouest, Asie du Sud-Est, Réunion)',
    descEn: 'Continuous warmth and living humidity (Caribbean, West Africa, SE Asia, Reunion)',
    descEs: 'Calor continuo y humedad viva (Caribe, África Occidental, Sudeste Asiático)',
    vitalAdviceFr: 'Idéal pour le frugivorisme avancé : mangues sauvages, papayes à graines, eau de coco fraîche, corossol et soursop.'
  },
  arid: {
    id: 'arid',
    icon: '🌵',
    nameFr: 'Aride / Désertique',
    nameEn: 'Arid / Desert',
    nameEs: 'Árida / Desértica',
    descFr: 'Faible humidité, forte amplitude thermique (Maghreb, Moyen-Orient, Sud-Ouest USA)',
    descEn: 'Low humidity, high temperature range (North Africa, Middle East, SW USA)',
    descEs: 'Baja humedad, gran amplitud térmica (Magreb, Oriente Medio)',
    vitalAdviceFr: 'Hydratation cellulaire critique : eau structurée, concombres, dattes fraîches et infusions de romarin/thym.'
  }
};

/**
 * Calculates season based on current date and latitude (Northern vs Southern hemisphere)
 */
export function getSeasonFromDateAndLat(date = new Date(), lat = 48.85) {
  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  const isNorthern = lat >= 0;

  if (isNorthern) {
    if (month >= 2 && month <= 4) return { id: 'spring', labelFr: 'Printemps', labelEn: 'Spring', labelEs: 'Primavera', icon: '🌱' };
    if (month >= 5 && month <= 7) return { id: 'summer', labelFr: 'Été', labelEn: 'Summer', labelEs: 'Verano', icon: '☀️' };
    if (month >= 8 && month <= 10) return { id: 'autumn', labelFr: 'Automne', labelEn: 'Autumn', labelEs: 'Otoño', icon: '🍂' };
    return { id: 'winter', labelFr: 'Hiver', labelEn: 'Winter', labelEs: 'Invierno', icon: '❄️' };
  } else {
    // Southern Hemisphere inverted
    if (month >= 2 && month <= 4) return { id: 'autumn', labelFr: 'Automne', labelEn: 'Autumn', labelEs: 'Otoño', icon: '🍂' };
    if (month >= 5 && month <= 7) return { id: 'winter', labelFr: 'Hiver', labelEn: 'Winter', labelEs: 'Invierno', icon: '❄️' };
    if (month >= 8 && month <= 10) return { id: 'spring', labelFr: 'Printemps', labelEn: 'Spring', labelEs: 'Primavera', icon: '🌱' };
    return { id: 'summer', labelFr: 'Été', labelEn: 'Summer', labelEs: 'Verano', icon: '☀️' };
  }
}

/**
 * Intelligent Biorégion Inference Engine
 * Detects biome from city, country, coordinates, and climate parameters
 */
export function inferBioregion(city = '', country = '', lat = null, lon = null) {
  const cNorm = (city + ' ' + country).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Specific Keyword Matching
  // Tropical / Equatorial
  if (
    cNorm.includes('senegal') || cNorm.includes('dakar') || cNorm.includes('abidjan') || cNorm.includes('guadeloupe') ||
    cNorm.includes('martinique') || cNorm.includes('guyane') || cNorm.includes('reunion') || cNorm.includes('tahiti') ||
    cNorm.includes('pointe-a-pitre') || cNorm.includes('fort-de-france') || cNorm.includes('cameroun') ||
    cNorm.includes('thailande') || cNorm.includes('bresil') || cNorm.includes('brazil') || cNorm.includes('bali') ||
    cNorm.includes('caraibes') || cNorm.includes('antilles') || cNorm.includes('havana') || cNorm.includes('cuba')
  ) {
    return 'tropical';
  }

  // Arid / Desert
  if (
    cNorm.includes('marrakech') || cNorm.includes('ouarzazate') || cNorm.includes('caire') || cNorm.includes('cairo') ||
    cNorm.includes('dubai') || cNorm.includes('riyadh') || cNorm.includes('sahara') || cNorm.includes('las vegas') ||
    cNorm.includes('phoenix') || cNorm.includes('arizona') || cNorm.includes('egypte') || cNorm.includes('saoudite')
  ) {
    return 'arid';
  }

  // Mediterranean / Subtropical
  if (
    cNorm.includes('montpellier') || cNorm.includes('marseille') || cNorm.includes('nice') || cNorm.includes('toulon') ||
    cNorm.includes('perpignan') || cNorm.includes('cannes') || cNorm.includes('nimes') || cNorm.includes('avignon') ||
    cNorm.includes('corse') || cNorm.includes('ajaccio') || cNorm.includes('bastia') || cNorm.includes('barcelone') ||
    cNorm.includes('barcelona') || cNorm.includes('madrid') || cNorm.includes('valence') || cNorm.includes('valencia') ||
    cNorm.includes('seville') || cNorm.includes('rome') || cNorm.includes('roma') || cNorm.includes('naples') ||
    cNorm.includes('palerme') || cNorm.includes('athenes') || cNorm.includes('athens') || cNorm.includes('lisbonne') ||
    cNorm.includes('lisbon') || cNorm.includes('los angeles') || cNorm.includes('san diego') || cNorm.includes('miami') ||
    cNorm.includes('floride') || cNorm.includes('florida')
  ) {
    return 'mediterranean';
  }

  // Boreal / Nordic / Alpine
  if (
    cNorm.includes('canada') || cNorm.includes('quebec') || cNorm.includes('montreal') || cNorm.includes('ottawa') ||
    cNorm.includes('toronto') || cNorm.includes('vancouver') || cNorm.includes('calgary') || cNorm.includes('norvege') ||
    cNorm.includes('norway') || cNorm.includes('oslo') || cNorm.includes('suede') || cNorm.includes('sweden') ||
    cNorm.includes('stockholm') || cNorm.includes('finlande') || cNorm.includes('finland') || cNorm.includes('helsinki') ||
    cNorm.includes('islande') || cNorm.includes('iceland') || cNorm.includes('chamonix') || cNorm.includes('grenoble') ||
    cNorm.includes('alpes') || cNorm.includes('suisse') || cNorm.includes('switzerland')
  ) {
    return 'boreal';
  }

  // 2. Latitude-based fallbacks if coordinates are provided
  if (lat !== null && !isNaN(lat)) {
    const absLat = Math.abs(lat);
    if (absLat <= 23.5) return 'tropical';
    if (lat >= 30 && lat <= 44 && lon !== null && lon >= -10 && lon <= 35) return 'mediterranean';
    if (absLat >= 48) return 'boreal';
  }

  // Default Temperate
  return 'temperate';
}

/**
 * Fallback coordinate and city resolver from browser timezone
 */
export function getTimezoneLocationFallback() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  
  const TZ_MAP = {
    'Europe/Paris': { city: 'Paris', country: 'France 🇫🇷', lat: 48.8566, lon: 2.3522, bioregion: 'temperate' },
    'America/Montreal': { city: 'Montréal', country: 'Canada 🇨🇦', lat: 45.5017, lon: -73.5673, bioregion: 'boreal' },
    'America/Toronto': { city: 'Toronto', country: 'Canada 🇨🇦', lat: 43.6532, lon: -79.3832, bioregion: 'boreal' },
    'America/Vancouver': { city: 'Vancouver', country: 'Canada 🇨🇦', lat: 49.2827, lon: -123.1207, bioregion: 'boreal' },
    'America/Guadeloupe': { city: 'Pointe-à-Pitre', country: 'Guadeloupe 🇬🇵', lat: 16.2411, lon: -61.5331, bioregion: 'tropical' },
    'America/Martinique': { city: 'Fort-de-France', country: 'Martinique 🇲🇶', lat: 14.6161, lon: -61.0588, bioregion: 'tropical' },
    'America/Cayenne': { city: 'Cayenne', country: 'Guyane 🇬🇫', lat: 4.9224, lon: -52.3135, bioregion: 'tropical' },
    'Indian/Reunion': { city: 'Saint-Denis', country: 'La Réunion 🇷🇪', lat: -20.8821, lon: 55.4507, bioregion: 'tropical' },
    'Africa/Dakar': { city: 'Dakar', country: 'Sénégal 🇸🇳', lat: 14.6928, lon: -17.4467, bioregion: 'tropical' },
    'Africa/Abidjan': { city: 'Abidjan', country: 'Côte d\'Ivoire 🇨🇮', lat: 5.3599, lon: -4.0083, bioregion: 'tropical' },
    'Africa/Casablanca': { city: 'Casablanca', country: 'Maroc 🇲🇦', lat: 33.5731, lon: -7.5898, bioregion: 'mediterranean' },
    'Africa/Algiers': { city: 'Alger', country: 'Algérie 🇩🇿', lat: 36.7538, lon: 3.0588, bioregion: 'mediterranean' },
    'Africa/Tunis': { city: 'Tunis', country: 'Tunisie 🇹🇳', lat: 36.8065, lon: 10.1815, bioregion: 'mediterranean' },
    'Europe/Madrid': { city: 'Madrid', country: 'Espagne 🇪🇸', lat: 40.4168, lon: -3.7038, bioregion: 'mediterranean' },
    'Europe/Rome': { city: 'Rome', country: 'Italie 🇮🇹', lat: 41.9028, lon: 12.4964, bioregion: 'mediterranean' },
    'Europe/Brussels': { city: 'Bruxelles', country: 'Belgique 🇧🇪', lat: 50.8503, lon: 4.3517, bioregion: 'temperate' },
    'Europe/Geneva': { city: 'Genève', country: 'Suisse 🇨🇭', lat: 46.2044, lon: 6.1432, bioregion: 'temperate' },
    'Europe/London': { city: 'Londres', country: 'Royaume-Uni 🇬🇧', lat: 51.5074, lon: -0.1278, bioregion: 'temperate' },
    'Europe/Berlin': { city: 'Berlin', country: 'Allemagne 🇩🇪', lat: 52.5200, lon: 13.4050, bioregion: 'temperate' }
  };

  return TZ_MAP[tz] || { city: 'Montpellier', country: 'France 🇫🇷', lat: 43.6108, lon: 3.8767, bioregion: 'mediterranean' };
}

/**
 * Fetch Live Weather from Open-Meteo API (Free, zero key, zero quota issues)
 */
export async function fetchLiveWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
    const data = await res.json();
    const cur = data.current || {};
    const code = cur.weather_code ?? 0;
    const wInfo = WMO_WEATHER_MAP[code] || WMO_WEATHER_MAP[0];

    return {
      temperature: Math.round(cur.temperature_2m ?? 20),
      feelsLike: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 20),
      humidity: Math.round(cur.relative_humidity_2m ?? 50),
      weatherCode: code,
      weatherDescFr: wInfo.labelFr,
      weatherDescEn: wInfo.labelEn,
      weatherDescEs: wInfo.labelEs,
      weatherIcon: wInfo.icon,
      isDay: cur.is_day === 1
    };
  } catch (err) {
    console.warn('[geoClimateService] Live weather fetch fallback:', err);
    return {
      temperature: 22,
      feelsLike: 22,
      humidity: 50,
      weatherCode: 0,
      weatherDescFr: 'Ciel dégagé',
      weatherDescEn: 'Clear sky',
      weatherDescEs: 'Cielo despejado',
      weatherIcon: '☀️',
      isDay: true
    };
  }
}

/**
 * Reverse geocode latitude and longitude to City and Country
 */
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision || '';
      let country = data.countryName || '';
      const countryCode = (data.countryCode || '').toUpperCase();
      
      const FLAG_MAP = {
        'FR': '🇫🇷', 'CA': '🇨🇦', 'SN': '🇸🇳', 'CI': '🇨🇮', 'GP': '🇬🇵', 'MQ': '🇲🇶', 'GF': '🇬🇫',
        'RE': '🇷🇪', 'ES': '🇪🇸', 'IT': '🇮🇹', 'BE': '🇧🇪', 'CH': '🇨🇭', 'MA': '🇲🇦', 'DZ': '🇩🇿',
        'TN': '🇹🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪'
      };
      if (countryCode && FLAG_MAP[countryCode]) {
        country = `${country} ${FLAG_MAP[countryCode]}`;
      }
      return { city, country };
    }
  } catch (e) {
    console.warn('[geoClimateService] Reverse geocode fallback:', e);
  }
  return null;
}

/**
 * Geocode a manually typed city name to Lat/Lon & Country
 */
export async function geocodeCity(cityName) {
  if (!cityName || !cityName.trim()) return null;
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName.trim())}&count=1&language=fr&format=json`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        return {
          city: item.name,
          country: item.country || '',
          countryCode: item.country_code || '',
          lat: item.latitude,
          lon: item.longitude
        };
      }
    }
  } catch (err) {
    console.warn('[geoClimateService] City geocoding error:', err);
  }
  return null;
}

/**
 * Main Auto-Detection & Synchronization Function
 */
export async function syncLocationAndClimate(forceRefresh = false) {
  const CACHE_KEY = 'vital_geo_climate_cache';
  const cached = store.get(CACHE_KEY, null);
  const now = Date.now();
  const THREE_HOURS = 3 * 60 * 60 * 1000;

  if (!forceRefresh && cached && cached.updated_at && (now - cached.updated_at < THREE_HOURS)) {
    applyGeoClimateToUI(cached);
    return cached;
  }

  let finalLat = null;
  let finalLon = null;
  let finalCity = '';
  let finalCountry = '';

  // 1. Try Browser HTML5 Geolocation API
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4000,
          maximumAge: 600000,
          enableHighAccuracy: false
        });
      });
      finalLat = pos.coords.latitude;
      finalLon = pos.coords.longitude;
      const geoResult = await reverseGeocode(finalLat, finalLon);
      if (geoResult && geoResult.city) {
        finalCity = geoResult.city;
        finalCountry = geoResult.country;
      }
    } catch (geoErr) {
      // Permission denied or timeout -> Use existing profile or Timezone fallback
    }
  }

  // 2. Fallback to existing user profile if city is set
  const existingProfile = store.get('profile', {});
  if ((!finalCity || !finalCountry) && existingProfile.city) {
    finalCity = existingProfile.city;
    finalCountry = existingProfile.country || '';
    const geocoded = await geocodeCity(finalCity);
    if (geocoded) {
      finalLat = geocoded.lat;
      finalLon = geocoded.lon;
      if (!finalCountry && geocoded.country) finalCountry = geocoded.country;
    }
  }

  // 3. Fallback to Timezone
  if (!finalLat || !finalLon || !finalCity) {
    const tzFallback = getTimezoneLocationFallback();
    finalCity = tzFallback.city;
    finalCountry = tzFallback.country;
    finalLat = tzFallback.lat;
    finalLon = tzFallback.lon;
  }

  // 4. Infer Biorégion & Season
  const bioregionId = inferBioregion(finalCity, finalCountry, finalLat, finalLon);
  const season = getSeasonFromDateAndLat(new Date(), finalLat);

  // 5. Fetch Live Real-Time Weather
  const weather = await fetchLiveWeather(finalLat, finalLon);

  const geoClimateData = {
    city: finalCity,
    country: finalCountry,
    lat: finalLat,
    lon: finalLon,
    bioregion: bioregionId,
    bioregionInfo: BIOREGIONS[bioregionId] || BIOREGIONS.temperate,
    season: season,
    weather: weather,
    updated_at: now
  };

  store.set(CACHE_KEY, geoClimateData);

  // Update profile in store
  existingProfile.city = finalCity;
  existingProfile.country = finalCountry;
  existingProfile.bioregion = bioregionId;
  existingProfile.season = season.id;
  store.set('profile', existingProfile);

  applyGeoClimateToUI(geoClimateData);
  return geoClimateData;
}

/**
 * Dynamically recomputes climate and weather when user edits city/country in settings
 */
export async function handleCityInputChange(cityVal, countryVal = '') {
  if (!cityVal || cityVal.trim().length < 2) return null;

  const geocoded = await geocodeCity(cityVal);
  const lat = geocoded ? geocoded.lat : null;
  const lon = geocoded ? geocoded.lon : null;
  const country = geocoded && geocoded.country ? geocoded.country : countryVal;

  const bioregionId = inferBioregion(cityVal, country, lat, lon);
  const season = getSeasonFromDateAndLat(new Date(), lat || 48.85);
  const weather = (lat !== null && lon !== null) ? await fetchLiveWeather(lat, lon) : {
    temperature: 22,
    weatherDescFr: 'Climat doux',
    weatherDescEn: 'Mild climate',
    weatherDescEs: 'Clima suave',
    weatherIcon: '⛅'
  };

  const updatedData = {
    city: cityVal,
    country: country || countryVal,
    lat: lat,
    lon: lon,
    bioregion: bioregionId,
    bioregionInfo: BIOREGIONS[bioregionId] || BIOREGIONS.temperate,
    season: season,
    weather: weather,
    updated_at: Date.now()
  };

  store.set('vital_geo_climate_cache', updatedData);

  // Update profile
  const p = store.get('profile', {});
  p.city = cityVal;
  if (country) p.country = country;
  p.bioregion = bioregionId;
  p.season = season.id;
  store.set('profile', p);

  applyGeoClimateToUI(updatedData);
  return updatedData;
}

/**
 * Updates UI Badges on Dashboard and Settings
 */
export function applyGeoClimateToUI(data) {
  if (!data) return;

  const curLang = (typeof window !== 'undefined' && window.vitalTrackI18n && typeof window.vitalTrackI18n.getLanguage === 'function')
    ? window.vitalTrackI18n.getLanguage()
    : 'fr';

  const bioInfo = data.bioregionInfo || BIOREGIONS[data.bioregion] || BIOREGIONS.temperate;
  const bioName = curLang === 'en' ? bioInfo.nameEn : (curLang === 'es' ? bioInfo.nameEs : bioInfo.nameFr);
  const seasonName = curLang === 'en' ? data.season.labelEn : (curLang === 'es' ? data.season.labelEs : data.season.labelFr);
  const weatherDesc = curLang === 'en' ? data.weather.weatherDescEn : (curLang === 'es' ? data.weather.weatherDescEs : data.weather.weatherDescFr);

  // 1. Dashboard Top Header Badge
  const dashLocationCity = document.getElementById('dashLocationCity');
  const dashLocationWeather = document.getElementById('dashLocationWeather');
  if (dashLocationCity && dashLocationWeather) {
    dashLocationCity.textContent = `${data.city}${data.country ? ', ' + data.country.split(' ')[0] : ''}`;
    dashLocationWeather.textContent = `${data.weather.weatherIcon} ${data.weather.temperature}°C · ${seasonName} (${bioName.split(' ')[0]})`;
  }

  // 2. Settings Live Climate Badge & Pill
  const settingsBioBadge = document.getElementById('settingsAutoBioregionBadge');
  if (settingsBioBadge) {
    settingsBioBadge.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.3rem;">${bioInfo.icon}</span>
          <div>
            <strong style="color:var(--text); font-size:0.9rem;">${bioName}</strong>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
              ${data.weather.weatherIcon} ${data.weather.temperature}°C · ${weatherDesc} · ${seasonName}
            </div>
          </div>
        </div>
        <span style="font-size:0.72rem; font-weight:800; color:var(--accent); background:var(--accent-glow); padding:3px 10px; border-radius:50px; border:1px solid rgba(16,185,129,0.3);">
          ⚡ AUTO-DÉDUIT
        </span>
      </div>
    `;
  }

  // 3. Keep hidden/override select in sync
  const bioSelect = document.getElementById('profileBioregion');
  if (bioSelect && bioSelect.value !== data.bioregion) {
    bioSelect.value = data.bioregion;
    if (bioSelect._updateVitalSelect) bioSelect._updateVitalSelect();
  }

  // 4. Update live AI context preview if on settings
  if (typeof window !== 'undefined' && typeof window.updateLiveAiPreview === 'function') {
    window.updateLiveAiPreview();
  }
}

/**
 * Navigates directly from Dashboard to Location settings tab
 */
export function navigateToLocationSettings() {
  if (typeof window !== 'undefined' && typeof window.showPage === 'function') {
    window.showPage('settings');
    const aiContextTabBtn = document.querySelector('.settings-tab-btn[data-tab="ai-context"]');
    if (aiContextTabBtn && typeof window.switchSettingsTab === 'function') {
      window.switchSettingsTab('ai-context', aiContextTabBtn);
    }
    setTimeout(() => {
      const cityInput = document.getElementById('profileCity');
      if (cityInput) {
        cityInput.focus();
        cityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  }
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.vitalGeoClimate = {
    syncLocationAndClimate,
    handleCityInputChange,
    navigateToLocationSettings,
    inferBioregion,
    BIOREGIONS
  };
  window.navigateToLocationSettings = navigateToLocationSettings;
}
