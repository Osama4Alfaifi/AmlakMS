// Saudi Arabia's 13 official administrative regions (المناطق الإدارية) with
// their major cities/governorates, used by the property intake wizard's
// location step (app/admin/properties/new) to drive the region/city
// dropdowns and fly the map picker to the right area. Coordinates are
// approximate city-center points — good enough to recenter the map; the
// user still drags the pin to the exact plot.
export interface SaudiCity {
  name: string;
  lat: number;
  lng: number;
}

export interface SaudiRegion {
  name: string;
  // First city is treated as the region's representative center (used to
  // fly the map there when only the region, not yet a city, is picked).
  cities: SaudiCity[];
}

export const SAUDI_REGIONS: SaudiRegion[] = [
  {
    name: "منطقة الرياض",
    cities: [
      { name: "الرياض", lat: 24.7136, lng: 46.6753 },
      { name: "الخرج", lat: 24.1556, lng: 47.3345 },
      { name: "الدوادمي", lat: 24.5088, lng: 44.3922 },
      { name: "المجمعة", lat: 25.9065, lng: 45.3547 },
      { name: "الزلفي", lat: 26.2571, lng: 44.8134 },
      { name: "وادي الدواسر", lat: 20.4808, lng: 45.1878 },
      { name: "عفيف", lat: 23.9110, lng: 42.9280 },
      { name: "حوطة بني تميم", lat: 23.5000, lng: 46.8500 },
      { name: "القويعية", lat: 24.0575, lng: 45.2983 },
      { name: "الأفلاج", lat: 22.2480, lng: 46.7132 },
      { name: "شقراء", lat: 25.2400, lng: 45.2530 },
      { name: "ضرما", lat: 24.9333, lng: 46.3667 },
      { name: "حريملاء", lat: 25.1167, lng: 46.4667 },
    ],
  },
  {
    name: "منطقة مكة المكرمة",
    cities: [
      { name: "مكة المكرمة", lat: 21.3891, lng: 39.8579 },
      { name: "جدة", lat: 21.4858, lng: 39.1925 },
      { name: "الطائف", lat: 21.2703, lng: 40.4158 },
      { name: "رابغ", lat: 22.7986, lng: 39.0349 },
      { name: "القنفذة", lat: 19.1264, lng: 41.0790 },
      { name: "الليث", lat: 20.1500, lng: 40.2667 },
      { name: "خليص", lat: 22.1400, lng: 39.4300 },
      { name: "الجموم", lat: 21.6500, lng: 39.6833 },
      { name: "الكامل", lat: 20.5333, lng: 41.0333 },
    ],
  },
  {
    name: "منطقة المدينة المنورة",
    cities: [
      { name: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
      { name: "ينبع", lat: 24.0895, lng: 38.0618 },
      { name: "العلا", lat: 26.6099, lng: 37.9224 },
      { name: "بدر", lat: 23.7783, lng: 38.7906 },
      { name: "المهد", lat: 23.5167, lng: 40.8500 },
      { name: "خيبر", lat: 25.7000, lng: 39.2833 },
      { name: "الحناكية", lat: 24.8667, lng: 40.5333 },
    ],
  },
  {
    name: "المنطقة الشرقية",
    cities: [
      { name: "الدمام", lat: 26.4207, lng: 50.0888 },
      { name: "الخبر", lat: 26.2172, lng: 50.1971 },
      { name: "الظهران", lat: 26.2361, lng: 50.1046 },
      { name: "الأحساء", lat: 25.3833, lng: 49.5867 },
      { name: "الجبيل", lat: 27.0046, lng: 49.6600 },
      { name: "القطيف", lat: 26.5205, lng: 49.9976 },
      { name: "حفر الباطن", lat: 28.4342, lng: 45.9601 },
      { name: "الخفجي", lat: 28.4290, lng: 48.4913 },
      { name: "النعيرية", lat: 27.4667, lng: 48.4833 },
      { name: "رأس تنورة", lat: 26.6444, lng: 50.1653 },
      { name: "بقيق", lat: 25.9333, lng: 49.6667 },
    ],
  },
  {
    name: "منطقة عسير",
    cities: [
      { name: "أبها", lat: 18.2164, lng: 42.5053 },
      { name: "خميس مشيط", lat: 18.3000, lng: 42.7333 },
      { name: "بيشة", lat: 20.0000, lng: 42.6000 },
      { name: "النماص", lat: 19.1167, lng: 42.1500 },
      { name: "محايل عسير", lat: 18.5528, lng: 42.0361 },
      { name: "ظهران الجنوب", lat: 17.6500, lng: 43.4167 },
      { name: "سراة عبيدة", lat: 18.6500, lng: 42.3333 },
      { name: "رجال ألمع", lat: 18.1667, lng: 42.2833 },
      { name: "تنومة", lat: 18.9667, lng: 42.0167 },
    ],
  },
  {
    name: "منطقة تبوك",
    cities: [
      { name: "تبوك", lat: 28.3838, lng: 36.5550 },
      { name: "الوجه", lat: 26.2377, lng: 36.4718 },
      { name: "ضباء", lat: 27.3480, lng: 35.6900 },
      { name: "تيماء", lat: 27.6250, lng: 38.5333 },
      { name: "أملج", lat: 25.0480, lng: 37.2670 },
      { name: "حقل", lat: 29.2833, lng: 34.9333 },
    ],
  },
  {
    name: "منطقة القصيم",
    cities: [
      { name: "بريدة", lat: 26.3260, lng: 43.9750 },
      { name: "عنيزة", lat: 26.0902, lng: 43.9954 },
      { name: "الرس", lat: 25.8694, lng: 43.4970 },
      { name: "المذنب", lat: 25.8598, lng: 44.2286 },
      { name: "البكيرية", lat: 26.1333, lng: 43.6667 },
      { name: "البدائع", lat: 26.0000, lng: 43.6667 },
      { name: "رياض الخبراء", lat: 26.1167, lng: 43.7833 },
      { name: "عيون الجواء", lat: 25.6167, lng: 43.7333 },
      { name: "النبهانية", lat: 25.9500, lng: 44.2333 },
    ],
  },
  {
    name: "منطقة حائل",
    cities: [
      { name: "حائل", lat: 27.5219, lng: 41.6907 },
      { name: "بقعاء", lat: 27.9500, lng: 41.6167 },
      { name: "الشنان", lat: 27.4167, lng: 42.0667 },
      { name: "الغزالة", lat: 26.8500, lng: 41.2833 },
      { name: "السليمي", lat: 26.8167, lng: 41.2333 },
      { name: "موقق", lat: 27.2500, lng: 41.1833 },
    ],
  },
  {
    name: "منطقة الحدود الشمالية",
    cities: [
      { name: "عرعر", lat: 30.9756, lng: 41.0381 },
      { name: "رفحاء", lat: 29.6266, lng: 43.4931 },
      { name: "طريف", lat: 31.6725, lng: 38.6633 },
    ],
  },
  {
    name: "منطقة جازان",
    cities: [
      { name: "جازان", lat: 16.8894, lng: 42.5706 },
      { name: "صبيا", lat: 17.1500, lng: 42.6250 },
      { name: "أبو عريش", lat: 16.9667, lng: 42.8333 },
      { name: "صامطة", lat: 16.6000, lng: 42.9333 },
      { name: "بيش", lat: 17.3667, lng: 42.6167 },
      { name: "الدرب", lat: 17.7167, lng: 42.2333 },
      { name: "فرسان", lat: 16.7000, lng: 41.9000 },
      { name: "الحرث", lat: 16.7333, lng: 43.0500 },
    ],
  },
  {
    name: "منطقة نجران",
    cities: [
      { name: "نجران", lat: 17.4924, lng: 44.1277 },
      { name: "شرورة", lat: 17.4834, lng: 47.1183 },
      { name: "حبونا", lat: 17.9333, lng: 44.2000 },
      { name: "بدر الجنوب", lat: 17.0333, lng: 44.4333 },
      { name: "يدمة", lat: 18.2833, lng: 44.3833 },
    ],
  },
  {
    name: "منطقة الباحة",
    cities: [
      { name: "الباحة", lat: 20.0129, lng: 41.4677 },
      { name: "بلجرشي", lat: 19.8664, lng: 41.5687 },
      { name: "المندق", lat: 20.1667, lng: 41.3167 },
      { name: "المخواة", lat: 19.6333, lng: 41.2333 },
      { name: "قلوة", lat: 19.1667, lng: 41.6167 },
      { name: "العقيق", lat: 20.2667, lng: 41.6667 },
    ],
  },
  {
    name: "منطقة الجوف",
    cities: [
      { name: "سكاكا", lat: 29.9697, lng: 40.2064 },
      { name: "القريات", lat: 31.3318, lng: 37.3421 },
      { name: "دومة الجندل", lat: 29.8125, lng: 39.8681 },
      { name: "طبرجل", lat: 30.4975, lng: 38.2181 },
    ],
  },
];
