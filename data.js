// Sproutx demo data. EVERYTHING in this file is FAKE / SAMPLE data for the hackathon demo.
window.DATA = {
  // All 25 districts of Sri Lanka (centre point = district capital). `crops` = SAMPLE suggestions for the Advice tab.
  districts: [
    { id: "colombo",      lat: 6.9271, lon: 79.8612, name: { en: "Colombo",      si: "කොළඹ",         ta: "கொழும்பு" },        crops: ["tomato", "chilli"] },
    { id: "gampaha",      lat: 7.0840, lon: 80.0098, name: { en: "Gampaha",      si: "ගම්පහ",        ta: "கம்பஹா" },          crops: ["tomato", "rice"] },
    { id: "kalutara",     lat: 6.5854, lon: 79.9607, name: { en: "Kalutara",     si: "කළුතර",        ta: "களுத்துறை" },       crops: ["tea", "rice"] },
    { id: "kandy",        lat: 7.2906, lon: 80.6337, name: { en: "Kandy",        si: "මහනුවර",       ta: "கண்டி" },           crops: ["tea", "tomato"] },
    { id: "matale",       lat: 7.4675, lon: 80.6234, name: { en: "Matale",       si: "මාතලේ",        ta: "மாத்தளை" },         crops: ["chilli", "rice"] },
    { id: "nuwaraeliya",  lat: 6.9497, lon: 80.7891, name: { en: "Nuwara Eliya", si: "නුවරඑළිය",     ta: "நுவரெலியா" },       crops: ["tea", "tomato"] },
    { id: "galle",        lat: 6.0535, lon: 80.2210, name: { en: "Galle",        si: "ගාල්ල",        ta: "காலி" },            crops: ["tea", "rice"] },
    { id: "matara",       lat: 5.9549, lon: 80.5550, name: { en: "Matara",       si: "මාතර",         ta: "மாத்தறை" },         crops: ["tea", "rice"] },
    { id: "hambantota",   lat: 6.1241, lon: 81.1185, name: { en: "Hambantota",   si: "හම්බන්තොට",    ta: "அம்பாந்தோட்டை" },   crops: ["chilli", "rice"] },
    { id: "jaffna",       lat: 9.6615, lon: 80.0255, name: { en: "Jaffna",       si: "යාපනය",        ta: "யாழ்ப்பாணம்" },     crops: ["chilli", "tomato"] },
    { id: "kilinochchi",  lat: 9.3803, lon: 80.3770, name: { en: "Kilinochchi",  si: "කිලිනොච්චිය",  ta: "கிளிநொச்சி" },      crops: ["rice", "chilli"] },
    { id: "mannar",       lat: 8.9810, lon: 79.9044, name: { en: "Mannar",       si: "මන්නාරම",      ta: "மன்னார்" },         crops: ["rice", "chilli"] },
    { id: "vavuniya",     lat: 8.7514, lon: 80.4971, name: { en: "Vavuniya",     si: "වවුනියාව",     ta: "வவுனியா" },         crops: ["rice", "chilli"] },
    { id: "mullaitivu",   lat: 9.2671, lon: 80.8142, name: { en: "Mullaitivu",   si: "මුලතිව්",      ta: "முல்லைத்தீவு" },    crops: ["rice", "chilli"] },
    { id: "batticaloa",   lat: 7.7310, lon: 81.6747, name: { en: "Batticaloa",   si: "මඩකලපුව",      ta: "மட்டக்களப்பு" },    crops: ["rice", "chilli"] },
    { id: "ampara",       lat: 7.2975, lon: 81.6820, name: { en: "Ampara",       si: "අම්පාර",       ta: "அம்பாறை" },         crops: ["rice", "chilli"] },
    { id: "trincomalee",  lat: 8.5874, lon: 81.2152, name: { en: "Trincomalee",  si: "ත්‍රිකුණාමලය",  ta: "திருகோணமலை" },     crops: ["rice", "chilli"] },
    { id: "kurunegala",   lat: 7.4863, lon: 80.3647, name: { en: "Kurunegala",   si: "කුරුණෑගල",     ta: "குருணாகல்" },       crops: ["rice", "tomato"] },
    { id: "puttalam",     lat: 8.0408, lon: 79.8394, name: { en: "Puttalam",     si: "පුත්තලම",      ta: "புத்தளம்" },        crops: ["chilli", "rice"] },
    { id: "anuradhapura", lat: 8.3114, lon: 80.4037, name: { en: "Anuradhapura", si: "අනුරාධපුරය",   ta: "அனுராதபுரம்" },     crops: ["rice", "chilli"] },
    { id: "polonnaruwa",  lat: 7.9403, lon: 81.0188, name: { en: "Polonnaruwa",  si: "පොළොන්නරුව",   ta: "பொலன்னறுவை" },     crops: ["rice", "chilli"] },
    { id: "badulla",      lat: 6.9934, lon: 81.0550, name: { en: "Badulla",      si: "බදුල්ල",       ta: "பதுளை" },           crops: ["tea", "tomato"] },
    { id: "monaragala",   lat: 6.8728, lon: 81.3507, name: { en: "Monaragala",   si: "මොණරාගල",      ta: "மொணராகலை" },       crops: ["chilli", "rice"] },
    { id: "ratnapura",    lat: 6.6828, lon: 80.3992, name: { en: "Ratnapura",    si: "රත්නපුර",      ta: "இரத்தினபுரி" },     crops: ["tea", "rice"] },
    { id: "kegalle",      lat: 7.2513, lon: 80.3464, name: { en: "Kegalle",      si: "කෑගල්ල",       ta: "கேகாலை" },          crops: ["tea", "rice"] }
  ],

  // Choices for the farm-profile form (shown after sign-up). Free-text "other" boxes sit next to these in the form.
  options: {
    unit: [
      { id: "acre",    name: { en: "acres",    si: "අක්කර",     ta: "ஏக்கர்" } },
      { id: "hectare", name: { en: "hectares", si: "හෙක්ටයාර",  ta: "ஹெக்டேர்" } },
      { id: "perch",   name: { en: "perches",  si: "පර්චස්",    ta: "பேர்ச்" } }
    ],
    ownership: [
      { id: "own",   name: { en: "Own land",               si: "තමන්ගේ ඉඩම",          ta: "சொந்த நிலம்" } },
      { id: "lease", name: { en: "Leased / rented",        si: "බදු / කුලී ඉඩම",       ta: "குத்தகை / வாடகை நிலம்" } },
      { id: "share", name: { en: "Shared / family land",   si: "හවුල් / පවුලේ ඉඩම",    ta: "பகிர்ந்த / குடும்ப நிலம்" } }
    ],
    soil: [
      { id: "clay",  name: { en: "Clay",                   si: "මැටි පස",              ta: "களிமண்" } },
      { id: "sandy", name: { en: "Sandy",                  si: "වැලි පස",              ta: "மணல் மண்" } },
      { id: "red",   name: { en: "Red / yellow soil",      si: "රතු / කහ පස",          ta: "சிவப்பு / மஞ்சள் மண்" } },
      { id: "unsure",name: { en: "Not sure",               si: "නොදනිමි",              ta: "தெரியாது" } }
    ],
    water: [
      { id: "rain",  name: { en: "Rain-fed",               si: "වැසි ජලය",             ta: "மழை நீர்" } },
      { id: "tank",  name: { en: "Tank (wewa)",            si: "වැව",                  ta: "குளம்" } },
      { id: "well",  name: { en: "Well",                   si: "ළිඳ",                  ta: "கிணறு" } },
      { id: "canal", name: { en: "Canal / irrigation scheme", si: "ඇළ / වාරිමාර්ග යෝජනා ක්‍රමය", ta: "கால்வாய் / நீர்ப்பாசனத் திட்டம்" } },
      { id: "river", name: { en: "River / stream",         si: "ගඟ / ඔය",              ta: "ஆறு / ஓடை" } },
      { id: "tube",  name: { en: "Tube well / pump",       si: "ටියුබ් ළිං / පොම්පය",  ta: "குழாய்க் கிணறு / பம்பு" } }
    ],
    season: [
      { id: "maha",  name: { en: "Maha",                   si: "මහ",                   ta: "பெரும்போகம்" } },
      { id: "yala",  name: { en: "Yala",                   si: "යල",                   ta: "சிறுபோகம்" } },
      { id: "other", name: { en: "Other / whole year",     si: "වෙනත් / මුළු වසර",     ta: "மற்றவை / முழு ஆண்டு" } }
    ],
    fert: [
      { id: "urea",    name: { en: "Urea",                 si: "යූරියා",               ta: "யூரியா" } },
      { id: "tsp",     name: { en: "TSP",                  si: "TSP",                  ta: "TSP" } },
      { id: "mop",     name: { en: "MOP",                  si: "MOP",                  ta: "MOP" } },
      { id: "npk",     name: { en: "NPK mixture",          si: "NPK මිශ්‍රණය",         ta: "NPK கலவை" } },
      { id: "compost", name: { en: "Compost / organic",    si: "කොම්පෝස්ට් / කාබනික",  ta: "இயற்கை உரம்" } },
      { id: "none",    name: { en: "No fertilizer",        si: "පොහොර යොදා නැත",       ta: "உரம் இடவில்லை" } }
    ],
    diff: [
      { id: "water",    name: { en: "Lack of water / drought",           si: "ජල හිඟය / නියඟය",                  ta: "நீர்ப் பற்றாக்குறை / வறட்சி" } },
      { id: "flood",    name: { en: "Floods / heavy rain",               si: "ගංවතුර / අධික වැසි",              ta: "வெள்ளம் / கனமழை" } },
      { id: "pest",     name: { en: "Pests and diseases",                si: "පළිබෝධ සහ රෝග",                   ta: "பூச்சி மற்றும் நோய்கள்" } },
      { id: "fertcost", name: { en: "Fertilizer too expensive",          si: "පොහොර මිල අධිකයි",                ta: "உரம் விலை அதிகம்" } },
      { id: "fertshort",name: { en: "Fertilizer shortage",               si: "පොහොර හිඟය",                      ta: "உரத் தட்டுப்பாடு" } },
      { id: "price",    name: { en: "Low selling price",                 si: "විකුණුම් මිල අඩුයි",              ta: "குறைந்த விற்பனை விலை" } },
      { id: "transport",name: { en: "No transport / market is far",      si: "ප්‍රවාහනය නැත / වෙළඳපොළ දුරයි",    ta: "போக்குவரத்து இல்லை / சந்தை தொலைவு" } },
      { id: "labour",   name: { en: "Not enough labour",                 si: "ශ්‍රමිකයන් හිඟයි",                ta: "தொழிலாளர் பற்றாக்குறை" } },
      { id: "seed",     name: { en: "Poor quality seed / plants",        si: "බීජ / පැළ ගුණාත්මක නැත",          ta: "தரமற்ற விதை / நாற்று" } },
      { id: "animals",  name: { en: "Wild animals (elephants, monkeys, boar)", si: "වන සතුන් (ඇතුන්, රිලවුන්, ඌරන්)", ta: "காட்டு விலங்குகள் (யானை, குரங்கு, பன்றி)" } },
      { id: "loan",     name: { en: "Money / loan problems",             si: "මුදල් / ණය ගැටලු",                 ta: "பணம் / கடன் பிரச்சினை" } },
      { id: "advice",   name: { en: "No farming advice or training",     si: "ගොවිතැන් උපදෙස් / පුහුණුව නැත",    ta: "விவசாய ஆலோசனை / பயிற்சி இல்லை" } }
    ],
    sell: [
      { id: "trader",  name: { en: "Trader / middleman at the farm",   si: "ගොවිපළට පැමිණෙන වෙළෙන්දා / අතරමැදියා", ta: "பண்ணைக்கு வரும் வியாபாரி / இடைத்தரகர்" } },
      { id: "local",   name: { en: "Local market",                     si: "ප්‍රාදේශීය වෙළඳපොළ",                   ta: "உள்ளூர் சந்தை" } },
      { id: "economic",name: { en: "Economic centre",                  si: "ආර්ථික මධ්‍යස්ථානය",                   ta: "பொருளாதார மையம்" } },
      { id: "direct",  name: { en: "Direct to mill / buyer / exporter",si: "කෙලින්ම මෝල / ගැනුම්කරු / අපනයනකරු",   ta: "நேரடியாக ஆலை / வாங்குவோர் / ஏற்றுமதியாளர்" } },
      { id: "own",     name: { en: "Only for my own use",              si: "ගෙදර පරිභෝජනයට පමණි",                  ta: "சொந்தப் பயன்பாட்டுக்கு மட்டும்" } }
    ]
  },

  // FAKE farmer profiles (demo login: 0771234567)
  profiles: [
    { phone: "0771234567", name: "Nimal Perera", district: "kurunegala", lat: 7.4863, lon: 80.3647, crop: "rice", lang: "si",
      farmSize: "2.5 acres", water: { en: "Tank + rain", si: "වැව + වැසි ජලය", ta: "குளம் + மழைநீர்" },
      history: [ { year: 2024, crop: "rice", yield: "4.1 t/ha" }, { year: 2025, crop: "rice", yield: "4.4 t/ha" }, { year: 2025, crop: "chilli", yield: "1.8 t/ha" } ] },
    { phone: "0712345678", name: "Selvarajah Kumar", district: "jaffna", lat: 9.6615, lon: 80.0255, crop: "chilli", lang: "ta",
      farmSize: "1 acre", water: { en: "Well + drip", si: "ළිඳ + බින්දු ජල සම්පාදනය", ta: "கிணறு + சொட்டு நீர்" },
      history: [ { year: 2024, crop: "chilli", yield: "2.2 t/ha" }, { year: 2025, crop: "tomato", yield: "18 t/ha" } ] },
    { phone: "0751112233", name: "Priya Fernando", district: "nuwaraeliya", lat: 6.9497, lon: 80.7891, crop: "tea", lang: "en",
      farmSize: "3 acres", water: { en: "Rain-fed", si: "වැසි ජලයෙන්", ta: "மழை நீர்" },
      history: [ { year: 2024, crop: "tea", yield: "2.6 t/ha" }, { year: 2025, crop: "tea", yield: "2.8 t/ha" } ] }
  ],

  // SAMPLE advice. Confirm with the Department of Agriculture before real use.
  advice: {
    rice: {
      icon: "🌾", price: 120,
      name: { en: "Rice", si: "වී", ta: "நெல்" },
      sow:   { en: "Maha season: Oct–Nov. Yala season: Apr–May.", si: "මහ කන්නය: ඔක්තෝබර්–නොවැම්බර්. යල කන්නය: අප්‍රේල්–මැයි.", ta: "பெரும்போகம்: அக்–நவ். சிறுபோகம்: ஏப்–மே." },
      fert:  { en: "TSP at sowing; urea in 2–3 splits (weeks 2, 5, 7); MOP at week 5 (follow local Dept. of Agriculture rates).", si: "වපුරන විට TSP; යූරියා වාර 2–3 කට (සති 2, 5, 7); සති 5 දී MOP (ප්‍රාදේශීය කෘෂිකර්ම දෙපාර්තමේන්තු මාත්‍රා අනුගමනය කරන්න).", ta: "விதைக்கும் போது TSP; யூரியா 2–3 பிரிவுகளாக (2, 5, 7 வாரங்கள்); 5 வது வாரத்தில் MOP (உள்ளூர் விவசாயத் திணைக்கள அளவுகளைப் பின்பற்றவும்)." },
      water: { en: "Keep 2–5 cm of standing water during growth; drain the field 10 days before harvest.", si: "වර්ධන කාලයේ 2–5 සෙ.මී. ජලය රඳවා තබන්න; අස්වනු නෙලීමට දින 10 කට පෙර ජලය බැහැර කරන්න.", ta: "வளர்ச்சிக் காலத்தில் 2–5 செ.மீ தண்ணீர் நிறுத்தி வைக்கவும்; அறுவடைக்கு 10 நாள் முன் வடிக்கவும்." }
    },
    tea: {
      icon: "🍵", price: 95,
      name: { en: "Tea", si: "තේ", ta: "தேயிலை" },
      sow:   { en: "Plant young tea plants at the start of the rainy season (Oct–Nov or Apr–May).", si: "වැසි කාලයේ ආරම්භයේදී තේ පැළ සිටුවන්න (ඔක්–නොවැ හෝ අප්‍රේල්–මැයි).", ta: "மழைக்காலத் தொடக்கத்தில் (அக்–நவ் அல்லது ஏப்–மே) தேயிலைக் கன்றுகளை நடவும்." },
      fert:  { en: "Use a balanced tea NPK mix in 3–4 rounds a year, as advised by the Tea Research Institute.", si: "තේ පර්යේෂණ ආයතනයේ උපදෙස් පරිදි වසරකට වාර 3–4 කදී තේ සඳහා NPK මිශ්‍රණයක් යොදන්න.", ta: "தேயிலை ஆராய்ச்சி நிறுவன பரிந்துரைப்படி ஆண்டுக்கு 3–4 முறை தேயிலைக்கான NPK கலவை இடவும்." },
      water: { en: "Mulch around plants; irrigate young plants in dry spells.", si: "පැළ වටා mulch යොදන්න; වියළි කාලයේ තරුණ පැළවලට ජලය දෙන්න.", ta: "செடிகளைச் சுற்றி மூடாக்கு இடவும்; வறட்சியில் இளம் செடிகளுக்கு நீர் பாய்ச்சவும்." }
    },
    tomato: {
      icon: "🍅", price: 180,
      name: { en: "Tomato", si: "තක්කාලි", ta: "தக்காளி" },
      sow:   { en: "Raise seedlings for 3–4 weeks, then transplant. Avoid the heaviest rain weeks.", si: "පැළ සති 3–4 ක් ඇති කර ඉන්පසු රෝපණය කරන්න. අධිකම වර්ෂා සතිවලින් වළකින්න.", ta: "நாற்றுகளை 3–4 வாரம் வளர்த்து பின்னர் நடவும். மிகக் கனமழை வாரங்களைத் தவிர்க்கவும்." },
      fert:  { en: "Compost at planting, then NPK every 2–3 weeks. Add calcium to prevent blossom-end rot.", si: "සිටුවන විට කොම්පෝස්ට්, ඉන්පසු සති 2–3 කට වරක් NPK. අග කුණුවීම වැළැක්වීමට කැල්සියම් යොදන්න.", ta: "நடும்போது இயற்கை உரம், பின் 2–3 வாரத்திற்கு ஒருமுறை NPK. பூ அழுகலைத் தடுக்க கால்சியம் சேர்க்கவும்." },
      water: { en: "Water at the base in the morning, regularly but without flooding. Mulch to hold moisture.", si: "උදෑසන මුල ළඟ ජලය දෙන්න, නිතිපතා නමුත් ජලයෙන් යට නොකර. තෙතමනය රැඳීමට mulch යොදන්න.", ta: "காலையில் வேர்ப்பகுதியில் நீர் விடுங்கள்; தவறாமல், ஆனால் தேங்க விடாமல். ஈரம் காக்க மூடாக்கு இடவும்." }
    },
    chilli: {
      icon: "🌶️", price: 650,
      name: { en: "Chilli", si: "මිරිස්", ta: "மிளகாய்" },
      sow:   { en: "Nursery for 4–5 weeks, then transplant at the start of Maha or Yala.", si: "සති 4–5 ක් නර්සරියේ තබා මහ හෝ යල ආරම්භයේදී රෝපණය කරන්න.", ta: "4–5 வாரம் நாற்றங்காலில் வளர்த்து, பெரும்போகம் அல்லது சிறுபோகத் தொடக்கத்தில் நடவும்." },
      fert:  { en: "Compost plus NPK in 3 splits: at planting, at flowering and after first harvest.", si: "කොම්පෝස්ට් සහ NPK වාර 3 කට: සිටුවන විට, මල් හටගන්නා විට සහ පළමු අස්වැන්නෙන් පසු.", ta: "இயற்கை உரம் மற்றும் NPK 3 பிரிவுகளாக: நடும்போது, பூக்கும்போது, முதல் அறுவடைக்குப் பின்." },
      water: { en: "Light watering every 2–3 days; avoid waterlogging.", si: "දින 2–3 කට වරක් සුළු ජලය; ජලය රැඳීමෙන් වළකින්න.", ta: "2–3 நாளுக்கு ஒருமுறை குறைவாக நீர் விடவும்; தண்ணீர் தேங்காமல் பார்க்கவும்." }
    }
  },

  // FAKE market data
  market: {
    prices: [
      { crop: "rice", price: 118, change: 1.2 },
      { crop: "tea", price: 96, change: 0.4 },
      { crop: "tomato", price: 190, change: -3.1 },
      { crop: "chilli", price: 640, change: 2.5 }
    ],
    listings: [
      { farmer: "Sunil Jayasuriya", crop: "tomato", qty: 500, price: 175, district: "kandy", transport: true, phone: "0701000001" },
      { farmer: "Mohamed Rizwan", crop: "chilli", qty: 200, price: 630, district: "jaffna", transport: false, phone: "0701000002" },
      { farmer: "Kamala Wijesinghe", crop: "rice", qty: 3000, price: 115, district: "anuradhapura", transport: true, phone: "0701000003" }
    ],
    buyers: [
      { name: "Lanka Fresh Exports (sample)", needs: ["tomato", "chilli"], district: "colombo", phone: "0112000001" },
      { name: "Green Valley Mills (sample)", needs: ["rice"], district: "kurunegala", phone: "0372000002" },
      { name: "Ceylon Leaf Traders (sample)", needs: ["tea"], district: "kandy", phone: "0812000003" }
    ]
  },

  // FAKE earlier alerts
  alertsSample: [
    { icon: "🌡️", when: { en: "2 days ago", si: "දින 2 කට පෙර", ta: "2 நாட்களுக்கு முன்" },
      title: { en: "Sudden temperature rise", si: "හදිසි උෂ්ණත්ව ඉහළ යාම", ta: "திடீர் வெப்ப உயர்வு" },
      body: { en: "Temperature rose 5°C in one day. Shade young plants and water early.", si: "එක් දිනකින් උෂ්ණත්වය 5°C කින් ඉහළ ගියේය. තරුණ පැළ සෙවණ කර උදෑසන ජලය දෙන්න.", ta: "ஒரே நாளில் வெப்பம் 5°C உயர்ந்தது. இளம் செடிகளுக்கு நிழல் தந்து காலையில் நீர் விடவும்." } },
    { icon: "🌊", when: { en: "5 days ago", si: "දින 5 කට පෙර", ta: "5 நாட்களுக்கு முன்" },
      title: { en: "Water level rising", si: "ජල මට්ටම ඉහළ යයි", ta: "நீர்மட்டம் உயர்கிறது" },
      body: { en: "Nearby stream level is rising after heavy rain. Move stored produce to higher ground.", si: "අධික වැස්සෙන් පසු අසල ඔය ජල මට්ටම ඉහළ යයි. ගබඩා කළ අස්වැන්න උස් බිමකට ගෙන යන්න.", ta: "கனமழைக்குப் பின் அருகிலுள்ள ஓடையின் நீர்மட்டம் உயர்கிறது. சேமித்த விளைச்சலை உயரமான இடத்துக்கு மாற்றவும்." } }
  ],

  bestPractices: [
    { icon: "💧", text: { en: "Water early in the morning to save water and avoid disease.", si: "ජලය ඉතිරි කර රෝග වළක්වා ගැනීමට උදෑසන ජලය දෙන්න.", ta: "நீரைச் சேமிக்கவும் நோயைத் தவிர்க்கவும் காலையில் நீர் பாய்ச்சவும்." } },
    { icon: "🔄", text: { en: "Rotate crops each season to keep the soil healthy.", si: "පස සෞඛ්‍ය සම්පන්නව තබා ගැනීමට සෑම කන්නයකම බෝග මාරු කරන්න.", ta: "மண் வளம் காக்க ஒவ்வொரு பருவமும் பயிர்களை மாற்றி நடவும்." } },
    { icon: "🪱", text: { en: "Add compost to improve soil and reduce fertilizer cost.", si: "පස යහපත් කර පොහොර වියදම අඩු කිරීමට කොම්පෝස්ට් යොදන්න.", ta: "மண்ணை மேம்படுத்தவும் உரச் செலவைக் குறைக்கவும் இயற்கை உரம் சேர்க்கவும்." } }
  ]
};
