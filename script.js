/**
 * ==========================================================
 *  SMART COMPASS — Full Professional Implementation
 *  Features:
 *   - Real device orientation (compass) with smooth animation
 *   - Accurate Qibla bearing (fixed direction indicator)
 *   - Country direction with distance
 *   - AR Mode with camera
 *   - Qibla dedicated mode
 *   - Bilingual (Arabic / English)
 *   - Light / Dark theme
 *   - Starfield animated background
 * ==========================================================
 */

'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────────
const APP = {
    coords: null,           // { lat, lng }
    deviceHeading: 0,       // true magnetic heading (0-360, 0=North)
    tilt: { x: 0, y: 0 },  // device tilt for 3D effect
    targetCountry: { name: 'السعودية', nameEn: 'Saudi Arabia', lat: 23.8859, lng: 45.0792, flag: '🇸🇦' },
    targetBearing: 0,       // bearing from user → target country
    qiblaBearing: 0,        // bearing from user → Mecca
    mode: 'compass',        // 'compass' | 'qibla' | 'ar'
    lang: 'ar',
    darkMode: true,
    orientationGranted: false,
    geoGranted: false,
    compassSupported: false,

    // Smooth rotation state
    _smoothHeading: 0,
    _smoothArrow: 0,
    _smoothQibla: 0,
    _raf: null,

    // Heading accumulator to avoid 360-0 jumps
    _headingAccum: 0,
    _lastRawHeading: null,
};

// Mecca coordinates (Kaaba)
const MECCA = { lat: 21.4225, lng: 39.8262 };

// ─── DOM CACHE ────────────────────────────────────────────────────────────────
const D = {
    // Header
    brandName: document.getElementById('brand-name'),
    brandSub: document.getElementById('brand-sub'),
    themeToggle: document.getElementById('theme-toggle'),
    langToggle: document.getElementById('lang-toggle'),

    // Location
    gpsDot: document.getElementById('gps-dot'),
    locationText: document.getElementById('location-text'),
    coordsText: document.getElementById('coords-text'),

    // Compass
    compassContainer: document.getElementById('compass-container'),
    compassRing: document.getElementById('compass-ring'),
    arrowWrapper: document.getElementById('arrow-wrapper'),
    qiblaMarker: document.getElementById('qibla-marker'),
    qiblaLabel: document.getElementById('qibla-label'),

    // Info cards
    headingDisplay: document.getElementById('heading-display'),
    headingLabel: document.getElementById('heading-label'),
    qiblaDisplay: document.getElementById('qibla-display'),
    qiblaLabelCard: document.getElementById('qibla-label-card'),
    distanceDisplay: document.getElementById('distance-display'),
    distanceLabel: document.getElementById('distance-label'),

    // Target
    bearingNum: document.getElementById('bearing-num'),
    bearingDir: document.getElementById('bearing-dir'),
    countryBtn: document.getElementById('country-select-btn'),
    countryFlag: document.getElementById('country-flag'),
    countryName: document.getElementById('selected-country-name'),
    countryDropdown: document.getElementById('country-list'),
    countrySearch: document.getElementById('country-search'),
    countriesUl: document.getElementById('countries-ul'),

    // Nav
    navBtns: document.querySelectorAll('.nav-btn'),
    btnCompass: document.getElementById('btn-compass'),
    btnQibla: document.getElementById('btn-qibla'),
    btnAR: document.getElementById('btn-ar'),

    // AR
    arFeed: document.getElementById('ar-feed'),
    arOverlay: document.getElementById('ar-overlay'),
    arArrow: document.getElementById('ar-arrow'),
    arLabel: document.getElementById('ar-label'),
    arCountry: document.getElementById('ar-country-name'),
    arBearing: document.getElementById('ar-bearing-text'),
    arDist: document.getElementById('ar-dist-text'),

    // Qibla overlay
    qiblaOverlay: document.getElementById('qibla-overlay'),
    qiblaBackBtn: document.getElementById('qibla-back-btn'),
    qiblaBackText: document.getElementById('qibla-back-text'),
    qiblaRing: document.getElementById('qibla-ring'),
    qiblaArrowWrap: document.getElementById('qibla-arrow-wrap'),
    qiblaDegree: document.getElementById('qibla-degree-display'),
    qiblaStatus: document.getElementById('qibla-status'),
    qiblaInstruction: document.getElementById('qibla-instruction'),

    // Modal
    permissionModal: document.getElementById('permission-modal'),
    startBtn: document.getElementById('start-btn'),
    modalTitle: document.getElementById('modal-title'),
    modalDesc: document.getElementById('modal-desc'),
    allowText: document.getElementById('allow-text'),
    featLoc: document.getElementById('feat-loc'),
    featSensor: document.getElementById('feat-sensor'),
    featCam: document.getElementById('feat-cam'),

    // Toast
    calibToast: document.getElementById('calibration-toast'),
    calibText: document.getElementById('calibration-text'),

    // Labels
    labelCompass: document.getElementById('label-compass'),
    labelQibla: document.getElementById('label-qibla'),
    labelAR: document.getElementById('label-ar'),
    headingLabelEl: document.getElementById('heading-label'),
    distanceLabelEl: document.getElementById('distance-label'),

    // Starfield
    starfield: document.getElementById('starfield'),

    // appContainer
    appContainer: document.getElementById('app-container'),
};

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
    ar: {
        brandName: 'البوصلة الذكية',
        brandSub: 'World Smart Compass',
        detectingLoc: 'جاري تحديد الموقع...',
        locationFound: 'تم تحديد الموقع',
        gpsError: 'خطأ في تحديد الموقع',
        heading: 'الاتجاه',
        qiblaCard: 'اتجاه القبلة',
        distance: 'المسافة',
        searchPlaceholder: 'ابحث عن دولة...',
        modeCompass: 'بوصلة',
        modeQibla: 'القبلة',
        modeAR: 'الواقع المعزز',
        arTarget: 'الهدف',
        qiblaLabel: 'قبلة',
        qiblaStatus: 'اتجاه القبلة',
        qiblaStatusWait: 'جاري حساب اتجاه القبلة...',
        qiblaInstruction: 'وجّه الهاتف حتى يشير السهم نحو القبلة',
        back: 'رجوع',
        modalTitle: 'تفعيل البوصلة',
        modalDesc: 'للحصول على تجربة أفضل، يحتاج التطبيق للوصول لموقعك وحساسات الاتجاه',
        allowAccess: 'ابدأ الآن',
        featLoc: 'تحديد موقعك الجغرافي',
        featSensor: 'حساسات الاتجاه المغناطيسي',
        featCam: 'الكاميرا للواقع المعزز',
        calibrating: 'يرجى تحريك الجهاز بشكل دائري لمعايرة البوصلة',
        permissionDenied: 'تم رفض الإذن. لن تعمل البوصلة.',
        noSensor: 'جهازك لا يدعم حساسات الاتجاه',
    },
    en: {
        brandName: 'Smart Compass',
        brandSub: 'World Direction & Qibla',
        detectingLoc: 'Detecting location...',
        locationFound: 'Location Found',
        gpsError: 'GPS Error',
        heading: 'Heading',
        qiblaCard: 'Qibla Direction',
        distance: 'Distance',
        searchPlaceholder: 'Search country...',
        modeCompass: 'Compass',
        modeQibla: 'Qibla',
        modeAR: 'AR Mode',
        arTarget: 'Target',
        qiblaLabel: 'Qibla',
        qiblaStatus: 'Qibla Direction',
        qiblaStatusWait: 'Calculating Qibla...',
        qiblaInstruction: 'Rotate your device until the arrow points to Qibla',
        back: 'Back',
        modalTitle: 'Enable Compass',
        modalDesc: 'To use the compass and AR features, the app needs access to your location and device sensors.',
        allowAccess: 'Start Now',
        featLoc: 'Your GPS location',
        featSensor: 'Magnetic orientation sensors',
        featCam: 'Camera for AR mode',
        calibrating: 'Move your device in a figure-8 to calibrate the compass',
        permissionDenied: 'Permission denied. Compass will not work.',
        noSensor: 'Your device does not support orientation sensors',
    }
};

function t(key) {
    return T[APP.lang][key] || T.en[key] || key;
}

// ─── COUNTRIES DATABASE ───────────────────────────────────────────────────────
const COUNTRIES = [
    { nameEn: 'Afghanistan', name: 'أفغانستان', lat: 33.9391, lng: 67.7100, flag: '🇦🇫' },
    { nameEn: 'Albania', name: 'ألبانيا', lat: 41.1533, lng: 20.1683, flag: '🇦🇱' },
    { nameEn: 'Algeria', name: 'الجزائر', lat: 28.0339, lng: 1.6596, flag: '🇩🇿' },
    { nameEn: 'Angola', name: 'أنغولا', lat: -11.2027, lng: 17.8739, flag: '🇦🇴' },
    { nameEn: 'Argentina', name: 'الأرجنتين', lat: -38.4161, lng: -63.6167, flag: '🇦🇷' },
    { nameEn: 'Armenia', name: 'أرمينيا', lat: 40.0691, lng: 45.0382, flag: '🇦🇲' },
    { nameEn: 'Australia', name: 'أستراليا', lat: -25.2744, lng: 133.7751, flag: '🇦🇺' },
    { nameEn: 'Austria', name: 'النمسا', lat: 47.5162, lng: 14.5501, flag: '🇦🇹' },
    { nameEn: 'Azerbaijan', name: 'أذربيجان', lat: 40.1431, lng: 47.5769, flag: '🇦🇿' },
    { nameEn: 'Bahrain', name: 'البحرين', lat: 26.0667, lng: 50.5577, flag: '🇧🇭' },
    { nameEn: 'Bangladesh', name: 'بنغلاديش', lat: 23.6850, lng: 90.3563, flag: '🇧🇩' },
    { nameEn: 'Belarus', name: 'بيلاروسيا', lat: 53.7098, lng: 27.9534, flag: '🇧🇾' },
    { nameEn: 'Belgium', name: 'بلجيكا', lat: 50.5039, lng: 4.4699, flag: '🇧🇪' },
    { nameEn: 'Bolivia', name: 'بوليفيا', lat: -16.2902, lng: -63.5887, flag: '🇧🇴' },
    { nameEn: 'Bosnia', name: 'البوسنة والهرسك', lat: 43.9159, lng: 17.6791, flag: '🇧🇦' },
    { nameEn: 'Brazil', name: 'البرازيل', lat: -14.2350, lng: -51.9253, flag: '🇧🇷' },
    { nameEn: 'Bulgaria', name: 'بلغاريا', lat: 42.7339, lng: 25.4858, flag: '🇧🇬' },
    { nameEn: 'Cambodia', name: 'كمبوديا', lat: 12.5657, lng: 104.9910, flag: '🇰🇭' },
    { nameEn: 'Cameroon', name: 'الكاميرون', lat: 7.3697, lng: 12.3547, flag: '🇨🇲' },
    { nameEn: 'Canada', name: 'كندا', lat: 56.1304, lng: -106.3468, flag: '🇨🇦' },
    { nameEn: 'Chad', name: 'تشاد', lat: 15.4542, lng: 18.7322, flag: '🇹🇩' },
    { nameEn: 'Chile', name: 'تشيلي', lat: -35.6751, lng: -71.5430, flag: '🇨🇱' },
    { nameEn: 'China', name: 'الصين', lat: 35.8617, lng: 104.1954, flag: '🇨🇳' },
    { nameEn: 'Colombia', name: 'كولومبيا', lat: 4.5709, lng: -74.2973, flag: '🇨🇴' },
    { nameEn: 'Croatia', name: 'كرواتيا', lat: 45.1000, lng: 15.2000, flag: '🇭🇷' },
    { nameEn: 'Cuba', name: 'كوبا', lat: 21.5218, lng: -77.7812, flag: '🇨🇺' },
    { nameEn: 'Cyprus', name: 'قبرص', lat: 35.1264, lng: 33.4299, flag: '🇨🇾' },
    { nameEn: 'Czech Republic', name: 'التشيك', lat: 49.8175, lng: 15.4730, flag: '🇨🇿' },
    { nameEn: 'Denmark', name: 'الدنمارك', lat: 56.2639, lng: 9.5018, flag: '🇩🇰' },
    { nameEn: 'Djibouti', name: 'جيبوتي', lat: 11.8251, lng: 42.5903, flag: '🇩🇯' },
    { nameEn: 'Ecuador', name: 'الإكوادور', lat: -1.8312, lng: -78.1834, flag: '🇪🇨' },
    { nameEn: 'Egypt', name: 'مصر', lat: 26.8206, lng: 30.8025, flag: '🇪🇬' },
    { nameEn: 'Ethiopia', name: 'إثيوبيا', lat: 9.1450, lng: 40.4897, flag: '🇪🇹' },
    { nameEn: 'Finland', name: 'فنلندا', lat: 61.9241, lng: 25.7482, flag: '🇫🇮' },
    { nameEn: 'France', name: 'فرنسا', lat: 46.2276, lng: 2.2137, flag: '🇫🇷' },
    { nameEn: 'Germany', name: 'ألمانيا', lat: 51.1657, lng: 10.4515, flag: '🇩🇪' },
    { nameEn: 'Ghana', name: 'غانا', lat: 7.9465, lng: -1.0232, flag: '🇬🇭' },
    { nameEn: 'Greece', name: 'اليونان', lat: 39.0742, lng: 21.8243, flag: '🇬🇷' },
    { nameEn: 'Hungary', name: 'هنغاريا', lat: 47.1625, lng: 19.5033, flag: '🇭🇺' },
    { nameEn: 'Iceland', name: 'آيسلندا', lat: 64.9631, lng: -19.0208, flag: '🇮🇸' },
    { nameEn: 'India', name: 'الهند', lat: 20.5937, lng: 78.9629, flag: '🇮🇳' },
    { nameEn: 'Indonesia', name: 'إندونيسيا', lat: -0.7893, lng: 113.9213, flag: '🇮🇩' },
    { nameEn: 'Iran', name: 'إيران', lat: 32.4279, lng: 53.6880, flag: '🇮🇷' },
    { nameEn: 'Iraq', name: 'العراق', lat: 33.2232, lng: 43.6793, flag: '🇮🇶' },
    { nameEn: 'Ireland', name: 'أيرلندا', lat: 53.1424, lng: -7.6921, flag: '🇮🇪' },
    { nameEn: 'Italy', name: 'إيطاليا', lat: 41.8719, lng: 12.5674, flag: '🇮🇹' },
    { nameEn: 'Japan', name: 'اليابان', lat: 36.2048, lng: 138.2529, flag: '🇯🇵' },
    { nameEn: 'Jordan', name: 'الأردن', lat: 30.5852, lng: 36.2384, flag: '🇯🇴' },
    { nameEn: 'Kazakhstan', name: 'كازاخستان', lat: 48.0196, lng: 66.9237, flag: '🇰🇿' },
    { nameEn: 'Kenya', name: 'كينيا', lat: -0.0236, lng: 37.9062, flag: '🇰🇪' },
    { nameEn: 'Kuwait', name: 'الكويت', lat: 29.3117, lng: 47.4818, flag: '🇰🇼' },
    { nameEn: 'Lebanon', name: 'لبنان', lat: 33.8547, lng: 35.8623, flag: '🇱🇧' },
    { nameEn: 'Libya', name: 'ليبيا', lat: 26.3351, lng: 17.2283, flag: '🇱🇾' },
    { nameEn: 'Malaysia', name: 'ماليزيا', lat: 4.2105, lng: 101.9758, flag: '🇲🇾' },
    { nameEn: 'Maldives', name: 'جزر المالديف', lat: 3.2028, lng: 73.2207, flag: '🇲🇻' },
    { nameEn: 'Mali', name: 'مالي', lat: 17.5707, lng: -3.9962, flag: '🇲🇱' },
    { nameEn: 'Mexico', name: 'المكسيك', lat: 23.6345, lng: -102.5528, flag: '🇲🇽' },
    { nameEn: 'Morocco', name: 'المغرب', lat: 31.7917, lng: -7.0926, flag: '🇲🇦' },
    { nameEn: 'Mozambique', name: 'موزمبيق', lat: -18.6657, lng: 35.5296, flag: '🇲🇿' },
    { nameEn: 'Nepal', name: 'نيبال', lat: 28.3949, lng: 84.1240, flag: '🇳🇵' },
    { nameEn: 'Netherlands', name: 'هولندا', lat: 52.1326, lng: 5.2913, flag: '🇳🇱' },
    { nameEn: 'New Zealand', name: 'نيوزيلندا', lat: -40.9006, lng: 174.8860, flag: '🇳🇿' },
    { nameEn: 'Nigeria', name: 'نيجيريا', lat: 9.0820, lng: 8.6753, flag: '🇳🇬' },
    { nameEn: 'North Korea', name: 'كوريا الشمالية', lat: 40.3399, lng: 127.5101, flag: '🇰🇵' },
    { nameEn: 'Norway', name: 'النرويج', lat: 60.4720, lng: 8.4689, flag: '🇳🇴' },
    { nameEn: 'Oman', name: 'عُمان', lat: 21.4735, lng: 55.9754, flag: '🇴🇲' },
    { nameEn: 'Pakistan', name: 'باكستان', lat: 30.3753, lng: 69.3451, flag: '🇵🇰' },
    { nameEn: 'Palestine', name: 'فلسطين', lat: 31.9522, lng: 35.2332, flag: '🇵🇸' },
    { nameEn: 'Panama', name: 'بنما', lat: 8.5380, lng: -80.7821, flag: '🇵🇦' },
    { nameEn: 'Peru', name: 'بيرو', lat: -9.1900, lng: -75.0152, flag: '🇵🇪' },
    { nameEn: 'Philippines', name: 'الفلبين', lat: 12.8797, lng: 121.7740, flag: '🇵🇭' },
    { nameEn: 'Poland', name: 'بولندا', lat: 51.9194, lng: 19.1451, flag: '🇵🇱' },
    { nameEn: 'Portugal', name: 'البرتغال', lat: 39.3999, lng: -8.2245, flag: '🇵🇹' },
    { nameEn: 'Qatar', name: 'قطر', lat: 25.3548, lng: 51.1839, flag: '🇶🇦' },
    { nameEn: 'Romania', name: 'رومانيا', lat: 45.9432, lng: 24.9668, flag: '🇷🇴' },
    { nameEn: 'Russia', name: 'روسيا', lat: 61.5240, lng: 105.3188, flag: '🇷🇺' },
    { nameEn: 'Saudi Arabia', name: 'المملكة العربية السعودية', lat: 23.8859, lng: 45.0792, flag: '🇸🇦' },
    { nameEn: 'Senegal', name: 'السنغال', lat: 14.4974, lng: -14.4524, flag: '🇸🇳' },
    { nameEn: 'Serbia', name: 'صربيا', lat: 44.0165, lng: 21.0059, flag: '🇷🇸' },
    { nameEn: 'Singapore', name: 'سنغافورة', lat: 1.3521, lng: 103.8198, flag: '🇸🇬' },
    { nameEn: 'Somalia', name: 'الصومال', lat: 5.1521, lng: 46.1996, flag: '🇸🇴' },
    { nameEn: 'South Africa', name: 'جنوب أفريقيا', lat: -30.5595, lng: 22.9375, flag: '🇿🇦' },
    { nameEn: 'South Korea', name: 'كوريا الجنوبية', lat: 35.9078, lng: 127.7669, flag: '🇰🇷' },
    { nameEn: 'Spain', name: 'إسبانيا', lat: 40.4637, lng: -3.7492, flag: '🇪🇸' },
    { nameEn: 'Sri Lanka', name: 'سريلانكا', lat: 7.8731, lng: 80.7718, flag: '🇱🇰' },
    { nameEn: 'Sudan', name: 'السودان', lat: 12.8628, lng: 30.2176, flag: '🇸🇩' },
    { nameEn: 'Sweden', name: 'السويد', lat: 60.1282, lng: 18.6435, flag: '🇸🇪' },
    { nameEn: 'Switzerland', name: 'سويسرا', lat: 46.8182, lng: 8.2275, flag: '🇨🇭' },
    { nameEn: 'Syria', name: 'سوريا', lat: 34.8021, lng: 38.9968, flag: '🇸🇾' },
    { nameEn: 'Taiwan', name: 'تايوان', lat: 23.6978, lng: 120.9605, flag: '🇹🇼' },
    { nameEn: 'Thailand', name: 'تايلاند', lat: 15.8700, lng: 100.9925, flag: '🇹🇭' },
    { nameEn: 'Tunisia', name: 'تونس', lat: 33.8869, lng: 9.5375, flag: '🇹🇳' },
    { nameEn: 'Turkey', name: 'تركيا', lat: 38.9637, lng: 35.2433, flag: '🇹🇷' },
    { nameEn: 'UAE', name: 'الإمارات العربية المتحدة', lat: 23.4241, lng: 53.8478, flag: '🇦🇪' },
    { nameEn: 'Uganda', name: 'أوغندا', lat: 1.3733, lng: 32.2903, flag: '🇺🇬' },
    { nameEn: 'Ukraine', name: 'أوكرانيا', lat: 48.3794, lng: 31.1656, flag: '🇺🇦' },
    { nameEn: 'United Kingdom', name: 'المملكة المتحدة', lat: 55.3781, lng: -3.4360, flag: '🇬🇧' },
    { nameEn: 'United States', name: 'الولايات المتحدة', lat: 37.0902, lng: -95.7129, flag: '🇺🇸' },
    { nameEn: 'Uruguay', name: 'أوروغواي', lat: -32.5228, lng: -55.7658, flag: '🇺🇾' },
    { nameEn: 'Uzbekistan', name: 'أوزبكستان', lat: 41.3775, lng: 64.5853, flag: '🇺🇿' },
    { nameEn: 'Venezuela', name: 'فنزويلا', lat: 6.4238, lng: -66.5897, flag: '🇻🇪' },
    { nameEn: 'Vietnam', name: 'فيتنام', lat: 14.0583, lng: 108.2772, flag: '🇻🇳' },
    { nameEn: 'Yemen', name: 'اليمن', lat: 15.5527, lng: 48.5164, flag: '🇾🇪' },
    { nameEn: 'Zambia', name: 'زامبيا', lat: -13.1339, lng: 27.8493, flag: '🇿🇲' },
    { nameEn: 'Zimbabwe', name: 'زيمبابوي', lat: -19.0154, lng: 29.1549, flag: '🇿🇼' },
];

// ─── MATH HELPERS ─────────────────────────────────────────────────────────────
const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;

/**
 * Calculate true bearing from (lat1,lng1) to (lat2,lng2) using Haversine
 * Returns 0-360 degrees clockwise from North
 */
function getBearing(lat1, lng1, lat2, lng2) {
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δλ = toRad(lng2 - lng1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Great-circle distance in km
 */
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Smoothly rotate to target using shortest path interpolation
 * Avoids 360→0 jump by accumulating continuous rotation
 */
function smoothAngle(current, target, factor = 0.12) {
    let diff = target - current;
    // Normalize to shortest path
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return current + diff * factor;
}

/**
 * Convert bearing (0=N, 90=E, 180=S, 270=W) to compass label
 */
function bearingToDir(b) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return dirs[Math.round(b / 45) % 8];
}

// ─── COMPASS FACE GENERATION ─────────────────────────────────────────────────
const CARDINALS = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };

function buildCompassFace() {
    const ring = D.compassRing;
    ring.innerHTML = '';
    const containerR = 140; // half of 280px

    for (let deg = 0; deg < 360; deg += 2) {
        const tick = document.createElement('div');
        const isCardinal = deg % 90 === 0;
        const isMajor = deg % 10 === 0;

        tick.className = 'tick' + (isCardinal ? ' cardinal' : isMajor ? ' major' : '');
        tick.style.transform = `rotate(${deg}deg)`;
        tick.style.transformOrigin = `50% ${containerR}px`;
        ring.appendChild(tick);

        // Cardinal letters (N, E, S, W)
        if (isCardinal) {
            const label = document.createElement('div');
            label.className = 'cardinal-label ' + (['north', 'east', 'south', 'west'][deg / 90]);
            label.textContent = CARDINALS[deg];
            label.style.transform = `rotate(${deg}deg)`;
            label.style.transformOrigin = `50% ${containerR}px`;
            ring.appendChild(label);
        }
        // Degree numbers every 30°
        else if (deg % 30 === 0) {
            const label = document.createElement('div');
            label.className = 'degree-label';
            label.textContent = deg + '°';
            label.style.transform = `rotate(${deg}deg)`;
            label.style.transformOrigin = `50% ${containerR}px`;
            ring.appendChild(label);
        }
    }

    // Build Qibla overlay ring similarly
    buildQiblaRing();
}

function buildQiblaRing() {
    const ring = D.qiblaRing;
    if (!ring) return;
    ring.innerHTML = '';
    const r = 130;
    for (let deg = 0; deg < 360; deg += 5) {
        const tick = document.createElement('div');
        const isMajor = deg % 45 === 0;
        tick.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${isMajor ? 5 : 8}px;
            width: ${isMajor ? 3 : 1.5}px;
            height: ${isMajor ? 14 : 8}px;
            background: rgba(255,215,0,${isMajor ? 0.6 : 0.25});
            transform-origin: 50% ${r}px;
            transform: rotate(${deg}deg);
            margin-left: ${isMajor ? -1.5 : -0.75}px;
            border-radius: 2px;
        `;
        ring.appendChild(tick);
    }
}

// ─── SENSORS ──────────────────────────────────────────────────────────────────
function startSensors() {
    D.permissionModal.classList.add('hidden');
    localStorage.setItem('compassPermission', '1');

    startGeolocation();
    startOrientation();
    startCamera();
}

let countryDetected = false;

function detectUserCountry(lat, lng) {
    if (countryDetected) return;
    countryDetected = true;

    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
        .then(res => res.json())
        .then(data => {
            if (data && data.countryName) {
                const nameEn = data.countryName;
                let matched = COUNTRIES.find(c =>
                    c.nameEn.toLowerCase() === nameEn.toLowerCase() ||
                    nameEn.toLowerCase().includes(c.nameEn.toLowerCase())
                );

                if (matched && matched.nameEn !== APP.targetCountry.nameEn) {
                    selectCountry(matched);
                }
            }
        })
        .catch(err => console.warn('Reverse Geocoding Error:', err));
}

function startGeolocation() {
    if (!navigator.geolocation) {
        D.locationText.textContent = t('gpsError');
        D.gpsDot.classList.add('error');
        return;
    }

    D.locationText.textContent = t('detectingLoc');

    navigator.geolocation.watchPosition(
        pos => {
            APP.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            APP.geoGranted = true;
            D.gpsDot.classList.remove('error');
            D.gpsDot.classList.add('active');
            D.locationText.textContent = t('locationFound');
            D.coordsText.textContent = `${APP.coords.lat.toFixed(4)}°, ${APP.coords.lng.toFixed(4)}°`;

            recalcBearings();
            detectUserCountry(pos.coords.latitude, pos.coords.longitude);
        },
        err => {
            D.gpsDot.classList.add('error');
            D.gpsDot.classList.remove('active');
            D.locationText.textContent = t('gpsError');
            console.warn('Geo Error:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
}

let orientationListenerActive = false;
let absoluteListenerActive = false;

function startOrientation() {
    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(resp => {
                if (resp === 'granted') {
                    attachOrientationListeners();
                } else {
                    showToast(t('permissionDenied'));
                }
            })
            .catch(err => {
                console.warn('DeviceOrientation permission error:', err);
                attachOrientationListeners(); // try anyway
            });
    } else {
        attachOrientationListeners();
    }
}

function attachOrientationListeners() {
    // Prefer absolute orientation (Android Chrome)
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    absoluteListenerActive = true;

    // Standard fallback
    window.addEventListener('deviceorientation', handleOrientationFallback, true);
    orientationListenerActive = true;

    APP.compassSupported = true;
}

let absoluteReceived = false;

function handleOrientation(evt) {
    // This is deviceorientationabsolute — most reliable
    absoluteReceived = true;
    if (evt.alpha === null) return;

    // Android: heading = 360 - alpha (alpha is CCW from North, we need CW)
    const rawHeading = (360 - evt.alpha + 360) % 360;

    processTilt(evt);
    processHeading(rawHeading);
}

function handleOrientationFallback(evt) {
    // Skip if we're already getting absolute events
    if (absoluteReceived) return;
    if (evt.alpha === null) return;

    let rawHeading;
    if (evt.webkitCompassHeading !== undefined && evt.webkitCompassHeading !== null) {
        // iOS — webkitCompassHeading is direct true North bearing
        rawHeading = evt.webkitCompassHeading;
    } else {
        // Standard non-absolute — alpha is relative, this may drift on some devices
        rawHeading = (360 - evt.alpha + 360) % 360;
    }

    processTilt(evt);
    processHeading(rawHeading);
}

function processTilt(evt) {
    if (evt.beta !== null && evt.gamma !== null) {
        // beta: front-back tilt (-180 to 180), gamma: left-right tilt (-90 to 90)
        APP.tilt.x = Math.max(-12, Math.min(12, evt.beta / 5));
        APP.tilt.y = Math.max(-12, Math.min(12, evt.gamma / 5));
    }
}

function processHeading(raw) {
    // Accumulate heading to avoid 360→0 jumps
    if (APP._lastRawHeading === null) {
        APP._headingAccum = raw;
    } else {
        let delta = raw - APP._lastRawHeading;
        while (delta > 180) delta -= 360;
        while (delta < -180) delta += 360;
        APP._headingAccum += delta;
    }
    APP._lastRawHeading = raw;
    APP.deviceHeading = ((raw % 360) + 360) % 360;

    // Schedule UI update
    if (!APP._raf) {
        APP._raf = requestAnimationFrame(renderFrame);
    }
}

function startCamera() {
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => { D.arFeed.srcObject = stream; })
        .catch(err => console.warn('Camera:', err.message));
}

// ─── BEARING CALCULATIONS ──────────────────────────────────────────────────────
function recalcBearings() {
    if (!APP.coords) return;
    const { lat, lng } = APP.coords;

    // Target country bearing
    APP.targetBearing = getBearing(lat, lng, APP.targetCountry.lat, APP.targetCountry.lng);

    // Distance to target
    const dist = getDistance(lat, lng, APP.targetCountry.lat, APP.targetCountry.lng);
    const distStr = dist >= 1000
        ? `${(dist / 1000).toFixed(1)} ألف كم`
        : `${Math.round(dist)} كم`;
    D.distanceDisplay.textContent = dist >= 1000
        ? `${(dist / 1000).toFixed(1)}K km`
        : `${Math.round(dist)} km`;

    // Qibla bearing
    APP.qiblaBearing = getBearing(lat, lng, MECCA.lat, MECCA.lng);
    D.qiblaDisplay.textContent = Math.round(APP.qiblaBearing) + '°';
    D.qiblaDegree.textContent = Math.round(APP.qiblaBearing) + '°';
    D.qiblaStatus.textContent = t('qiblaStatus') + ` · ${Math.round(APP.qiblaBearing)}°`;

    // AR info
    D.arDist.textContent = `${Math.round(dist).toLocaleString()} km`;

    renderFrame();
}

// ─── RENDER LOOP ───────────────────────────────────────────────────────────────
function renderFrame() {
    APP._raf = null;

    const heading = APP.deviceHeading;
    const tilt = APP.tilt;

    // ── 1. Compass ring rotates opposite to device heading (North stays up)
    APP._smoothHeading = smoothAngle(APP._smoothHeading, -heading, 0.18);
    const ringRot = APP._smoothHeading;
    const tiltX = tilt.x * 0.85;
    const tiltY = tilt.y * 0.85;

    D.compassContainer.style.transform =
        `rotate(${ringRot}deg) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

    // ── 2. Direction arrow: fixed on screen, points toward target
    //    Arrow angle = targetBearing - deviceHeading (relative to screen top)
    const relativeTarget = APP.targetBearing - heading;
    APP._smoothArrow = smoothAngle(APP._smoothArrow, relativeTarget, 0.15);
    D.arrowWrapper.style.transform = `rotate(${APP._smoothArrow}deg)`;

    // ── 3. Qibla marker inside compass ring
    //    Since compass ring rotates by -heading, qibla marker must rotate by
    //    qiblaBearing (absolute), so visually it stays in the correct direction
    //    The qibla marker counteracts parent rotation: rotate by qiblaBearing
    APP._smoothQibla = smoothAngle(APP._smoothQibla, APP.qiblaBearing, 0.15);
    D.qiblaMarker.style.transform = `rotate(${APP._smoothQibla}deg)`;

    // ── 4. Heading display
    D.headingDisplay.textContent = Math.round(heading) + '°';
    D.bearingNum.textContent = Math.round(APP.targetBearing);
    D.bearingDir.textContent = bearingToDir(APP.targetBearing);

    // ── 5. AR overlay
    if (APP.mode === 'ar') {
        const relAR = APP.targetBearing - heading;
        D.arArrow.style.transform = `translate(-50%, -50%) rotate(${relAR}deg)`;
        D.arBearing.textContent = Math.round(APP.targetBearing) + '°';
    }

    // ── 6. Qibla mode overlay
    if (APP.mode === 'qibla') {
        // Arrow should point toward Qibla relative to current device heading
        const relQibla = APP.qiblaBearing - heading;
        D.qiblaArrowWrap.style.transform = `rotate(${relQibla}deg)`;
    }

    // Request next frame if mode requires continuous update
    if (APP.mode !== 'compass' || true) {
        // Always loop for smooth animation
        APP._raf = requestAnimationFrame(renderFrame);
    }
}

// ─── COUNTRY UI ───────────────────────────────────────────────────────────────
function renderCountries(list) {
    D.countriesUl.innerHTML = '';
    if (list.length === 0) {
        const li = document.createElement('li');
        li.textContent = APP.lang === 'ar' ? 'لا توجد نتائج' : 'No results';
        li.style.color = 'var(--text-muted)';
        D.countriesUl.appendChild(li);
        return;
    }

    list.forEach(c => {
        const li = document.createElement('li');
        const isSelected = c.nameEn === APP.targetCountry.nameEn;
        if (isSelected) li.classList.add('selected');

        const flag = document.createElement('span');
        flag.textContent = c.flag;

        const name = document.createElement('span');
        name.textContent = APP.lang === 'ar' ? c.name : c.nameEn;

        li.appendChild(flag);
        li.appendChild(name);

        li.addEventListener('click', () => selectCountry(c));
        D.countriesUl.appendChild(li);
    });
}

function selectCountry(c) {
    APP.targetCountry = c;
    const displayName = APP.lang === 'ar' ? c.name : c.nameEn;
    D.countryFlag.textContent = c.flag;
    D.countryName.textContent = displayName;
    D.arCountry.textContent = displayName;
    D.countryDropdown.classList.add('hidden');
    D.countryBtn.classList.remove('open');
    D.countrySearch.value = '';
    renderCountries(COUNTRIES);
    recalcBearings();
}

function filterCountries(q) {
    const lower = q.toLowerCase();
    return COUNTRIES.filter(c =>
        c.nameEn.toLowerCase().includes(lower) ||
        c.name.includes(q)
    );
}

// ─── MODE SWITCHING ───────────────────────────────────────────────────────────
function switchMode(mode) {
    APP.mode = mode;

    D.navBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Reset overlays
    D.arFeed.style.display = 'none';
    D.arOverlay.classList.add('hidden');
    D.qiblaOverlay.classList.add('hidden');
    D.appContainer.style.display = 'flex';

    if (mode === 'ar') {
        D.arFeed.style.display = 'block';
        D.arOverlay.classList.remove('hidden');
        D.arLabel.textContent = t('arTarget');
        D.arCountry.textContent = APP.lang === 'ar' ? APP.targetCountry.name : APP.targetCountry.nameEn;
    } else if (mode === 'qibla') {
        D.qiblaOverlay.classList.remove('hidden');
        D.qiblaInstruction.textContent = t('qiblaInstruction');
        if (!APP.coords) {
            D.qiblaStatus.textContent = t('qiblaStatusWait');
        }
    }
}

// ─── THEME ────────────────────────────────────────────────────────────────────
function toggleTheme() {
    APP.darkMode = !APP.darkMode;
    document.body.classList.toggle('theme-light', !APP.darkMode);
    localStorage.setItem('compassTheme', APP.darkMode ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    D.themeToggle.innerHTML = APP.darkMode
        ? `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
}

// ─── LANGUAGE ──────────────────────────────────────────────────────────────────
function toggleLang() {
    APP.lang = APP.lang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('compassLang', APP.lang);
    applyLang();
}

function applyLang() {
    const isAR = APP.lang === 'ar';
    document.documentElement.lang = APP.lang;
    document.documentElement.dir = isAR ? 'rtl' : 'ltr';
    D.langToggle.textContent = isAR ? 'EN' : 'عر';

    // Update all text
    D.brandName.textContent = t('brandName');
    D.brandSub.textContent = t('brandSub');
    D.headingLabel.textContent = t('heading');
    D.qiblaLabelCard.textContent = t('qiblaCard');
    D.distanceLabelEl.textContent = t('distance');
    D.qiblaLabel.textContent = t('qiblaLabel');
    D.labelCompass.textContent = t('modeCompass');
    D.labelQibla.textContent = t('modeQibla');
    D.labelAR.textContent = t('modeAR');
    D.countrySearch.placeholder = t('searchPlaceholder');
    D.qiblaInstruction.textContent = t('qiblaInstruction');
    if (D.qiblaBackText) D.qiblaBackText.textContent = t('back');
    D.modalTitle.textContent = t('modalTitle');
    D.modalDesc.textContent = t('modalDesc');
    D.allowText.textContent = t('allowAccess');
    D.featLoc.textContent = t('featLoc');
    D.featSensor.textContent = t('featSensor');
    D.featCam.textContent = t('featCam');

    // Location status
    if (APP.coords) {
        D.locationText.textContent = t('locationFound');
    } else {
        D.locationText.textContent = t('detectingLoc');
    }

    // Re-render countries with new language
    const q = D.countrySearch.value;
    renderCountries(q ? filterCountries(q) : COUNTRIES);

    // Update selected country name
    D.countryName.textContent = isAR ? APP.targetCountry.name : APP.targetCountry.nameEn;
    D.arCountry.textContent = isAR ? APP.targetCountry.name : APP.targetCountry.nameEn;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, duration = 4000) {
    D.calibToast.classList.remove('hidden');
    D.calibText.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => D.calibToast.classList.add('hidden'), duration);
}

// ─── STARFIELD ────────────────────────────────────────────────────────────────
function initStarfield() {
    const canvas = D.starfield;
    const ctx = canvas.getContext('2d');
    let stars = [];
    let W, H;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createStars(n = 120) {
        stars = [];
        for (let i = 0; i < n; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 1.2 + 0.3,
                alpha: Math.random() * 0.6 + 0.1,
                speed: Math.random() * 0.3 + 0.05,
                phase: Math.random() * Math.PI * 2,
            });
        }
    }

    function draw(t) {
        ctx.clearRect(0, 0, W, H);
        for (const s of stars) {
            const a = s.alpha + Math.sin(t * s.speed + s.phase) * 0.15;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, a)})`;
            ctx.fill();
        }
        requestAnimationFrame(draw);
    }

    resize();
    createStars();
    window.addEventListener('resize', () => { resize(); createStars(); });
    requestAnimationFrame(draw);
}

// ─── PERMISSIONS REQUEST ──────────────────────────────────────────────────────
function requestPermissions() {
    startSensors();
}

// ─── INIT ──────────────────────────────────────────────────────────────────────
function init() {
    // Load preferences
    const savedTheme = localStorage.getItem('compassTheme');
    const savedLang = localStorage.getItem('compassLang');

    if (savedTheme === 'light') {
        APP.darkMode = false;
        document.body.classList.add('theme-light');
    }
    if (savedLang) {
        APP.lang = savedLang;
    }

    updateThemeIcon();
    applyLang();
    buildCompassFace();
    renderCountries(COUNTRIES);
    initStarfield();

    // Start render loop immediately (shows static compass)
    APP._raf = requestAnimationFrame(renderFrame);

    // Event listeners
    D.themeToggle.addEventListener('click', toggleTheme);
    D.langToggle.addEventListener('click', toggleLang);
    D.startBtn.addEventListener('click', requestPermissions);
    D.qiblaBackBtn.addEventListener('click', () => switchMode('compass'));

    D.countryBtn.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = !D.countryDropdown.classList.contains('hidden');
        D.countryDropdown.classList.toggle('hidden');
        D.countryBtn.classList.toggle('open', !isOpen);
        if (!isOpen) setTimeout(() => D.countrySearch.focus(), 50);
    });

    document.addEventListener('click', e => {
        if (!D.countryDropdown.contains(e.target) && e.target !== D.countryBtn) {
            D.countryDropdown.classList.add('hidden');
            D.countryBtn.classList.remove('open');
        }
    });

    D.countrySearch.addEventListener('input', e => {
        renderCountries(filterCountries(e.target.value));
    });

    D.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Auto-start if already granted before
    if (localStorage.getItem('compassPermission') === '1') {
        D.permissionModal.classList.add('hidden');
        startSensors();
    }

    // Calibration hint after 30 seconds if no heading change detected
    setTimeout(() => {
        if (APP.compassSupported && APP._lastRawHeading === null) {
            showToast(t('calibrating'), 6000);
        }
    }, 30000);

    // Show calibration toast on first run
    setTimeout(() => {
        if (APP.compassSupported) {
            D.compassContainer.classList.add('calibrating');
            setTimeout(() => D.compassContainer.classList.remove('calibrating'), 3000);
        }
    }, 1000);
}

async function sendRealDataToDatabase() {
    console.log("محاولة إرسال البيانات...");

    // جلب الزاوية والاتجاه من العناصر الموجودة في صفحتك
    const angle = document.getElementById("heading-display")?.innerText || "0";
    const direction = document.getElementById("bearing-dir")?.innerText || "N";
    const location = "Yemen - Marib"; // القيمة الافتراضية كما في صورك

    const formData = new FormData();
    formData.append('angle', parseInt(angle));
    formData.append('direction', direction);
    formData.append('location', location);

    try {
        const response = await fetch("save.php", {
            method: "POST",
            body: formData
        });
        const result = await response.text();
        console.log("استجابة السيرفر:", result);
    } catch (error) {
        console.error("خطأ في الاتصال بـ save.php:", error);
    }
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
