// Kisan Mitra - Application Logic & Localized Backend Controller

// Global UI State
let currentLang = 'en';
let currentCropPage = 1;
let activeLocation = { state: '', district: '', block: '' };
let weatherTrendChart = null;
let mandiPriceChart = null;
let mandiTickerId = null;
let latestMandiBasePrices = null;
let mandiCurrentPrices = null;
let activeMandiCrops = ['wheat', 'rice', 'sugarcane', 'sesame', 'mustard', 'potato', 'tomato', 'bajra', 'corn', 'peanuts', 'cotton', 'soybean'];

// Chart.js Plugin to draw weather emojis directly on the trend chart
const weatherEmojiPlugin = {
    id: 'weatherEmojiPlugin',
    afterDatasetsDraw(chart, args, options) {
        const { ctx, data } = chart;
        if (chart.canvas.id !== 'weather-trend-chart') return;

        const meta = chart.getDatasetMeta(0); // dataset 0 is Temperature
        if (!meta || meta.hidden) return;

        const weatherCodes = data.datasets[0].weatherCodes || [];
        
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        meta.data.forEach((point, index) => {
            const code = weatherCodes[index];
            let emoji = '☀️';
            if (code !== undefined) {
                if (code === 0) emoji = '☀️';
                else if ([1, 2, 3].includes(code)) emoji = '☁️';
                else if ([45, 48].includes(code)) emoji = '🌫️';
                else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) emoji = '🌧️';
                else if (code >= 95) emoji = '⛈️';
            }
            
            ctx.fillText(emoji, point.x, point.y - 8);
        });
        ctx.restore();
    }
};

// Location Database is now loaded dynamically from indian_locations.js

// 12 Primary Crops Database
const cropsDb = {
    wheat: {
        id: 'wheat',
        nameEn: 'Wheat',
        nameHi: 'गेहूँ',
        icon: '🌾',
        seasonEn: 'Rabi (October to December)',
        seasonHi: 'रबी (अक्टूबर से दिसंबर)',
        soilEn: 'Well-drained loamy soil (pH 6.0-7.5)',
        soilHi: 'अच्छी जल-निकासी वाली दोमट मिट्टी (pH 6.0-7.5)',
        waterEn: 'Requires 4-6 irrigations during the growth cycle.',
        waterHi: 'विकास चक्र के दौरान 4-6 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal (60-80 kg N, 40-60 kg P, 40 kg K per hectare); Top Dressing (Urea 1st dose 21-25 days after sowing).',
        fertilizerHi: 'बेसल उर्वरक (60-80 kg N, 40-60 kg P, 40 kg K प्रति हेक्टेयर); टॉप ड्रेसिंग (बुवाई के 21-25 दिन बाद यूरिया की पहली खुराक)।',
        pesticideEn: 'Imidacloprid 17.8% SL @ 50-60 ml/ha for Aphids; Propiconazole 25% EC @ 500 ml/ha for Rust.',
        pesticideHi: 'चेपा (Aphids) के लिए इमिडाक्लोप्रिड 17.8% SL @ 50-60 मिली/हेक्टेयर; रतुआ (Rust) के लिए प्रोपिकोनाज़ोल 25% EC @ 500 मिली/हेक्टेयर।'
    },
    rice: {
        id: 'rice',
        nameEn: 'Rice',
        nameHi: 'चावल',
        icon: '🌾',
        seasonEn: 'Kharif (June to September)',
        seasonHi: 'खरीफ (जून से सितंबर)',
        soilEn: 'Clayey soil (retains water, pH 5.0-6.5)',
        soilHi: 'मटियार/चिकनी मिट्टी (पानी रोकने में सक्षम, pH 5.0-6.5)',
        waterEn: 'Requires standing water for most growth periods.',
        waterHi: 'अधिकांश विकास अवधि के लिए खड़े पानी की आवश्यकता होती है।',
        fertilizerEn: 'Basal (80-120 kg N, 40-60 kg P, 40 kg K per hectare); Top Dressing (Two doses of Urea at tillering & panicle initiation).',
        fertilizerHi: 'बेसल उर्वरक (80-120 kg N, 40-60 kg P, 40 kg K प्रति हेक्टेयर); टॉप ड्रेसिंग (कल्ले निकलने और बाली बनने की शुरुआत में यूरिया की दो खुराकें)।',
        pesticideEn: 'Cartap Hydrochloride 4% G @ 25 kg/ha for Stem Borer; Tricyclazole 75% WP @ 500-600 g/ha for Blast.',
        pesticideHi: 'तना छेदक (Stem Borer) के लिए कार्टाप हाइड्रोक्लोराइड 4% G @ 25 किग्रा/हेक्टेयर; झुलसा रोग (Blast) के लिए ट्राइसाइक्लाजोल 75% WP @ 500-600 ग्राम/हेक्टेयर।'
    },
    sugarcane: {
        id: 'sugarcane',
        nameEn: 'Sugarcane',
        nameHi: 'गन्ना',
        icon: '🎋',
        seasonEn: 'Year-round (Best February to May)',
        seasonHi: 'वर्ष भर (सबसे अच्छा फरवरी से मई)',
        soilEn: 'Deep well-drained loamy (pH 6.5-7.5)',
        soilHi: 'गहरी जल-निकासी वाली दोमट मिट्टी (pH 6.5-7.5)',
        waterEn: 'High/Frequent Irrigation.',
        waterHi: 'अधिक/बार-बार सिंचाई।',
        fertilizerEn: 'Basal: 150-200 kg N, 60-80 kg P, 40-60 kg K per hectare; Top: Urea at 30, 60, and 90 days.',
        fertilizerHi: 'बेसल उर्वरक: 150-200 kg N, 60-80 kg P, 40-60 kg K प्रति हेक्टेयर। टॉप ड्रेसिंग: 30, 60, और 90 दिनों पर यूरिया।',
        pesticideEn: 'Chlorantraniliprole for borers; Imidacloprid for aphids; Carbendazim 50% WP for Red Rot.',
        pesticideHi: 'छेदक कीटों (Borers) के लिए क्लोरेंट्रानिलिप्रोल; चेपा (Aphids) के लिए इमिडाक्लोप्रिड; लाल सड़न (Red Rot) के लिए कार्बेन्डाजिम 50% WP।'
    },
    sesame: {
        id: 'sesame',
        nameEn: 'Sesame / Til',
        nameHi: 'तिल',
        icon: '🌱',
        seasonEn: 'Kharif / Summer',
        seasonHi: 'खरीफ / गर्मी',
        soilEn: 'Well-drained sandy loam (pH 5.5-8.0)',
        soilHi: 'अच्छी जल-निकासी वाली बलुई दोमट मिट्टी (pH 5.5-8.0)',
        waterEn: 'Drought-tolerant (Irrigate at flowering stage).',
        waterHi: 'सूखा-सहनशील (पुष्पन अवस्था में सिंचाई करें)।',
        fertilizerEn: 'Basal: 40-60 kg N, 30-40 kg P, 20-30 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 40-60 kg N, 30-40 kg P, 20-30 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Quinalphos 25% EC for Pod Borer; Mancozeb 75% WP for Fungal diseases.',
        pesticideHi: 'फली छेदक (Pod Borer) के लिए क्विनालफॉस 25% EC; कवक रोगों के लिए मैनकोजेब 75% WP।'
    },
    mustard: {
        id: 'mustard',
        nameEn: 'Mustard',
        nameHi: 'सरसों',
        icon: '🌼',
        seasonEn: 'Rabi (October to November)',
        seasonHi: 'रबी (अक्टूबर से नवंबर)',
        soilEn: 'Loamy soil (pH 6.0-7.5)',
        soilHi: 'दोमट मिट्टी (pH 6.0-7.5)',
        waterEn: 'Requires 2-3 irrigations.',
        waterHi: '2-3 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 60-80 kg N, 30-40 kg P, 20-30 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 60-80 kg N, 30-40 kg P, 20-30 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Dimethoate 30% EC for Aphids; Metalaxyl 8% + Mancozeb 64% WP for White Rust.',
        pesticideHi: 'चेपा (Aphids) के लिए डाइमेथोएट 30% EC; सफेद गेरूआ (White Rust) के लिए मेटालैक्सिल 8% + मैनकोजेब 64% WP।'
    },
    potato: {
        id: 'potato',
        nameEn: 'Potato',
        nameHi: 'आलू',
        icon: '🥔',
        seasonEn: 'Rabi (October to December)',
        seasonHi: 'रबी (अक्टूबर से दिसंबर)',
        soilEn: 'Sandy loam (pH 5.0-6.5)',
        soilHi: 'बलुई दोमट मिट्टी (pH 5.0-6.5)',
        waterEn: 'Requires 4-5 irrigations.',
        waterHi: '4-5 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 120-150 kg N, 60-80 kg P, 80-100 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 120-150 kg N, 60-80 kg P, 80-100 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Metalaxyl 8% + Mancozeb 64% WP for Late Blight; Chlorpyriphos for Tuber Moth.',
        pesticideHi: 'पछेती झुलसा (Late Blight) के लिए मेटालैक्सिल 8% + मैनकोजेब 64% WP; आलू कंद मोथ (Tuber Moth) के लिए क्लोरपायरीफॉस।'
    },
    tomato: {
        id: 'tomato',
        nameEn: 'Tomato',
        nameHi: 'टमाटर',
        icon: '🍅',
        seasonEn: 'Year-round (Best in Winter)',
        seasonHi: 'वर्ष भर (सर्दियों में सर्वोत्तम)',
        soilEn: 'Loamy soil (pH 6.0-7.0)',
        soilHi: 'दोमट मिट्टी (pH 6.0-7.0)',
        waterEn: 'Regular irrigation.',
        waterHi: 'नियमित सिंचाई।',
        fertilizerEn: 'Basal: 100-120 kg N, 60-80 kg P, 60-80 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 100-120 kg N, 60-80 kg P, 60-80 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Indoxacarb 14.5% SC for Fruit Borer; Chlorothalonil 75% WP for Late Blight.',
        pesticideHi: 'फल छेदक (Fruit Borer) के लिए इंडोक्साकार्ब 14.5% SC; पछेती झुलसा (Late Blight) के लिए क्लोरोथैलोनिल 75% WP।'
    },
    bajra: {
        id: 'bajra',
        nameEn: 'Pearl Millet / Bajra',
        nameHi: 'बाजरा',
        icon: '🌾',
        seasonEn: 'Kharif (June to July)',
        seasonHi: 'खरीफ (जून से जुलाई)',
        soilEn: 'Sandy loam soil.',
        soilHi: 'बलुई दोमट मिट्टी।',
        waterEn: 'Drought-tolerant (Minimal water requirements).',
        waterHi: 'सूखा-सहनशील (न्यूनतम पानी की आवश्यकता)।',
        fertilizerEn: 'Basal: 60-80 kg N, 30-40 kg P, 20-30 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 60-80 kg N, 30-40 kg P, 20-30 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Edifenphos 50% EC for Blast; Carbaryl 50% WP/Chlorpyriphos for Stem Borer.',
        pesticideHi: 'झुलसा (Blast) के लिए एडिफ़ेनफ़ॉस 50% EC; तना छेदक (Stem Borer) के लिए कार्बारिल 50% WP/क्लोरपायरीफॉस।'
    },
    corn: {
        id: 'corn',
        nameEn: 'Corn / Maize',
        nameHi: 'मक्का',
        icon: '🌽',
        seasonEn: 'Summer (March to May)',
        seasonHi: 'गर्मी (मार्च से मई)',
        soilEn: 'Loamy soil (pH 6.0-7.5)',
        soilHi: 'दोमट मिट्टी (pH 6.0-7.5)',
        waterEn: 'Moderate water (Avoid waterlogging).',
        waterHi: 'मध्यम पानी (जलभराव से बचें)।',
        fertilizerEn: 'Basal: 100-120 kg N, 60-80 kg P, 40-60 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 100-120 kg N, 60-80 kg P, 40-60 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Carbofuran 3% G for Stem Borer; Mancozeb 75% WP for Leaf Blight.',
        pesticideHi: 'तना छेदक (Stem Borer) के लिए कार्बोफ्यूरॉन 3% G; पत्ता झुलसा (Leaf Blight) के लिए मैनकोजेब 75% WP।'
    },
    peanuts: {
        id: 'peanuts',
        nameEn: 'Peanuts / Groundnut',
        nameHi: 'मूंगफली',
        icon: '🥜',
        seasonEn: 'Kharif / Summer',
        seasonHi: 'खरीफ / गर्मी',
        soilEn: 'Sandy loam (pH 5.5-7.0)',
        soilHi: 'बलुई दोमट मिट्टी (pH 5.5-7.0)',
        waterEn: 'Moderate water.',
        waterHi: 'मध्यम पानी।',
        fertilizerEn: 'Basal: 20-25 kg N, 40-60 kg P, 20-30 kg K per hectare + Gypsum 200-250 kg/ha at sowing.',
        fertilizerHi: 'बेसल उर्वरक: 20-25 kg N, 40-60 kg P, 20-30 kg K प्रति हेक्टेयर + बुवाई के समय जिप्सम 200-250 किग्रा/हेक्टेयर।',
        pesticideEn: 'Chlorpyriphos for Leaf Miner; Carbendazim 50% WP for Leaf Spot.',
        pesticideHi: 'लीफ माइनर (Leaf Miner) के लिए क्लोरपायरीफॉस; पत्ती धब्बा (Leaf Spot) के लिए कार्बेन्डाजिम 50% WP।'
    },
    cotton: {
        id: 'cotton',
        nameEn: 'Cotton',
        nameHi: 'कपास',
        icon: '☁️',
        seasonEn: 'Kharif (June to July)',
        seasonHi: 'खरीफ (जून से जुलाई)',
        soilEn: 'Black cotton soil (pH 6.0-8.0)',
        soilHi: 'काली कपास मिट्टी (pH 6.0-8.0)',
        waterEn: 'Requires 5-6 irrigations.',
        waterHi: '5-6 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 80-100 kg N, 40-60 kg P, 40-60 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 80-100 kg N, 40-60 kg P, 40-60 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Spinosad 45% SC for Bollworm; Acetamiprid 20% SP for Whitefly.',
        pesticideHi: 'बोलवॉर्म (Bollworm) के लिए स्पिनोसैड 45% SC; सफेद मक्खी (Whitefly) के लिए एसिटामिप्रिड 20% SP।'
    },
    soybean: {
        id: 'soybean',
        nameEn: 'Soybean',
        nameHi: 'सोयाबीन',
        icon: '🫘',
        seasonEn: 'Kharif (June to July)',
        seasonHi: 'खरीफ (जून से जुलाई)',
        soilEn: 'Loamy soil (pH 6.0-7.5)',
        soilHi: 'दोमट मिट्टी (pH 6.0-7.5)',
        waterEn: 'Requires 2-3 irrigations at critical stages.',
        waterHi: 'महत्वपूर्ण चरणों में 2-3 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 20-25 kg N, 60-80 kg P, 40-60 kg K per hectare + Rhizobium culture seed treatment.',
        fertilizerHi: 'बेसल उर्वरक: 20-25 kg N, 60-80 kg P, 40-60 kg K प्रति हेक्टेयर + राइजोबियम कल्चर बीज उपचार।',
        pesticideEn: 'Chlorpyriphos 20% EC for Girdle Beetle; Imidacloprid for Yellow Mosaic Virus.',
        pesticideHi: 'गर्डल बीटल (Girdle Beetle) के लिए क्लोरपायरीफॉस 20% EC; पीला मोज़ेक वायरस के लिए इमिडाक्लोप्रिड।'
    },
    barley: {
        id: 'barley',
        nameEn: 'Barley',
        nameHi: 'जौ',
        icon: '🌾',
        seasonEn: 'Rabi (October to November)',
        seasonHi: 'रबी (अक्टूबर से नवंबर)',
        soilEn: 'Well-drained loamy to sandy loam soil (pH 6.0-8.0)',
        soilHi: 'अच्छी जल-निकासी वाली दोमट से बलुई दोमट मिट्टी (pH 6.0-8.0)',
        waterEn: 'Requires 2-3 irrigations during tillering and flowering stages.',
        waterHi: 'कल्ले निकलने और फूल आने के चरणों के दौरान 2-3 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 60 kg N, 30 kg P, 20 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 60 kg N, 30 kg P, 20 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Propiconazole 25% EC @ 500 ml/ha for Rust; Imidacloprid for Aphids.',
        pesticideHi: 'गेरूआ (Rust) के लिए प्रोपिकोनाज़ोल 25% EC @ 500 मिली/हेक्टेयर; चेपा (Aphids) के लिए इमिडाक्लोप्रिड।'
    },
    chickpea: {
        id: 'chickpea',
        nameEn: 'Chickpea (Gram/Chana)',
        nameHi: 'चना (छोला)',
        icon: '🌱',
        seasonEn: 'Rabi (October to December)',
        seasonHi: 'रबी (अक्टूबर से दिसंबर)',
        soilEn: 'Well-drained sandy loam to clay loam soil (pH 6.0-9.0)',
        soilHi: 'अच्छी जल-निकासी वाली बलुई दोमट से मटियार दोमट मिट्टी (pH 6.0-9.0)',
        waterEn: '1-2 light irrigations (pre-flowering and pod development). Avoid excess water.',
        waterHi: '1-2 हल्की सिंचाई (फूल आने से पहले और फली बनते समय)। अत्यधिक पानी से बचें।',
        fertilizerEn: 'Basal: 20-30 kg N, 40-50 kg P, 20 kg K per hectare + Rhizobium inoculation.',
        fertilizerHi: 'बेसल उर्वरक: 20-30 kg N, 40-50 kg P, 20 kg K प्रति हेक्टेयर + राइजोबियम टीकाकरण।',
        pesticideEn: 'Spinosad 45% SC @ 200 ml/ha for Pod Borer; Carbendazim for Wilt.',
        pesticideHi: 'फली छेदक (Pod Borer) के लिए स्पिनोसैड 45% SC @ 200 मिली/हेक्टेयर; उकठा रोग (Wilt) के लिए कार्बेन्डाजिम।'
    },
    lentil: {
        id: 'lentil',
        nameEn: 'Lentil (Masoor)',
        nameHi: 'मसूर',
        icon: '🌱',
        seasonEn: 'Rabi (October to November)',
        seasonHi: 'रबी (अक्टूबर से नवंबर)',
        soilEn: 'Light loamy to clay soils (pH 5.8-7.5)',
        soilHi: 'हल्की दोमट से मटियार मिट्टी (pH 5.8-7.5)',
        waterEn: 'Requires 1-2 irrigations if winter rains fail.',
        waterHi: 'सर्दियों में बारिश न होने पर 1-2 सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 20 kg N, 40 kg P, 20 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 20 kg N, 40 kg P, 20 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Mancozeb 75% WP @ 2 g/L for Rust; Dimethoate for Aphids.',
        pesticideHi: 'गेरूआ (Rust) के लिए मैनकोजेब 75% WP @ 2 ग्राम/लीटर; चेपा (Aphids) के लिए डाइमेथोएट।'
    },
    pigeonpea: {
        id: 'pigeonpea',
        nameEn: 'Pigeon Pea (Arhar/Tur)',
        nameHi: 'अरहर (तुअर)',
        icon: '🌱',
        seasonEn: 'Kharif (June to July)',
        seasonHi: 'खरीफ (जून से जुलाई)',
        soilEn: 'Deep well-drained loamy soil (pH 6.5-7.5)',
        soilHi: 'गहरी जल-निकासी वाली दोमट मिट्टी (pH 6.5-7.5)',
        waterEn: 'Requires 2-3 irrigations if rainfall dry spells exceed 20 days.',
        waterHi: 'यदि बारिश का सूखा दौर 20 दिनों से अधिक हो तो 2-3 सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 25 kg N, 50 kg P, 30 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 25 kg N, 50 kg P, 30 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Indoxacarb 14.5% SC @ 300 ml/ha for Pod Fly/Borer; Carbendazim for Wilt.',
        pesticideHi: 'फली मक्खी/छेदक कीट (Pod Fly/Borer) के लिए इंडोक्साकार्ब 14.5% SC @ 300 मिली/हेक्टेयर; उकठा (Wilt) के लिए कार्बेन्डाजिम।'
    },
    greengram: {
        id: 'greengram',
        nameEn: 'Green Gram (Moong)',
        nameHi: 'मूंग',
        icon: '🌱',
        seasonEn: 'Kharif / Summer (March to June)',
        seasonHi: 'खरीफ / गर्मी (मार्च से जून)',
        soilEn: 'Well-drained sandy loam to loamy soil (pH 6.5-7.5)',
        soilHi: 'अच्छी जल-निकासी वाली बलुई दोमट से दोमट मिट्टी (pH 6.5-7.5)',
        waterEn: 'Requires 3-4 irrigations in summer; rainfed in Kharif.',
        waterHi: 'गर्मी में 3-4 बार सिंचाई की आवश्यकता होती है; खरीफ में वर्षा आधारित।',
        fertilizerEn: 'Basal: 15-20 kg N, 40 kg P, 20 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 15-20 kg N, 40 kg P, 20 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Imidacloprid 17.8% SL @ 100 ml/ha for Whitefly; Mancozeb for Leaf Spot.',
        pesticideHi: 'सफेद मक्खी (Whitefly) के लिए इमिडाक्लोप्रिड 17.8% SL @ 100 मिली/हेक्टेयर; पत्ती धब्बा (Leaf Spot) के लिए मैनकोजेब।'
    },
    blackgram: {
        id: 'blackgram',
        nameEn: 'Black Gram (Urad)',
        nameHi: 'उड़द',
        icon: '🌱',
        seasonEn: 'Kharif (June to July)',
        seasonHi: 'खरीफ (जून से जुलाई)',
        soilEn: 'Rich loamy to clayey soil (pH 6.5-7.8)',
        soilHi: 'समृद्ध दोमट से चिकनी मिट्टी (pH 6.5-7.8)',
        waterEn: 'Requires 1-2 irrigations at pod filling if rains fail.',
        waterHi: 'बारिश न होने पर फली भरने के समय 1-2 सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 20 kg N, 40 kg P, 20 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 20 kg N, 40 kg P, 20 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Thiamethoxam 25% WG @ 100 g/ha for sucking pests; Carbendazim for Powdery Mildew.',
        pesticideHi: 'चूसक कीटों के लिए थायामेथोक्सम 25% WG @ 100 ग्राम/हेक्टेयर; चूर्णी फफूंद (Powdery Mildew) के लिए कार्बेन्डाजिम।'
    },
    sunflower: {
        id: 'sunflower',
        nameEn: 'Sunflower',
        nameHi: 'सूरजमुखी',
        icon: '🌻',
        seasonEn: 'Rabi / Kharif (Best January to February)',
        seasonHi: 'रबी / खरीफ (जनवरी से फरवरी सर्वोत्तम)',
        soilEn: 'Deep rich loamy soil (pH 6.5-8.0)',
        soilHi: 'गहरी समृद्ध दोमट मिट्टी (pH 6.5-8.0)',
        waterEn: 'Requires 5-6 irrigations during critical bud and seed-filling stages.',
        waterHi: 'कलियाँ बनने और बीज भरने की महत्वपूर्ण अवस्थाओं के दौरान 5-6 बार सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 60-80 kg N, 60 kg P, 40 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 60-80 kg N, 60 kg P, 40 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Imidacloprid @ 100 ml/ha for Jassids; Mancozeb 75% WP @ 2 g/L for Alternaria blight.',
        pesticideHi: 'जैसिड्स (Jassids) के लिए इमिडाक्लोप्रिड @ 100 मिली/हेक्टेयर; अल्टरनेरिया ब्लाइट के लिए मैनकोजेब 75% WP @ 2 ग्राम/लीटर।'
    },
    onion: {
        id: 'onion',
        nameEn: 'Onion',
        nameHi: 'प्याज़',
        icon: '🧅',
        seasonEn: 'Year-round (Kharif, Late Kharif & Rabi)',
        seasonHi: 'वर्ष भर (खरीफ, लेट खरीफ और रबी)',
        soilEn: 'Sandy loam to deep loamy soils (pH 5.8-6.5)',
        soilHi: 'बलुई दोमट से गहरी दोमट मिट्टी (pH 5.8-6.5)',
        waterEn: 'Requires frequent light irrigations (every 7-10 days).',
        waterHi: 'लगातार हल्की सिंचाई (हर 7-10 दिनों में) की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 50 kg N, 50 kg P, 80 kg K per hectare; Top: 50 kg N at 30 and 45 days after transplanting.',
        fertilizerHi: 'बेसल उर्वरक: 50 kg N, 50 kg P, 80 kg K प्रति हेक्टेयर। टॉप: रोपाई के 30 और 45 दिन बाद 50 kg N।',
        pesticideEn: 'Fipronil 5% SC @ 1.5 ml/L for Thrips; Mancozeb @ 2.5 g/L for Purple Blotch.',
        pesticideHi: 'थ्रिप्स (Thrips) के लिए फ़िप्रोनिल 5% SC @ 1.5 मिली/लीटर; बैंगनी धब्बा (Purple Blotch) के लिए मैनकोजेब @ 2.5 ग्राम/लीटर।'
    },
    cabbage: {
        id: 'cabbage',
        nameEn: 'Cabbage',
        nameHi: 'पत्तागोभी',
        icon: '🥬',
        seasonEn: 'Rabi (September to November)',
        seasonHi: 'रबी (सितंबर से नवंबर)',
        soilEn: 'Well-drained loamy soil rich in organic matter (pH 6.0-6.8)',
        soilHi: 'अच्छी जल-निकासी वाली और जैविक तत्वों से भरपूर दोमट मिट्टी (pH 6.0-6.8)',
        waterEn: 'Irrigate every 8-10 days. Maintain consistent soil moisture.',
        waterHi: 'हर 8-10 दिनों में सिंचाई करें। मिट्टी में नमी का स्तर लगातार बनाए रखें।',
        fertilizerEn: 'Basal: 60 kg N, 60 kg P, 60 kg K per hectare; Top: 60 kg N at 30 and 45 days.',
        fertilizerHi: 'बेसल: 60 kg N, 60 kg P, 60 kg K प्रति हेक्टेयर। टॉप: 30 और 45 दिनों पर 60 kg N।',
        pesticideEn: 'Spinosad 45% SC @ 150 ml/ha for Diamondback Moth; Copper Oxychloride for Black Rot.',
        pesticideHi: 'डायमंडबैक मोथ (DBM) के लिए स्पिनोसैड 45% SC @ 150 मिली/हेक्टेयर; ब्लैक रॉट के लिए कॉपर ऑक्सीक्लोराइड।'
    },
    cauliflower: {
        id: 'cauliflower',
        nameEn: 'Cauliflower',
        nameHi: 'फूलगोभी',
        icon: '🥦',
        seasonEn: 'Rabi (September to November)',
        seasonHi: 'रबी (सितंबर से नवंबर)',
        soilEn: 'Deep well-drained loamy soil rich in organic matter (pH 5.5-6.5)',
        soilHi: 'गहरी अच्छी जल-निकासी वाली और जैविक तत्वों से भरपूर दोमट मिट्टी (pH 5.5-6.5)',
        waterEn: 'Requires regular irrigation every 7-9 days.',
        waterHi: 'हर 7-9 दिनों में नियमित सिंचाई की आवश्यकता होती है।',
        fertilizerEn: 'Basal: 80 kg N, 60 kg P, 80 kg K per hectare + Boron/Molybdenum applications.',
        fertilizerHi: 'बेसल: 80 kg N, 60 kg P, 80 kg K प्रति हेक्टेयर + बोरॉन/मोलिब्डेनम अनुप्रयोग।',
        pesticideEn: 'Cartap Hydrochloride @ 1 g/L for Caterpillar; Metalaxyl @ 2 g/L for Downy Mildew.',
        pesticideHi: 'सुंडी (Caterpillar) के लिए कार्टाप हाइड्रोक्लोराइड @ 1 ग्राम/लीटर; डाउनी मिल्ड्यू के लिए मेटालैक्सिल @ 2 ग्राम/लीटर।'
    },
    chili: {
        id: 'chili',
        nameEn: 'Chili',
        nameHi: 'मिर्च',
        icon: '🌶️',
        seasonEn: 'Kharif / Year-round (Best June to July & September to October)',
        seasonHi: 'खरीफ / वर्ष भर (जून से जुलाई और सितंबर से अक्टूबर सर्वोत्तम)',
        soilEn: 'Sandy loam to clay loam rich in organic matter (pH 6.0-7.0)',
        soilHi: 'जैविक तत्वों से भरपूर बलुई दोमट से मटियार दोमट (pH 6.0-7.0)',
        waterEn: 'Frequent light irrigations (every 7-10 days). Avoid waterlogging.',
        waterHi: 'लगातार हल्की सिंचाई (हर 7-10 दिनों में)। जलभराव से बचें।',
        fertilizerEn: 'Basal: 40-50 kg N, 60-80 kg P, 50-60 kg K per hectare; Top: 25-30 kg N in 3 split doses.',
        fertilizerHi: 'बेसल: 40-50 kg N, 60-80 kg P, 50-60 kg K प्रति हेक्टेयर। टॉप: 3 विभाजित खुराकों में 25-30 kg N।',
        pesticideEn: 'Imidacloprid 17.8% SL @ 0.5 ml/L for Thrips/Whitefly; Copper Oxychloride for Anthracnose.',
        pesticideHi: 'थ्रिप्स/सफेद मक्खी के लिए इमिडाक्लोप्रिड 17.8% SL @ 0.5 मिली/लीटर; एन्थ्रेक्नोज के लिए कॉपर ऑक्सीक्लोराइड।'
    },
    ginger: {
        id: 'ginger',
        nameEn: 'Ginger',
        nameHi: 'अदरक',
        icon: '🫚',
        seasonEn: 'Kharif (April to May)',
        seasonHi: 'खरीफ (अप्रैल से मई)',
        soilEn: 'Sandy loam to clay loam or red loamy soils (pH 6.0-6.5)',
        soilHi: 'बलुई दोमट से मटियार दोमट या लाल दोमट मिट्टी (pH 6.0-6.5)',
        waterEn: 'Requires regular irrigation every 10-15 days; rainfed in heavy rain zones.',
        waterHi: 'हर 10-15 दिनों में नियमित सिंचाई; भारी बारिश वाले क्षेत्रों में वर्षा आधारित।',
        fertilizerEn: 'Basal: 75 kg N, 50 kg P, 50 kg K per hectare + Organic manure 25-30 t/ha.',
        fertilizerHi: 'बेसल: 75 kg N, 50 kg P, 50 kg K प्रति हेक्टेयर + जैविक खाद 25-30 टन/हेक्टेयर।',
        pesticideEn: 'Metalaxyl @ 2.5 g/L drenching for Soft Rot; Quinalphos 25% EC for Stem Borer.',
        pesticideHi: 'नरम सड़न (Soft Rot) के लिए मेटालैक्सिल @ 2.5 ग्राम/लीटर ड्रेन्चिंग; तना छेदक के लिए क्विनालफॉस 25% EC।'
    },
    turmeric: {
        id: 'turmeric',
        nameEn: 'Turmeric',
        nameHi: 'हल्दी',
        icon: '✨',
        seasonEn: 'Kharif (May to June)',
        seasonHi: 'खरीफ (मई से जून)',
        soilEn: 'Well-drained clayey loam or alluvial soils (pH 5.0-7.5)',
        soilHi: 'अच्छी जल-निकासी वाली मटियार दोमट या जलोढ़ मिट्टी (pH 5.0-7.5)',
        waterEn: 'Requires 15-20 irrigations in total (depends on rain).',
        waterHi: 'कुल 15-20 सिंचाई की आवश्यकता होती है (बारिश पर निर्भर)।',
        fertilizerEn: 'Basal: 60 kg N, 50 kg P, 120 kg K per hectare + Neem cake 2 t/ha.',
        fertilizerHi: 'बेसल: 60 kg N, 50 kg P, 120 kg K प्रति हेक्टेयर + नीम की खली 2 टन/हेक्टेयर।',
        pesticideEn: 'Mancozeb 75% WP @ 2.5 g/L for Rhizome Rot; Quinalphos for shoot borer.',
        pesticideHi: 'कंद सड़न (Rhizome Rot) के लिए मैनकोजेब 75% WP @ 2.5 ग्राम/लीटर; तना छेदक के लिए क्विनालफॉस।'
    },
    banana: {
        id: 'banana',
        nameEn: 'Banana',
        nameHi: 'केला',
        icon: '🍌',
        seasonEn: 'Year-round (Best June to July)',
        seasonHi: 'वर्ष भर (जून से जुलाई सर्वोत्तम)',
        soilEn: 'Deep rich loamy clay soils (pH 6.0-7.5)',
        soilHi: 'गहरी समृद्ध दोमट मटियार मिट्टी (pH 6.0-7.5)',
        waterEn: 'High water requirement (drip irrigation every 2-3 days).',
        waterHi: 'अधिक पानी की आवश्यकता (हर 2-3 दिनों में ड्रिप सिंचाई)।',
        fertilizerEn: 'Per Plant: 200 g N, 50 g P, 300 g K in split doses over growth cycle.',
        fertilizerHi: 'प्रति पौधा: विकास चक्र के दौरान विभाजित खुराकों में 200 ग्राम N, 50 ग्राम P, 300 ग्राम K।',
        pesticideEn: 'Propiconazole 25% EC @ 1 ml/L for Sigatoka Leaf Spot; Carbofuran for nematodes.',
        pesticideHi: 'सिगाटोका पत्ती धब्बा के लिए प्रोपिकोनाज़ोल 25% EC @ 1 मिली/लीटर; सूत्रकृमि (Nematodes) के लिए कार्बोफ्यूरॉन।'
    },
    mango: {
        id: 'mango',
        nameEn: 'Mango',
        nameHi: 'आम',
        icon: '🥭',
        seasonEn: 'Perennial (Plantation best July to August)',
        seasonHi: 'बारहमासी (पौधरोपण जुलाई से अगस्त सर्वोत्तम)',
        soilEn: 'Deep well-drained alluvial or loamy soils (pH 5.5-7.5)',
        soilHi: 'गहरी जल-निकासी वाली जलोढ़ या दोमट मिट्टी (pH 5.5-7.5)',
        waterEn: 'Irrigate young plants weekly; mature trees require minimal water except during fruit development.',
        waterHi: 'छोटे पौधों को साप्ताहिक सिंचाई करें; परिपक्व पेड़ों को फल बनने के समय को छोड़कर न्यूनतम पानी की आवश्यकता होती है।',
        fertilizerEn: 'Per Tree (10+ yrs): 1 kg N, 1 kg P, 1.5 kg K + FYM (Farm Yard Manure) 50-80 kg annually.',
        fertilizerHi: 'प्रति पेड़ (10+ वर्ष): सालाना 1 kg N, 1 kg P, 1.5 kg K + गोबर की खाद (FYM) 50-80 किग्रा।',
        pesticideEn: 'Imidacloprid @ 3 ml/10 L for Mango Hopper; Carbendazim for Anthracnose/Powdery Mildew.',
        pesticideHi: 'आम के भुनगे (Mango Hopper) के लिए इमिडाक्लोप्रिड @ 3 मिली/10 लीटर; एन्थ्रेक्नोज/चूर्णी फफूंद के लिए कार्बेन्डाजिम।'
    },
    orange: {
        id: 'orange',
        nameEn: 'Orange',
        nameHi: 'संतरा',
        icon: '🍊',
        seasonEn: 'Perennial (Plantation best June to August)',
        seasonHi: 'बारहमासी (पौधरोपण जून से अगस्त सर्वोत्तम)',
        soilEn: 'Well-drained sandy loam or clay loam (pH 5.5-7.5)',
        soilHi: 'अच्छी जल-निकासी वाली बलुई दोमट या मटियार दोमट (pH 5.5-7.5)',
        waterEn: 'Requires regular watering. Avoid waterlogging around root zone.',
        waterHi: 'नियमित सिंचाई की आवश्यकता होती है। जड़ों के आसपास जलभराव से बचें।',
        fertilizerEn: 'Per Tree (mature): 600 g N, 200 g P, 400 g K annually in split doses.',
        fertilizerHi: 'प्रति पेड़ (परिपक्व): सालाना विभाजित खुराकों में 600 ग्राम N, 200 ग्राम P, 400 ग्राम K।',
        pesticideEn: 'Imidacloprid @ 0.5 ml/L for Citrus Leaf Miner; Copper Oxychloride for Canker.',
        pesticideHi: 'सिट्रस लीफ माइनर के लिए इमिडाक्लोप्रिड @ 0.5 मिली/लीटर; कैंकर (Canker) के लिए कॉपर ऑक्सीक्लोराइड।'
    },
    grapes: {
        id: 'grapes',
        nameEn: 'Grapes',
        nameHi: 'अंगूर',
        icon: '🍇',
        seasonEn: 'Perennial (Plantation best January to February)',
        seasonHi: 'बारहमासी (पौधरोपण जनवरी से फरवरी सर्वोत्तम)',
        soilEn: 'Sandy loam to clay loam with good drainage (pH 6.5-7.5)',
        soilHi: 'अच्छी जल-निकासी वाली बलुई दोमट से मटियार दोमट (pH 6.5-7.5)',
        waterEn: 'Irrigate every 7-10 days in winter, 3-5 days in summer. Drip preferred.',
        waterHi: 'सर्दियों में हर 7-10 दिनों में, गर्मियों में 3-5 दिनों में सिंचाई करें। ड्रिप सर्वोत्तम है।',
        fertilizerEn: 'Per hectare: 100 kg N, 50 kg P, 150 kg K (adjusted after pruning).',
        fertilizerHi: 'प्रति हेक्टेयर: 100 kg N, 50 kg P, 150 kg K (कटाई-छंटाई के बाद समायोजित)।',
        pesticideEn: 'Copper Oxychloride @ 3 g/L for Downy Mildew; Dinocap @ 1 ml/L for Powdery Mildew.',
        pesticideHi: 'डाउनी मिल्ड्यू के लिए कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर; चूर्णी फफूंद (Powdery Mildew) के लिए डाइनोकैप @ 1 मिली/लीटर।'
    },
    tea: {
        id: 'tea',
        nameEn: 'Tea',
        nameHi: 'चाय',
        icon: '🫖',
        seasonEn: 'Plantation crop (Plucking year-round)',
        seasonHi: 'बागवानी फसल (साल भर तुड़ाई)',
        soilEn: 'Deep acidic well-drained loamy soil (pH 4.5-5.5)',
        soilHi: 'गहरी अम्लीय अच्छी जल-निकासी वाली दोमट मिट्टी (pH 4.5-5.5)',
        waterEn: 'Requires high humidity and well-distributed rainfall; regular irrigation in dry months.',
        waterHi: 'उच्च आर्द्रता और समान रूप से वितरित वर्षा की आवश्यकता; सूखे महीनों में नियमित सिंचाई।',
        fertilizerEn: 'N:P:K ratio of 90:45:90 or 120:60:120 kg/ha annually.',
        fertilizerHi: 'सालाना 90:45:90 या 120:60:120 किग्रा/हेक्टेयर का N:P:K अनुपात।',
        pesticideEn: 'Ethion 50% EC @ 1.5 ml/L for Red Spider Mite; Copper fungicides for Blister Blight.',
        pesticideHi: 'लाल मकड़ी (Red Spider Mite) के लिए इथियान 50% EC @ 1.5 मिली/लीटर; फफोला झुलसा (Blister Blight) के लिए तांबा कवकनाशी।'
    },
    coffee: {
        id: 'coffee',
        nameEn: 'Coffee',
        nameHi: 'कॉफ़ी',
        icon: '☕',
        seasonEn: 'Plantation crop (Harvesting November to February)',
        seasonHi: 'बागवानी फसल (कटाई नवंबर से फरवरी)',
        soilEn: 'Deep well-drained organic forest loam (pH 5.0-6.5)',
        soilHi: 'गहरी अच्छी जल-निकासी वाली कार्बनिक जंगली दोमट मिट्टी (pH 5.0-6.5)',
        waterEn: 'Requires moderate irrigation. Critical sprinkler irrigation for blossom backing.',
        waterHi: 'मध्यम सिंचाई की आवश्यकता। कलियाँ खिलने के लिए स्प्रिंकलर सिंचाई महत्वपूर्ण है।',
        fertilizerEn: 'Mature Arabica: 140 kg N, 110 kg P, 120 kg K per hectare annually.',
        fertilizerHi: 'परिपक्व अरेबिका: सालाना 140 kg N, 110 kg P, 120 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Chlorpyriphos @ 2 ml/L for Coffee White Stem Borer; Triadimefon for Coffee Rust.',
        pesticideHi: 'सफेद तना छेदक के लिए क्लोरपायरीफॉस @ 2 मिली/लीटर; कॉफ़ी गेरूआ (Rust) के लिए ट्रायडाइमेफोन।'
    },
    coconut: {
        id: 'coconut',
        nameEn: 'Coconut',
        nameHi: 'नारियल',
        icon: '🥥',
        seasonEn: 'Plantation crop (Year-round harvest)',
        seasonHi: 'बागवानी फसल (वर्ष भर तुड़ाई)',
        soilEn: 'Well-drained sandy loam, alluvial, or lateritic soils (pH 5.2-8.0)',
        soilHi: 'अच्छी जल-निकासी वाली बलुई दोमट, जलोढ़ या लेटराइट मिट्टी (pH 5.2-8.0)',
        waterEn: 'Requires 100-150 L of water per tree every 4-7 days; drip preferred.',
        waterHi: 'हर 4-7 दिनों में प्रति पेड़ 100-150 लीटर पानी की आवश्यकता; ड्रिप सिंचाई सर्वोत्तम।',
        fertilizerEn: 'Per Palm (mature): 500 g N, 320 g P, 1200 g K annually in split doses.',
        fertilizerHi: 'प्रति पेड़ (परिपक्व): सालाना विभाजित खुराकों में 500 ग्राम N, 320 ग्राम P, 1200 ग्राम K।',
        pesticideEn: 'Imidacloprid/Pheromone traps for Red Palm Weevil; Carbaryl for Rhinoceros Beetle.',
        pesticideHi: 'लाल ताड़ घुन (Red Palm Weevil) के लिए इमिडाक्लोप्रिड/फेरोमोन ट्रैप; राइनोसेरोस बीटल के लिए कार्बारिल।'
    },
    jute: {
        id: 'jute',
        nameEn: 'Jute',
        nameHi: 'जूट',
        icon: '🎋',
        seasonEn: 'Kharif (March to May sowing)',
        seasonHi: 'खरीफ (मार्च से मई बुवाई)',
        soilEn: 'Alluvial loamy soil (pH 6.0-7.5)',
        soilHi: 'जलोढ़ दोमट मिट्टी (pH 6.0-7.5)',
        waterEn: 'Requires heavy rainfall and high humidity. Minimal initial irrigation.',
        waterHi: 'भारी वर्षा और उच्च आर्द्रता की आवश्यकता होती है। प्रारंभिक सिंचाई न्यूनतम।',
        fertilizerEn: 'Basal: 40-60 kg N, 20-30 kg P, 20-30 kg K per hectare.',
        fertilizerHi: 'बेसल उर्वरक: 40-60 kg N, 20-30 kg P, 20-30 kg K प्रति हेक्टेयर।',
        pesticideEn: 'Endosulfan/Fenvalerate @ 1.5 ml/L for Semilooper; Carbendazim for Stem Rot.',
        pesticideHi: 'सेमीलूपर सुंडी के लिए फेनवालेरेट @ 1.5 मिली/लीटर; तना सड़न (Stem Rot) के लिए कार्बेन्डाजिम।'
    },
    rubber: {
        id: 'rubber',
        nameEn: 'Rubber',
        nameHi: 'रबर',
        icon: '🌿',
        seasonEn: 'Plantation crop (Planting best June to July)',
        seasonHi: 'बागवानी फसल (पौधरोपण जून से जुलाई सर्वोत्तम)',
        soilEn: 'Deep well-drained acidic lateritic clay loam (pH 4.5-6.0)',
        soilHi: 'गहरी जल-निकासी वाली अम्लीय लेटराइट मटियार दोमट (pH 4.5-6.0)',
        waterEn: 'Requires high well-distributed rainfall (2000-3000 mm). Minimum irrigation except in nurseries.',
        waterHi: 'उच्च और समान रूप से वितरित वर्षा (2000-3000 मिमी) की आवश्यकता। नर्सरी को छोड़कर न्यूनतम सिंचाई।',
        fertilizerEn: 'Basal: 10:10:15 NPK mixture @ 250 kg/ha annually for immature plants.',
        fertilizerHi: 'अपरिपक्व पौधों के लिए सालाना 10:10:15 NPK मिश्रण @ 250 किग्रा/हेक्टेयर।',
        pesticideEn: 'Copper Oxychloride dusting for Abnormal Leaf Fall; Carbendazim for Pink Disease.',
        pesticideHi: 'असामान्य पत्ती गिरने के लिए कॉपर ऑक्सीक्लोराइड डस्टिंग; पिंक डिजीज के लिए कार्बेन्डाजिम।'
    }
};

// Government Welfare Schemes Database
const schemesDb = [
    {
        nameEn: 'PM Kisan Yojana',
        nameHi: 'पीएम किसान योजना',
        descEn: 'Provides financial support of ₹6000/year to small/marginal farmers.',
        descHi: 'छोटे और सीमांत किसानों को प्रति वर्ष ₹6000 की वित्तीय सहायता प्रदान करता है।',
        badgeEn: 'Income Support',
        badgeHi: 'आय सहायता',
        icon: '💰',
        link: 'https://pmkisan.gov.in'
    },
    {
        nameEn: 'Soil Health Card Scheme',
        nameHi: 'मृदा स्वास्थ्य कार्ड योजना',
        descEn: 'Monitors soil chemistry parameters, macro/micronutrients, and guides crop optimization.',
        descHi: 'मिट्टी के रासायनिक मापदंडों, वृहत और सूक्ष्म पोषक तत्वों की जांच कर फसल सुधार का मार्गदर्शन करता है।',
        badgeEn: 'Soil Health',
        badgeHi: 'मृदा स्वास्थ्य',
        icon: '🧪',
        link: 'https://soilhealth.dac.gov.in'
    },
    {
        nameEn: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
        nameHi: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
        descEn: 'Crop insurance protection against natural calamities and yield failures.',
        descHi: 'प्राकृतिक आपदाओं और फसल बर्बादी के खिलाफ सुरक्षा प्रदान करने वाला फसल बीमा।',
        badgeEn: 'Insurance',
        badgeHi: 'फसल बीमा',
        icon: '🛡️',
        link: 'https://pmfby.gov.in'
    },
    {
        nameEn: 'National Mission for Sustainable Agriculture (NMSA)',
        nameHi: 'सतत कृषि के लिए राष्ट्रीय मिशन (NMSA)',
        descEn: 'Promotes water use efficiency, organic composting, and sustainable soil health management.',
        descHi: 'पानी के कुशल उपयोग, जैविक खाद के प्रसार और टिकाऊ मृदा स्वास्थ्य प्रबंधन को बढ़ावा देता है।',
        badgeEn: 'Sustainability',
        badgeHi: 'टिकाऊ कृषि',
        icon: '🌿',
        link: 'https://nmsa.dac.gov.in'
    }
];

// Localization Dictionary
const translations = {
    en: {
        "txt-app-title": "Kisan Mitra",
        "txt-app-subtitle": "Farmers' Grievances, Our Solutions",
        "txt-title-location": "Regional Farming Jurisdiction",
        "txt-lbl-state": "Select State",
        "txt-lbl-district": "Select District",
        "txt-lbl-block": "Select Block",
        "txt-opt-district-placeholder": "Select State First",
        "txt-opt-block-placeholder": "Select District First",
        "txt-lbl-custom-block": "Village/Block Name",
        "input-custom-block": "Type village/block name...",
        "btn-custom-block-apply": "Apply",
        "txt-title-weather": "Meteorological Center",
        "txt-lbl-simulation": "3D Environment:",
        "txt-lbl-temp": "Temperature",
        "txt-lbl-humidity": "Humidity",
        "txt-lbl-wind": "Wind Speed",
        "txt-title-mandi": "Mandi Optimizer & Profit Predictor",
        "txt-lbl-profit-calc": "Projected Gross Margin (Per Quintal)",
        "txt-lbl-profit-sub": "Calculated as: Market Price - Wholesaler Price",
        "txt-lbl-market-val": "Market Value",
        "txt-lbl-wholesale-val": "Wholesaler Cost",
        "txt-title-crops": "Crop Cultivation Guide",
        "txt-title-schemes": "Government Welfare Schemes",
        "lbl-drawer-soil": "Soil Suitability",
        "lbl-drawer-season": "Cultivation Season",
        "lbl-drawer-water": "Irrigation Frequency",
        "lbl-drawer-fertilizer": "Fertilizers Scheme",
        "lbl-drawer-pesticide": "Pesticide Recommendation",
        "txt-chat-header-title": "Kisan Mitra AI Assistant",
        "txt-chat-header-status": "Online Support",
        "txt-chat-welcome": "Hello! I am your Kisan Mitra AI helper. You can ask me about soil, irrigation, fertilizer dosages, pesticides, weather updates, or government schemes.",
        "chat-user-input": "Type agricultural query...",
        "txt-menu-title": "Explore Agriculture Modules",
        "txt-menu-weather-title": "Weather & Jurisdiction",
        "txt-menu-weather-desc": "Real-time parameters, 7-day trend chart, and 3D simulation for your local village.",
        "txt-menu-mandi-title": "Mandi Price Optimizer",
        "txt-menu-mandi-desc": "Analyze market price vs wholesaler cost margins and net profits for crops.",
        "txt-menu-crops-title": "Crop Cultivation Guide",
        "txt-menu-crops-desc": "Detailed guide for soil, season, watering schedules, NPK fertilizer, and pesticides.",
        "txt-menu-schemes-title": "Government Schemes & AI Assist",
        "txt-menu-schemes-desc": "Access official welfare schemes and chat with our Kisan Mitra AI Assistant.",
        "txt-btn-back-weather": "Back to Modules",
        "txt-btn-back-mandi": "Back to Modules",
        "txt-btn-back-crops": "Back to Modules",
        "txt-btn-back-schemes": "Back to Modules",
        "btn-crop-page-1": "Field Crops & Pulses",
        "btn-crop-page-2": "Vegetables, Fruits & Plantation",
        "txt-graph-title": "7-Day Meteorological Trend & Forecast",
        "txt-mandi-loc-label": "Selected Jurisdiction:",
        "txt-btn-locate": "Locate Me",
        "txt-mandi-select-crops": "Select Crops to Compare:",
        "txt-menu-soil-title": "Soil & Disease Diagnosis",
        "txt-menu-soil-desc": "Identify crop diseases and get soil health recommendations based on symptoms.",
        "txt-btn-back-soil": "Back to Modules",
        "txt-title-soil": "Soil & Crop Disease Diagnosis",
        "txt-soil-health-title": "Soil Health Analyzer",
        "txt-disease-title": "Crop Disease Symptom Checker",
        "txt-lbl-ph": "Soil pH Level",
        "txt-lbl-nitrogen": "Nitrogen (N) mg/kg",
        "txt-lbl-phosphorus": "Phosphorus (P) kg/ha",
        "txt-lbl-potassium": "Potassium (K) kg/ha",
        "txt-lbl-disease-crop": "Select Crop",
        "txt-disease-instruction": "Select symptoms you are observing in your crop:",
        "txt-btn-diagnose": "Diagnose Disease",
        "txt-title-irrigation": "Irrigation Calculator",
        "txt-lbl-irr-crop": "Crop Type",
        "txt-lbl-irr-area": "Field Area (Hectares)",
        "txt-lbl-irr-soil": "Soil Type",
        "txt-lbl-irr-stage": "Growth Stage",
        "txt-irr-lbl-water": "Water Required",
        "txt-irr-lbl-freq": "Irrigation Frequency",
        "txt-irr-lbl-next": "Next Irrigation",
        "txt-irr-lbl-method": "Best Method",
        "txt-title-crop-calendar": "Seasonal Crop Calendar",
        "txt-soil-health-title": "Soil Health Analyzer",
        "txt-menu-irrigation-title": "Irrigation Planner",
        "txt-menu-irrigation-desc": "Calculate water needs, irrigation schedule and best method for your crop and soil type.",
        "txt-btn-back-irrigation": "Back to Modules",
        "txt-title-irrigation": "Irrigation Planner",
        "txt-irr-module-desc": "Enter your crop details to get precise water requirements, optimal irrigation schedule, and the best irrigation method for maximum yield.",
        "txt-irr-methods-title": "Irrigation Method Comparison",
        "txt-irr-m1": "Drip Irrigation",
        "txt-irr-m1-desc": "Water savings up to 50%. Best for vegetables, fruits & sugarcane. High initial cost.",
        "txt-irr-m2": "Sprinkler",
        "txt-irr-m2-desc": "Uniform coverage. Ideal for mustard, wheat & lawns. Reduces soil erosion.",
        "txt-irr-m3": "Flood / Furrow",
        "txt-irr-m3-desc": "Traditional method. Low cost. Suitable for rice & wheat in flat fields.",
        "txt-irr-eff": "Efficiency",
        "txt-irr-eff2": "Efficiency",
        "txt-irr-eff3": "Efficiency",
        "lbl-3d-temp": "Temp",
        "lbl-3d-rain": "Rain Chance",
        "lbl-3d-humidity": "Humidity",
        "lbl-3d-wind": "Wind",
        "lbl-3d-soil": "Soil Moisture",
        "txt-mandi-table-title": "Crop Price Overview (Per Quintal)",
        "th-crop": "Crop",
        "th-market": "Mandi Price",
        "th-wholesale": "Wholesale Cost",
        "th-profit": "Profit Margin",
        "th-trend": "Trend"
    },
    hi: {
        "txt-app-title": "किसान मित्र",
        "txt-app-subtitle": "किसानों की समस्याएं, हमारे समाधान",
        "txt-title-location": "क्षेत्रीय कृषि अधिकार क्षेत्र",
        "txt-lbl-state": "राज्य चुनें",
        "txt-lbl-district": "जिला चुनें",
        "txt-lbl-block": "ब्लॉक चुनें",
        "txt-opt-district-placeholder": "पहले राज्य चुनें",
        "txt-opt-block-placeholder": "पहले जिला चुनें",
        "txt-lbl-custom-block": "ग्राम/ब्लॉक का नाम",
        "input-custom-block": "ग्राम/ब्लॉक का नाम दर्ज करें...",
        "btn-custom-block-apply": "लागू करें",
        "txt-title-weather": "मौसम विज्ञान केंद्र",
        "txt-lbl-simulation": "3D वातावरण:",
        "txt-lbl-temp": "तापमान",
        "txt-lbl-humidity": "आर्द्रता",
        "txt-lbl-wind": "हवा की गति",
        "txt-title-mandi": "मंडी अनुकूलक और लाभ पूर्वानुकूलन",
        "txt-lbl-profit-calc": "अनुमानित सकल लाभ (प्रति क्विंटल)",
        "txt-lbl-profit-sub": "गणना सूत्र: बाजार मूल्य - थोक विक्रेता मूल्य",
        "txt-lbl-market-val": "बाजार भाव",
        "txt-lbl-wholesale-val": "थोक लागत",
        "txt-title-crops": "फसल खेती गाइड",
        "txt-title-schemes": "सरकारी कल्याणकारी योजनाएं",
        "lbl-drawer-soil": "उपयुक्त मिट्टी",
        "lbl-drawer-season": "बुवाई का समय",
        "lbl-drawer-water": "सिंचाई की आवृत्ति",
        "lbl-drawer-fertilizer": "उर्वरक की मात्रा",
        "lbl-drawer-pesticide": "कीटनाशक सिफारिश",
        "txt-chat-header-title": "किसान मित्र एआई सहायक",
        "txt-chat-header-status": "ऑनलाइन सहायता",
        "txt-chat-welcome": "नमस्ते! मैं आपका किसान मित्र सहायक हूँ। आप मुझसे मिट्टी, सिंचाई, खाद की मात्रा, कीटनाशकों, मौसम या सरकारी योजनाओं के बारे में पूछ सकते हैं।",
        "chat-user-input": "कृषि संबंधित प्रश्न पूछें...",
        "txt-menu-title": "कृषि मॉड्यूल का अन्वेषण करें",
        "txt-menu-weather-title": "मौसम और क्षेत्रीय अधिकार",
        "txt-menu-weather-desc": "वास्तविक समय के पैरामीटर, 7-दिवसीय रुझान चार्ट और 3D सिमुलेशन।",
        "txt-menu-mandi-title": "मंडी भाव अनुकूलक",
        "txt-menu-mandi-desc": "बाजार मूल्य बनाम थोक विक्रेता लागत मार्जिन का विश्लेषण करें।",
        "txt-menu-crops-title": "फसल खेती गाइड",
        "txt-menu-crops-desc": "मिट्टी, सिंचाई, खाद मात्रा और कीटनाशकों के लिए विस्तृत मार्गदर्शिका।",
        "txt-menu-schemes-title": "सरकारी योजनाएं और एआई सहायता",
        "txt-menu-schemes-desc": "कल्याणकारी योजनाओं तक पहुंचें और हमारे एआई सहायक से चैट करें।",
        "txt-btn-back-weather": "मुख्य मेनू",
        "txt-btn-back-mandi": "मुख्य मेनू",
        "txt-btn-back-crops": "मुख्य मेनू",
        "txt-btn-back-schemes": "मुख्य मेनू",
        "btn-crop-page-1": "अनाज, दलहन और तिलहन",
        "btn-crop-page-2": "सब्जियां, फल और बागवानी",
        "txt-graph-title": "7-दिवसीय मौसम रुझान और पूर्वानुमान",
        "txt-mandi-loc-label": "चयनित अधिकार क्षेत्र:",
        "txt-btn-locate": "स्थान पहचानें",
        "txt-mandi-select-crops": "तुलना के लिए फसलें चुनें:",
        "txt-menu-soil-title": "मृदा एवं रोग निदान",
        "txt-menu-soil-desc": "लक्षणों के आधार पर फसल रोगों की पहचान और मृदा स्वास्थ्य सिफारिशें प्राप्त करें।",
        "txt-btn-back-soil": "मुख्य मेनू",
        "txt-title-soil": "मृदा एवं फसल रोग निदान",
        "txt-soil-health-title": "मृदा स्वास्थ्य विश्लेषक",
        "txt-disease-title": "फसल रोग लक्षण परीक्षक",
        "txt-lbl-ph": "मिट्टी का pH स्तर",
        "txt-lbl-nitrogen": "नाइट्रोजन (N) mg/kg",
        "txt-lbl-phosphorus": "फॉस्फोरस (P) kg/ha",
        "txt-lbl-potassium": "पोटाश (K) kg/ha",
        "txt-lbl-disease-crop": "फसल चुनें",
        "txt-disease-instruction": "अपनी फसल में दिखने वाले लक्षण चुनें:",
        "txt-btn-diagnose": "रोग की पहचान करें",
        "txt-title-irrigation": "सिंचाई आवश्यकता कैलकुलेटर",
        "txt-lbl-irr-crop": "फसल का प्रकार",
        "txt-lbl-irr-area": "खेत का क्षेत्र (हेक्टेयर)",
        "txt-lbl-irr-soil": "मिट्टी का प्रकार",
        "txt-lbl-irr-stage": "विकास की अवस्था",
        "txt-irr-lbl-water": "आवश्यक पानी",
        "txt-irr-lbl-freq": "सिंचाई की आवृत्ति",
        "txt-irr-lbl-next": "अगली सिंचाई",
        "txt-irr-lbl-method": "सर्वोत्तम विधि",
        "txt-title-crop-calendar": "मौसमी फसल कैलेंडर",
        "txt-menu-irrigation-title": "सिंचाई योजनाकार",
        "txt-menu-irrigation-desc": "अपनी फसल और मिट्टी के प्रकार के अनुसार पानी की जरूरत, सिंचाई कार्यक्रम और सर्वोत्तम विधि जानें।",
        "txt-btn-back-irrigation": "मुख्य मेनू",
        "txt-title-irrigation": "सिंचाई योजनाकार",
        "txt-irr-module-desc": "अधिकतम उपज के लिए सटीक जल आवश्यकता, इष्टतम सिंचाई कार्यक्रम और सर्वोत्तम सिंचाई विधि जानने के लिए फसल विवरण दर्ज करें।",
        "txt-irr-methods-title": "सिंचाई विधियों की तुलना",
        "txt-irr-m1": "ड्रिप सिंचाई",
        "txt-irr-m1-desc": "50% तक पानी की बचत। सब्जियों, फलों और गन्ने के लिए सर्वोत्तम। प्रारंभिक लागत अधिक।",
        "txt-irr-m2": "स्प्रिंकलर सिंचाई",
        "txt-irr-m2-desc": "एकसमान कवरेज। सरसों, गेहूँ के लिए आदर्श। मिट्टी का क्षरण कम करता है।",
        "txt-irr-m3": "बाढ़ / नाली सिंचाई",
        "txt-irr-m3-desc": "पारंपरिक विधि। कम लागत। समतल खेतों में चावल और गेहूँ के लिए उपयुक्त।",
        "txt-irr-eff": "दक्षता",
        "txt-irr-eff2": "दक्षता",
        "txt-irr-eff3": "दक्षता",
        "lbl-3d-temp": "तापमान",
        "lbl-3d-rain": "बारिश की संभावना",
        "lbl-3d-humidity": "आर्द्रता",
        "lbl-3d-wind": "हवा",
        "lbl-3d-soil": "मृदा नमी",
        "txt-mandi-table-title": "फसल मूल्य अवलोकन (प्रति क्विंटल)",
        "th-crop": "फसल",
        "th-market": "मंडी मूल्य",
        "th-wholesale": "थोक लागत",
        "th-profit": "लाभ मार्जिन",
        "th-trend": "रुझान"
    }
};

// ==================== APP INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
    // Populate State Select
    populateStateDropdown();
    
    // Set Default Language
    setLanguage('en');

    // Create Initial Charts
    initCharts();

    // Trigger Initial Location Load
    const stateSel = document.getElementById('select-state');
    stateSel.value = "Uttar Pradesh";
    onStateChange();
    const distSel = document.getElementById('select-district');
    distSel.value = "Allahabad";
    onDistrictChange();
    const blockSel = document.getElementById('select-block');
    blockSel.value = "Kaushambi";
    onBlockChange();

    // Setup Lucide Icons
    lucide.createIcons();

    // Setup Clock
    startClock();

    // Initialize new feature modules
    renderCropCalendar();
    renderDiseaseSymptoms();
    calculateIrrigation();
    analyzeSoil();

    // Auto-detect location silently on startup
    autoDetectLocation(true);

    // Initialize Chat Settings
    initChatSettings();

    // Initialize Speech Recognition
    initSpeechRecognition();

    // Render chatbot quick queries
    renderQuickQueries();
});

// Digital Clock Controller
function startClock() {
    setInterval(() => {
        const date = new Date();
        // Adjust for localized simulation date/time
        // User current local time is provided as 2026-06-06T14:58...
        // Let's increment actual system time matching the format
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        document.getElementById('digital-clock').innerText = date.toLocaleTimeString('en-US', options);
    }, 1000);
}

// Portal Feature Switch Navigation Logic
function showFeature(name) {
    // Hide Landing Menu
    const menu = document.getElementById('features-menu');
    if (menu) menu.style.display = 'none';

    // Hide all Module wrappers
    const containers = document.querySelectorAll('.feature-container');
    containers.forEach(el => el.style.display = 'none');

    // Display targeted Module wrapper
    const activeSection = document.getElementById(`section-${name}`);
    if (activeSection) {
        activeSection.style.display = 'flex';
        activeSection.classList.add('animate-fade-in');
    }

    // Scroll back to viewport top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Handle ThreeJS canvas initialization and resize recalculations
    if (name === 'weather') {
        if (typeof init3DWeather === 'function') {
            init3DWeather();
        }
        if (typeof onWindowResize === 'function') {
            setTimeout(onWindowResize, 100);
        }
    }

    // Ensure icons render correctly in navigation nodes
    lucide.createIcons();
}

function showMenu() {
    // Hide all Module wrappers
    const containers = document.querySelectorAll('.feature-container');
    containers.forEach(el => el.style.display = 'none');

    // Display Landing Menu
    const menu = document.getElementById('features-menu');
    if (menu) {
        menu.style.display = 'flex';
        menu.classList.add('animate-fade-in');
    }

    // Scroll back to viewport top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== LOCALIZATION ENGINE ====================
function toggleLanguage() {
    const nextLang = currentLang === 'en' ? 'hi' : 'en';
    setLanguage(nextLang);
}

function setLanguage(lang) {
    currentLang = lang;
    
    // Update body tags for font rendering
    if (lang === 'hi') {
        document.body.className = 'hi';
        document.getElementById('lang-toggle').innerText = 'English';
    } else {
        document.body.className = 'en';
        document.getElementById('lang-toggle').innerText = 'हिन्दी';
    }

    // Update static HTML nodes
    Object.keys(translations[lang]).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'INPUT') {
                el.placeholder = translations[lang][id];
            } else {
                el.innerText = translations[lang][id];
            }
        }
    });

    // Update mandi location badge if global
    const badgeEl = document.getElementById('mandi-location-name');
    if (badgeEl && !activeLocation.state) {
        badgeEl.innerText = lang === 'hi' ? "भारत (राष्ट्रीय औसत)" : "Prices of India";
    }

    // Populate crop dropdowns dynamically based on selected language
    populateCropDropdowns();

    // Populate crops and schemes grid dynamically based on selected language
    renderCropsGrid();
    renderSchemesGrid();

    // Re-render Mandi crop pills and update chart labels
    renderMandiCropPills();
    updateMandiUI();

    // Re-render new dynamic modules on language switch
    renderCropCalendar();
    renderDiseaseSymptoms();
    calculateIrrigation();
    analyzeSoil();

    // Re-render weather trend chart labels and legends on language toggle
    if (typeof updateWeatherChartLabelsAndDatasets === 'function') {
        updateWeatherChartLabelsAndDatasets();
    }

    // Update 3D weather state status text language if active
    if (typeof activeWeatherState !== 'undefined') {
        setWeatherState(activeWeatherState);
    }

    // Recalculate drawer content if currently open
    const drawer = document.getElementById('crop-drawer');
    if (drawer.classList.contains('open')) {
        const activeCropId = drawer.dataset.cropId;
        if (activeCropId) {
            openCropDrawer(activeCropId);
        }
    }

    // Update dynamic accessibility modules on language switch
    renderQuickQueries();
    if (window.currentWeatherMetrics) {
        checkWeatherAlerts(window.currentWeatherMetrics.maxRainChance, window.currentWeatherMetrics.wind);
    }
}

// ==================== REGIONAL LOCATION Drill-Down ====================
function populateStateDropdown() {
    const stateSelect = document.getElementById('select-state');
    stateSelect.innerHTML = `<option value="">Select State / राज्य चुनें</option>`;
    Object.keys(locationData).forEach(state => {
        stateSelect.innerHTML += `<option value="${state}">${state}</option>`;
    });
}

function onStateChange() {
    const stateSelect = document.getElementById('select-state');
    const districtSelect = document.getElementById('select-district');
    const blockSelect = document.getElementById('select-block');

    activeLocation.state = stateSelect.value;
    activeLocation.district = '';
    activeLocation.block = '';

    // Clear District Select
    districtSelect.innerHTML = `<option value="">Select District / जिला चुनें</option>`;
    blockSelect.innerHTML = `<option value="">Select Block / ब्लॉक चुनें</option>`;
    blockSelect.disabled = true;

    // Hide custom block input if visible
    const customGroup = document.getElementById('group-custom-block');
    if (customGroup) customGroup.style.display = 'none';

    if (activeLocation.state) {
        districtSelect.disabled = false;
        const districts = Object.keys(locationData[activeLocation.state]);
        districts.forEach(dist => {
            districtSelect.innerHTML += `<option value="${dist}">${dist}</option>`;
        });
    } else {
        districtSelect.disabled = true;
    }

    updateDashboardMetrics();
}

function onDistrictChange() {
    const stateSelect = document.getElementById('select-state');
    const districtSelect = document.getElementById('select-district');
    const blockSelect = document.getElementById('select-block');

    activeLocation.district = districtSelect.value;
    activeLocation.block = '';

    // Reset custom input
    const customGroup = document.getElementById('group-custom-block');
    if (customGroup) customGroup.style.display = 'none';
    const customInput = document.getElementById('input-custom-block');
    if (customInput) customInput.value = '';

    blockSelect.innerHTML = currentLang === 'hi' ? 
        `<option value="">ब्लॉक चुनें</option>` : 
        `<option value="">Select Block</option>`;

    if (activeLocation.district) {
        blockSelect.disabled = false;
        const predefinedBlocks = locationData[activeLocation.state][activeLocation.district] || [];
        
        let blocks = [];
        if (predefinedBlocks.length > 0) {
            blocks = [...predefinedBlocks];
        } else {
            const d = activeLocation.district;
            blocks = [
                `${d} Central`,
                `${d} North`,
                `${d} South`,
                `${d} East`,
                `${d} West`
            ];
        }
        
        blocks.forEach(block => {
            blockSelect.innerHTML += `<option value="${block}">${block}</option>`;
        });

        // Add "Custom Location / अन्य..." option
        const customLabel = currentLang === 'hi' ? "अन्य स्थान दर्ज करें..." : "Custom Location / Other...";
        blockSelect.innerHTML += `<option value="CUSTOM_BLOCK">${customLabel}</option>`;
    } else {
        blockSelect.disabled = true;
    }

    updateDashboardMetrics();
}

function onBlockChange() {
    const blockSelect = document.getElementById('select-block');
    const customGroup = document.getElementById('group-custom-block');
    const customInput = document.getElementById('input-custom-block');

    if (blockSelect.value === 'CUSTOM_BLOCK') {
        if (customGroup) customGroup.style.display = 'block';
        if (customInput) {
            customInput.value = '';
            customInput.focus();
        }
        activeLocation.block = '';
    } else {
        if (customGroup) customGroup.style.display = 'none';
        activeLocation.block = blockSelect.value;
        updateDashboardMetrics();
    }
}

function applyCustomBlock() {
    const customInput = document.getElementById('input-custom-block');
    if (customInput && customInput.value.trim() !== '') {
        activeLocation.block = customInput.value.trim();
        updateDashboardMetrics();
    }
}

function handleCustomBlockKey(e) {
    if (e.key === 'Enter') {
        applyCustomBlock();
    }
}

function stopMandiTicker() {
    if (mandiTickerId) {
        clearInterval(mandiTickerId);
        mandiTickerId = null;
    }
}

function startMandiTicker(state, district) {
    stopMandiTicker();

    if (!latestMandiBasePrices) return;

    // Initialize mandiCurrentPrices if not set
    if (!mandiCurrentPrices) {
        mandiCurrentPrices = JSON.parse(JSON.stringify(latestMandiBasePrices));
    }

    const marketEl = document.getElementById('val-market-price');
    const wholesaleEl = document.getElementById('val-wholesaler-price');
    const profitEl = document.getElementById('val-profit');

    const marketChangeEl = document.getElementById('val-market-change');
    const wholesaleChangeEl = document.getElementById('val-wholesale-change');
    const profitChangeEl = document.getElementById('val-profit-change');

    mandiTickerId = setInterval(() => {
        if (!mandiPriceChart) return;

        // Clone previous current prices to compare
        const prevPrices = JSON.parse(JSON.stringify(mandiCurrentPrices));

        const keys = activeMandiCrops;
        
        // Apply micro-fluctuation to each active commodity (between -0.4% and +0.4% per tick, max +/- 3% of baseline)
        keys.forEach(k => {
            const base = latestMandiBasePrices[k];
            const prev = prevPrices[k];
            if (!base || !prev) return;

            // Generate change percentage between -0.4% and +0.4%
            const changePct = (Math.random() * 0.8 - 0.4) / 100;
            
            let newMarket = Math.round(prev.market * (1 + changePct));
            let newWholesale = Math.round(prev.wholesale * (1 + changePct));

            // Constrain to +/- 3% of original base price to avoid drift
            const maxMarketLimit = Math.round(base.market * 1.03);
            const minMarketLimit = Math.round(base.market * 0.97);
            const maxWholesaleLimit = Math.round(base.wholesale * 1.03);
            const minWholesaleLimit = Math.round(base.wholesale * 0.97);

            newMarket = Math.max(minMarketLimit, Math.min(maxMarketLimit, newMarket));
            newWholesale = Math.max(minWholesaleLimit, Math.min(maxWholesaleLimit, newWholesale));

            mandiCurrentPrices[k] = {
                market: newMarket,
                wholesale: newWholesale
            };
        });

        // Update the metric card highlight based on primary crop (first active)
        const primaryCropKey = activeMandiCrops[0] || 'wheat';
        const basePrimary = latestMandiBasePrices[primaryCropKey];
        const prevPrimary = prevPrices[primaryCropKey];
        const currPrimary = mandiCurrentPrices[primaryCropKey];

        // Function to update element and apply flashing animation
        const updateTickMetric = (el, changeEl, currentVal, prevVal, baseVal) => {
            if (!el) return;

            el.innerText = `₹${currentVal}`;
            
            if (!changeEl) return;

            // Calculate percentage deviation from API baseline
            const devPct = ((currentVal - baseVal) / baseVal) * 100;
            const sign = devPct >= 0 ? '+' : '';
            const arrow = currentVal > prevVal ? '▲' : (currentVal < prevVal ? '▼' : '');
            
            changeEl.innerText = `${sign}${devPct.toFixed(2)}% ${arrow}`;

            // Remove previous animation classes
            changeEl.classList.remove('flash-up', 'flash-down', 'up', 'down', 'neutral');

            // Apply flash state and style color
            if (currentVal > prevVal) {
                changeEl.classList.add('up', 'flash-up');
            } else if (currentVal < prevVal) {
                changeEl.classList.add('down', 'flash-down');
            } else {
                // Keep the color state based on total deviation
                changeEl.classList.add(devPct >= 0 ? 'up' : 'down');
            }
        };

        if (basePrimary && prevPrimary && currPrimary) {
            const prevProfit = prevPrimary.market - prevPrimary.wholesale;
            const currProfit = currPrimary.market - currPrimary.wholesale;
            const baseProfit = basePrimary.market - basePrimary.wholesale;

            // Update main values on dashboard
            updateTickMetric(marketEl, marketChangeEl, currPrimary.market, prevPrimary.market, basePrimary.market);
            updateTickMetric(wholesaleEl, wholesaleChangeEl, currPrimary.wholesale, prevPrimary.wholesale, basePrimary.wholesale);
            updateTickMetric(profitEl, profitChangeEl, currProfit, prevProfit, baseProfit);
        }

        // Update Chart
        const mPrices = keys.map(k => mandiCurrentPrices[k].market);
        const wCosts = keys.map(k => mandiCurrentPrices[k].wholesale);
        const profits = mPrices.map((val, idx) => val - wCosts[idx]);

        mandiPriceChart.data.datasets[0].data = mPrices;
        mandiPriceChart.data.datasets[1].data = wCosts;
        mandiPriceChart.data.datasets[2].data = profits;
        mandiPriceChart.update('none'); // Update without reset animation for smoothness

        // Update tabular crop prices table synchronously with live fluctuations
        populateMandiTable();
    }, 5000);
}

// Mandi price default baselines for fallback
const MANDI_BASELINES = {
    wheat:      { market: 2400,  wholesale: 2200 },
    rice:       { market: 2500,  wholesale: 2300 },
    sugarcane:  { market: 350,   wholesale: 300  },
    sesame:     { market: 9500,  wholesale: 8800 },
    mustard:    { market: 5500,  wholesale: 5000 },
    potato:     { market: 1500,  wholesale: 1200 },
    tomato:     { market: 2000,  wholesale: 1500 },
    bajra:      { market: 2200,  wholesale: 2000 },
    corn:       { market: 2100,  wholesale: 1950 },
    peanuts:    { market: 6500,  wholesale: 5800 },
    cotton:     { market: 6500,  wholesale: 5900 },
    soybean:    { market: 4800,  wholesale: 4400 },
    barley:     { market: 2250,  wholesale: 2050 },
    chickpea:   { market: 5400,  wholesale: 5000 },
    lentil:     { market: 6200,  wholesale: 5700 },
    pigeonpea:  { market: 7500,  wholesale: 7000 },
    greengram:  { market: 7200,  wholesale: 6700 },
    blackgram:  { market: 7000,  wholesale: 6500 },
    sunflower:  { market: 6000,  wholesale: 5500 },
    onion:      { market: 1800,  wholesale: 1400 },
    cabbage:    { market: 1200,  wholesale: 900  },
    cauliflower:{ market: 1600,  wholesale: 1200 },
    chili:      { market: 8500,  wholesale: 7500 },
    ginger:     { market: 9000,  wholesale: 8000 },
    turmeric:   { market: 8200,  wholesale: 7400 },
    banana:     { market: 2200,  wholesale: 1800 },
    mango:      { market: 4500,  wholesale: 3500 },
    orange:     { market: 3800,  wholesale: 3000 },
    grapes:     { market: 6500,  wholesale: 5500 },
    tea:        { market: 18000, wholesale: 16000},
    coffee:     { market: 22000, wholesale: 19500},
    coconut:    { market: 3500,  wholesale: 3000 },
    jute:       { market: 4600,  wholesale: 4200 },
    rubber:     { market: 15000, wholesale: 13500}
};

// ==================== REAL-TIME MANDI INTEGRATION ====================
async function fetchMandiPrices(state, district) {
    const marketEl = document.getElementById('val-market-price');
    const wholesaleEl = document.getElementById('val-wholesaler-price');
    const profitEl = document.getElementById('val-profit');
    const badgeEl = document.getElementById('mandi-location-name');

    // Add shimmers
    if (marketEl) marketEl.classList.add('loading-shimmer');
    if (wholesaleEl) wholesaleEl.classList.add('loading-shimmer');
    if (profitEl) profitEl.classList.add('loading-shimmer');

    let displayLocation = '';
    let apiLocationQuery = '';
    
    // Normalization & query construction
    if (district) {
        let distQuery = district;
        let displayName = district;
        if (district.toLowerCase().includes("allahabad")) {
            distQuery = "Prayagraj";
            displayName = currentLang === 'hi' ? "प्रयागराज (इलाहाबाद)" : "Prayagraj (Allahabad)";
        } else if (district.toLowerCase().includes("varanasi") || 
                   district.toLowerCase().includes("vanarsi") || 
                   district.toLowerCase().includes("banarsi") || 
                   district.toLowerCase().includes("banaras")) {
            distQuery = "Varanasi";
            displayName = currentLang === 'hi' ? "वाराणसी (बनारसी)" : "Varanasi (Banarsi)";
        }
        displayLocation = displayName;
        apiLocationQuery = `&filters[district]=${encodeURIComponent(distQuery)}`;
        if (state) {
            apiLocationQuery += `&filters[state]=${encodeURIComponent(state)}`;
        }
    } else if (state) {
        displayLocation = state;
        apiLocationQuery = `&filters[state]=${encodeURIComponent(state)}`;
    } else {
        // Global / All India
        displayLocation = currentLang === 'hi' ? "भारत (राष्ट्रीय औसत)" : "Prices of India";
        apiLocationQuery = '';
    }

    // Set badge text
    if (badgeEl) {
        badgeEl.innerText = displayLocation;
    }

    const apiKey = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    const resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
    const apiUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=150${apiLocationQuery}`;

    console.log(`Querying Mandi API: ${apiUrl}`);

    let records = [];
    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            records = data.records || [];
            console.log(`Fetched ${records.length} mandi records successfully.`);
            
            // If we queried a specific district and got 0 results, fall back to state query
            if (records.length === 0 && district && state) {
                console.warn(`0 records for district ${district}. Falling back to state ${state}...`);
                const stateApiUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=150&filters[state]=${encodeURIComponent(state)}`;
                const stateResponse = await fetch(stateApiUrl);
                if (stateResponse.ok) {
                    const stateData = await stateResponse.json();
                    records = stateData.records || [];
                    console.log(`Fetched ${records.length} state-level records as fallback.`);
                }
            }
        } else {
            console.warn(`Mandi API response error: ${response.status}. Using simulation baseline.`);
        }
    } catch (err) {
        console.error("Mandi API fetch failed. Using simulation baseline:", err);
    }

    // Process records to find averages for our target commodities
    const cropTotals = {};
    Object.keys(MANDI_BASELINES).forEach(k => {
        cropTotals[k] = { marketSum: 0, wholesaleSum: 0, count: 0 };
    });

    records.forEach(rec => {
        const commodity = (rec.commodity || '').toLowerCase();
        const minPrice = parseFloat(rec.min_price);
        const modalPrice = parseFloat(rec.modal_price);

        if (!isNaN(minPrice) && !isNaN(modalPrice)) {
            if (commodity.includes('wheat')) {
                cropTotals.wheat.marketSum += modalPrice;
                cropTotals.wheat.wholesaleSum += minPrice;
                cropTotals.wheat.count++;
            } else if (commodity.includes('rice') || commodity.includes('paddy')) {
                cropTotals.rice.marketSum += modalPrice;
                cropTotals.rice.wholesaleSum += minPrice;
                cropTotals.rice.count++;
            } else if (commodity.includes('sugarcane')) {
                cropTotals.sugarcane.marketSum += modalPrice;
                cropTotals.sugarcane.wholesaleSum += minPrice;
                cropTotals.sugarcane.count++;
            } else if (commodity.includes('sesamum') || commodity.includes('sesame') || commodity.includes(' til')) {
                cropTotals.sesame.marketSum += modalPrice;
                cropTotals.sesame.wholesaleSum += minPrice;
                cropTotals.sesame.count++;
            } else if (commodity.includes('mustard')) {
                cropTotals.mustard.marketSum += modalPrice;
                cropTotals.mustard.wholesaleSum += minPrice;
                cropTotals.mustard.count++;
            } else if (commodity.includes('potato')) {
                cropTotals.potato.marketSum += modalPrice;
                cropTotals.potato.wholesaleSum += minPrice;
                cropTotals.potato.count++;
            } else if (commodity.includes('tomato')) {
                cropTotals.tomato.marketSum += modalPrice;
                cropTotals.tomato.wholesaleSum += minPrice;
                cropTotals.tomato.count++;
            } else if (commodity.includes('bajra') || commodity.includes('millet')) {
                cropTotals.bajra.marketSum += modalPrice;
                cropTotals.bajra.wholesaleSum += minPrice;
                cropTotals.bajra.count++;
            } else if (commodity.includes('maize') || commodity.includes('corn')) {
                cropTotals.corn.marketSum += modalPrice;
                cropTotals.corn.wholesaleSum += minPrice;
                cropTotals.corn.count++;
            } else if (commodity.includes('groundnut') || commodity.includes('peanut')) {
                cropTotals.peanuts.marketSum += modalPrice;
                cropTotals.peanuts.wholesaleSum += minPrice;
                cropTotals.peanuts.count++;
            } else if (commodity.includes('cotton')) {
                cropTotals.cotton.marketSum += modalPrice;
                cropTotals.cotton.wholesaleSum += minPrice;
                cropTotals.cotton.count++;
            } else if (commodity.includes('soyabean') || commodity.includes('soybean')) {
                cropTotals.soybean.marketSum += modalPrice;
                cropTotals.soybean.wholesaleSum += minPrice;
                cropTotals.soybean.count++;
            } else if (commodity.includes('barley') || commodity.includes('jau')) {
                cropTotals.barley.marketSum += modalPrice;
                cropTotals.barley.wholesaleSum += minPrice;
                cropTotals.barley.count++;
            } else if (commodity.includes('chickpea') || commodity.includes('gram') || commodity.includes('chana')) {
                cropTotals.chickpea.marketSum += modalPrice;
                cropTotals.chickpea.wholesaleSum += minPrice;
                cropTotals.chickpea.count++;
            } else if (commodity.includes('lentil') || commodity.includes('masur') || commodity.includes('masoor')) {
                cropTotals.lentil.marketSum += modalPrice;
                cropTotals.lentil.wholesaleSum += minPrice;
                cropTotals.lentil.count++;
            } else if (commodity.includes('pigeon pea') || commodity.includes('arhar') || commodity.includes('tur') || commodity.includes('red gram')) {
                cropTotals.pigeonpea.marketSum += modalPrice;
                cropTotals.pigeonpea.wholesaleSum += minPrice;
                cropTotals.pigeonpea.count++;
            } else if (commodity.includes('green gram') || commodity.includes('moong')) {
                cropTotals.greengram.marketSum += modalPrice;
                cropTotals.greengram.wholesaleSum += minPrice;
                cropTotals.greengram.count++;
            } else if (commodity.includes('black gram') || commodity.includes('urad')) {
                cropTotals.blackgram.marketSum += modalPrice;
                cropTotals.blackgram.wholesaleSum += minPrice;
                cropTotals.blackgram.count++;
            } else if (commodity.includes('sunflower') || commodity.includes('surajmukhi')) {
                cropTotals.sunflower.marketSum += modalPrice;
                cropTotals.sunflower.wholesaleSum += minPrice;
                cropTotals.sunflower.count++;
            } else if (commodity.includes('onion') || commodity.includes('pyaj')) {
                cropTotals.onion.marketSum += modalPrice;
                cropTotals.onion.wholesaleSum += minPrice;
                cropTotals.onion.count++;
            } else if (commodity.includes('cabbage') || commodity.includes('patta gobhi')) {
                cropTotals.cabbage.marketSum += modalPrice;
                cropTotals.cabbage.wholesaleSum += minPrice;
                cropTotals.cabbage.count++;
            } else if (commodity.includes('cauliflower') || commodity.includes('phool gobhi')) {
                cropTotals.cauliflower.marketSum += modalPrice;
                cropTotals.cauliflower.wholesaleSum += minPrice;
                cropTotals.cauliflower.count++;
            } else if (commodity.includes('chili') || commodity.includes('chilli') || commodity.includes('mirch')) {
                cropTotals.chili.marketSum += modalPrice;
                cropTotals.chili.wholesaleSum += minPrice;
                cropTotals.chili.count++;
            } else if (commodity.includes('ginger') || commodity.includes('adrak')) {
                cropTotals.ginger.marketSum += modalPrice;
                cropTotals.ginger.wholesaleSum += minPrice;
                cropTotals.ginger.count++;
            } else if (commodity.includes('turmeric') || commodity.includes('haldi')) {
                cropTotals.turmeric.marketSum += modalPrice;
                cropTotals.turmeric.wholesaleSum += minPrice;
                cropTotals.turmeric.count++;
            } else if (commodity.includes('banana') || commodity.includes('kela')) {
                cropTotals.banana.marketSum += modalPrice;
                cropTotals.banana.wholesaleSum += minPrice;
                cropTotals.banana.count++;
            } else if (commodity.includes('mango') || commodity.includes('aam')) {
                cropTotals.mango.marketSum += modalPrice;
                cropTotals.mango.wholesaleSum += minPrice;
                cropTotals.mango.count++;
            } else if (commodity.includes('orange') || commodity.includes('santara') || commodity.includes('citrus')) {
                cropTotals.orange.marketSum += modalPrice;
                cropTotals.orange.wholesaleSum += minPrice;
                cropTotals.orange.count++;
            } else if (commodity.includes('grape') || commodity.includes('angooral')) {
                cropTotals.grapes.marketSum += modalPrice;
                cropTotals.grapes.wholesaleSum += minPrice;
                cropTotals.grapes.count++;
            } else if (commodity.includes('tea') || commodity.includes('chai')) {
                cropTotals.tea.marketSum += modalPrice;
                cropTotals.tea.wholesaleSum += minPrice;
                cropTotals.tea.count++;
            } else if (commodity.includes('coffee') || commodity.includes('kahwa')) {
                cropTotals.coffee.marketSum += modalPrice;
                cropTotals.coffee.wholesaleSum += minPrice;
                cropTotals.coffee.count++;
            } else if (commodity.includes('coconut') || commodity.includes('nariyal')) {
                cropTotals.coconut.marketSum += modalPrice;
                cropTotals.coconut.wholesaleSum += minPrice;
                cropTotals.coconut.count++;
            } else if (commodity.includes('jute') || commodity.includes('patson')) {
                cropTotals.jute.marketSum += modalPrice;
                cropTotals.jute.wholesaleSum += minPrice;
                cropTotals.jute.count++;
            } else if (commodity.includes('rubber')) {
                cropTotals.rubber.marketSum += modalPrice;
                cropTotals.rubber.wholesaleSum += minPrice;
                cropTotals.rubber.count++;
            }
        }
    });

    // Calculate final market and wholesale prices for all 12 crops
    const finalPrices = {};
    const keys = Object.keys(MANDI_BASELINES);
    
    // Generate a location seed for premium, consistent simulation fallbacks if API data is missing
    const seed = (state || '').length + (district || '').length + 12;

    keys.forEach(k => {
        const item = cropTotals[k];
        if (item && item.count > 0) {
            finalPrices[k] = {
                market: Math.round(item.marketSum / item.count),
                wholesale: Math.round(item.wholesaleSum / item.count)
            };
        } else {
            // Modulate baseline price with seed to ensure regional uniqueness even on API fallbacks
            const modifier = (seed * 7 % 15) - 7; // -7% to +7%
            const baseMarket = MANDI_BASELINES[k].market;
            const baseWholesale = MANDI_BASELINES[k].wholesale;
            finalPrices[k] = {
                market: Math.round(baseMarket * (1 + modifier / 100)),
                wholesale: Math.round(baseWholesale * (1 + modifier / 100))
            };
        }
    });

    // Remove shimmers from display elements
    if (marketEl) marketEl.classList.remove('loading-shimmer');
    if (wholesaleEl) wholesaleEl.classList.remove('loading-shimmer');
    if (profitEl) profitEl.classList.remove('loading-shimmer');

    // Store in global state for real-time price fluctuation ticker
    latestMandiBasePrices = JSON.parse(JSON.stringify(finalPrices));
    mandiCurrentPrices = null; // reset to baseline for new location

    // Render selector pills
    renderMandiCropPills();

    // Update the visual metrics cards and Chart
    updateMandiUI();
}

// ==================== MANDI DYNAMIC CROP SELECTOR CONTROLLERS ====================
function renderMandiCropPills() {
    const container = document.getElementById('mandi-crop-pills-container');
    if (!container) return;

    container.innerHTML = '';
    
    // Iterate over the 12 crops
    const cropKeys = Object.keys(MANDI_BASELINES);
    cropKeys.forEach(k => {
        const cropInfo = cropsDb[k];
        if (!cropInfo) return;
        const name = currentLang === 'hi' ? cropInfo.nameHi : cropInfo.nameEn;
        const emoji = cropInfo.icon;
        const isActive = activeMandiCrops.includes(k);

        const pill = document.createElement('div');
        pill.className = `mandi-crop-pill ${isActive ? 'active' : ''}`;
        pill.innerHTML = `<span>${emoji}</span> <span>${name}</span>`;
        
        pill.addEventListener('click', () => {
            toggleMandiCrop(k);
        });

        container.appendChild(pill);
    });
}

function toggleMandiCrop(cropKey) {
    const idx = activeMandiCrops.indexOf(cropKey);
    if (idx > -1) {
        // If it is in the list
        if (idx === 0) {
            // It is the currently highlighted crop. Toggle it off (remove it) if there are others.
            if (activeMandiCrops.length > 1) {
                activeMandiCrops.shift();
            }
        } else {
            // It is in the list but not highlighted. Move it to the front to highlight it.
            activeMandiCrops.splice(idx, 1);
            activeMandiCrops.unshift(cropKey);
        }
    } else {
        // Not in the list. Add it to the front to highlight it.
        activeMandiCrops.unshift(cropKey);
    }
    
    renderMandiCropPills();
    updateMandiUI();
}

function selectAllMandiCrops() {
    activeMandiCrops = Object.keys(MANDI_BASELINES);
    renderMandiCropPills();
    updateMandiUI();
}

function deselectAllMandiCrops() {
    // Keep the currently highlighted crop selected, or fallback to the first crop in baselines
    const currentHighlight = activeMandiCrops[0] || Object.keys(MANDI_BASELINES)[0];
    activeMandiCrops = [currentHighlight];
    renderMandiCropPills();
    updateMandiUI();
}

function updateMandiUI() {
    const marketEl = document.getElementById('val-market-price');
    const wholesaleEl = document.getElementById('val-wholesaler-price');
    const profitEl = document.getElementById('val-profit');
    const profitHeaderEl = document.getElementById('txt-lbl-profit-calc');

    // If a ticker is active, stop it so we can update base values
    stopMandiTicker();

    if (!latestMandiBasePrices) return;

    // Use current dynamic prices if available, otherwise baseline
    const currentPriceSource = mandiCurrentPrices || latestMandiBasePrices;

    // Update highlight metrics based on the FIRST selected crop in our active list
    const primaryCropKey = activeMandiCrops[0] || 'wheat';
    const primaryCrop = currentPriceSource[primaryCropKey];
    const basePrimaryCrop = latestMandiBasePrices[primaryCropKey];

    const cropInfo = cropsDb[primaryCropKey];
    if (cropInfo && primaryCrop && basePrimaryCrop) {
        const cropName = currentLang === 'hi' ? cropInfo.nameHi : cropInfo.nameEn;
        const cropEmoji = cropInfo.icon;

        if (profitHeaderEl) {
            profitHeaderEl.innerText = currentLang === 'hi' ? 
                `${cropEmoji} ${cropName} सकल मार्जिन (प्रति क्विंटल)` : 
                `${cropEmoji} ${cropName} Projected Gross Margin (Per Quintal)`;
        }

        const marketVal = primaryCrop.market;
        const wholesaleVal = primaryCrop.wholesale;
        const profit = marketVal - wholesaleVal;

        const baseMarket = basePrimaryCrop.market;
        const baseWholesale = basePrimaryCrop.wholesale;
        const baseProfit = baseMarket - baseWholesale;

        if (marketEl) marketEl.innerText = `₹${marketVal}`;
        if (wholesaleEl) wholesaleEl.innerText = `₹${wholesaleVal}`;
        if (profitEl) profitEl.innerText = `₹${profit}`;

        const updateBadge = (changeEl, currentVal, baseVal) => {
            if (!changeEl) return;
            const devPct = baseVal > 0 ? ((currentVal - baseVal) / baseVal) * 100 : 0;
            const sign = devPct >= 0 ? '+' : '';
            changeEl.innerText = `${sign}${devPct.toFixed(2)}%`;
            changeEl.className = `price-change-badge ${devPct > 0 ? 'up' : (devPct < 0 ? 'down' : 'neutral')}`;
        };

        updateBadge(document.getElementById('val-market-change'), marketVal, baseMarket);
        updateBadge(document.getElementById('val-wholesale-change'), wholesaleVal, baseWholesale);
        updateBadge(document.getElementById('val-profit-change'), profit, baseProfit);
    }

    // Update the Chart
    if (mandiPriceChart) {
        const labels = activeMandiCrops.map(k => {
            const info = cropsDb[k];
            return info ? (currentLang === 'hi' ? info.nameHi : info.nameEn) : k;
        });

        const mPrices = activeMandiCrops.map(k => currentPriceSource[k] ? currentPriceSource[k].market : 0);
        const wCosts = activeMandiCrops.map(k => currentPriceSource[k] ? currentPriceSource[k].wholesale : 0);
        const profits = mPrices.map((val, idx) => val - wCosts[idx]);

        mandiPriceChart.data.labels = labels;
        mandiPriceChart.data.datasets[0].data = mPrices;
        mandiPriceChart.data.datasets[1].data = wCosts;
        mandiPriceChart.data.datasets[2].data = profits;
        mandiPriceChart.update();
    }

    // Restart the ticker with the currently active selection
    startMandiTicker();

    // Populate the Mandi price overview table
    populateMandiTable();
}

function populateMandiTable() {
    const tableBody = document.getElementById('mandi-table-body');
    if (!tableBody) return;

    if (!latestMandiBasePrices) return;
    const currentPriceSource = mandiCurrentPrices || latestMandiBasePrices;

    tableBody.innerHTML = '';
    // Only show crops the user has selected via the crop selector pills
    const cropKeys = activeMandiCrops.length > 0 ? activeMandiCrops : Object.keys(MANDI_BASELINES);
    
    cropKeys.forEach(k => {
        const cropInfo = cropsDb[k];
        if (!cropInfo) return;

        const name = currentLang === 'hi' ? cropInfo.nameHi : cropInfo.nameEn;
        const emoji = cropInfo.icon;
        
        const priceData = currentPriceSource[k] || { market: 0, wholesale: 0 };
        const baseData = latestMandiBasePrices[k] || priceData;

        const marketVal = priceData.market;
        const wholesaleVal = priceData.wholesale;
        const profit = marketVal - wholesaleVal;

        const baseMarket = baseData.market;

        // Calculate deviation percentage
        const devPct = baseMarket > 0 ? ((marketVal - baseMarket) / baseMarket) * 100 : 0;
        const sign = devPct >= 0 ? '+' : '';
        
        const trendClass = devPct > 0 ? 'table-trend-up' : (devPct < 0 ? 'table-trend-down' : '');
        const trendIcon = devPct > 0 ? '▲' : (devPct < 0 ? '▼' : '●');
        const trendText = `${sign}${devPct.toFixed(2)}% ${trendIcon}`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="table-crop-cell">
                    <span class="table-crop-icon">${emoji}</span>
                    <span>${name}</span>
                </div>
            </td>
            <td class="table-price">₹${marketVal.toLocaleString('en-IN')}</td>
            <td class="table-price">₹${wholesaleVal.toLocaleString('en-IN')}</td>
            <td class="table-profit">₹${profit.toLocaleString('en-IN')}</td>
            <td class="${trendClass}" style="font-weight: 600; font-family: var(--font-en);">${trendText}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ==================== DASHBOARD METRICS & ENGINE updates ====================
function updateDashboardMetrics() {
    // Fetch real-time Mandi prices asynchronously (from official government API)
    fetchMandiPrices(activeLocation.state, activeLocation.district);

    // Fetch real-time weather asynchronously (with falling back to simulated values)
    fetchRealWeather(activeLocation.state, activeLocation.district, activeLocation.block);
}

// ==================== REAL-TIME WEATHER INTEGRATION ====================
async function fetchRealWeather(state, district, block) {
    const tempEl = document.getElementById('val-temp');
    const humEl = document.getElementById('val-humidity');
    const windEl = document.getElementById('val-wind');
    
    // Find parent container of the canvas weather trend chart
    const trendCanvas = document.getElementById('weather-trend-chart');
    const chartContainer = trendCanvas ? trendCanvas.parentNode : null;

    // Apply glowing skeleton loading shimmers
    if (tempEl) tempEl.classList.add('loading-shimmer');
    if (humEl) humEl.classList.add('loading-shimmer');
    if (windEl) windEl.classList.add('loading-shimmer');
    if (chartContainer) chartContainer.classList.add('loading-shimmer');

    // Generate fallback parameters (randomized but consistent based on location seed)
    const identifier = (state || '') + (district || '') + (block || '');
    const seed = identifier.length > 0 ? identifier.length : 12;
    const fallbackTemp = 22 + (seed % 15); // ranges 22 to 37
    const fallbackHumidity = 40 + (seed * 3 % 50); // ranges 40 to 90
    const fallbackWindSpeed = 8 + (seed * 7 % 15); // ranges 8 to 23

    const applyFallback = () => {
        if (tempEl) {
            tempEl.classList.remove('loading-shimmer');
            tempEl.innerText = `${fallbackTemp}°C`;
        }
        if (humEl) {
            humEl.classList.remove('loading-shimmer');
            humEl.innerText = `${fallbackHumidity}%`;
        }
        if (windEl) {
            windEl.classList.remove('loading-shimmer');
            windEl.innerText = `${fallbackWindSpeed} km/h`;
        }
        if (chartContainer) chartContainer.classList.remove('loading-shimmer');

        // Set weather simulation state
        if (fallbackHumidity > 75) {
            setWeatherState('rain');
        } else if (fallbackHumidity > 55) {
            setWeatherState('clouds');
        } else {
            setWeatherState('sunny');
        }

        // Standard simulated mandi/chart updates
        const wholesaleVal = 1800 + (seed * 11 % 1200);
        const marketVal = wholesaleVal + 350 + (seed * 19 % 450);
        const profit = marketVal - wholesaleVal;
        updateChartsData(fallbackTemp, fallbackHumidity, fallbackWindSpeed, wholesaleVal, marketVal, profit);

        // Populate metrics and run weather warning check
        window.currentWeatherMetrics = {
            temp: fallbackTemp,
            rainChance: fallbackHumidity,
            maxRainChance: fallbackHumidity,
            humidity: fallbackHumidity,
            wind: fallbackWindSpeed,
            soil: 45
        };
        if (typeof checkWeatherAlerts === 'function') {
            checkWeatherAlerts(fallbackHumidity, fallbackWindSpeed);
        }
    };

    if (!state) {
        applyFallback();
        return;
    }

    // Geocoding query fallbacks (use clean single terms, as commas cause empty results in Open-Meteo)
    const queries = [];
    if (block && block !== 'CUSTOM_BLOCK') {
        queries.push({ name: block, type: 'block' });
    }
    if (district) {
        // Handle "Allahabad" -> "Prayagraj" rewrite
        const distQuery = district.toLowerCase().includes("allahabad") ? "Prayagraj" : district;
        queries.push({ name: distQuery, type: 'district' });
    }
    queries.push({ name: state.replace(/\s*\(ut\)|\s*\(nct\)/gi, ''), type: 'state' });

    let coordinates = null;

    // Helper to normalize strings for matching
    const normalize = str => str ? str.toLowerCase().replace(/\s*\(ut\)|\s*\(nct\)/gi, '').trim() : '';

    // 1. Geocode location using Open-Meteo Geocoding API
    for (const qObj of queries) {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(qObj.name)}&count=20&language=en&format=json`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    // Filter results in India
                    const indianResults = data.results.filter(r => r.country_code === 'IN');
                    if (indianResults.length > 0) {
                        // Find match in the selected state
                        const stateNormalized = normalize(state);
                        let bestMatch = indianResults.find(r => normalize(r.admin1).includes(stateNormalized) || stateNormalized.includes(normalize(r.admin1)));
                        
                        if (!bestMatch) {
                            // If we are on the final state fallback query, take the first Indian result.
                            // Otherwise, do not accept a result in the wrong state - let the loop continue to district or state query!
                            if (qObj.type === 'state') {
                                bestMatch = indianResults[0];
                            } else {
                                continue;
                            }
                        }

                        coordinates = {
                            lat: bestMatch.latitude,
                            lon: bestMatch.longitude
                        };
                        console.log(`Geocoded query "${qObj.name}" successfully to: ${bestMatch.name}, ${bestMatch.admin1}, Lat: ${coordinates.lat}, Lon: ${coordinates.lon}`);
                        break;
                    }
                }
            }
        } catch (err) {
            console.warn(`Geocoding lookup failed for query "${qObj.name}":`, err);
        }
    }

    if (!coordinates) {
        console.warn("Geocoding results empty. Applying simulated weather fallback.");
        applyFallback();
        return;
    }

    // 2. Fetch real weather forecast details from Open-Meteo API
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&timezone=auto`;
        const res = await fetch(weatherUrl);
        if (!res.ok) throw new Error("Forecast retrieval failed");

        const data = await res.json();
        const current = data.current;
        const hourly = data.hourly;

        if (!current) throw new Error("Current weather payload is empty");

        const realTemp = Math.round(current.temperature_2m);
        const realHumidity = Math.round(current.relative_humidity_2m);
        const realWind = Math.round(current.wind_speed_10m);
        const weatherCode = current.weather_code;

        // Calculate max rain chance in next 24 hours
        let maxRainChance = 0;
        if (hourly && hourly.precipitation_probability) {
            const next24h = hourly.precipitation_probability.slice(0, 24);
            if (next24h.length > 0) {
                maxRainChance = Math.max(...next24h);
            }
        }

        // Store current weather metrics globally
        window.currentWeatherMetrics = {
            temp: realTemp,
            rainChance: maxRainChance,
            maxRainChance: maxRainChance,
            humidity: realHumidity,
            wind: realWind,
            soil: 45
        };

        if (typeof checkWeatherAlerts === 'function') {
            checkWeatherAlerts(maxRainChance, realWind);
        }

        // Clear loading skeleton and update UI
        if (tempEl) {
            tempEl.classList.remove('loading-shimmer');
            tempEl.innerText = `${realTemp}°C`;
        }
        if (humEl) {
            humEl.classList.remove('loading-shimmer');
            humEl.innerText = `${realHumidity}%`;
        }
        if (windEl) {
            windEl.classList.remove('loading-shimmer');
            windEl.innerText = `${realWind} km/h`;
        }
        if (chartContainer) chartContainer.classList.remove('loading-shimmer');

        // Map WMO weather codes to active 3D weather simulation state
        let weather3DState = 'sunny';
        if (weatherCode === 0) {
            weather3DState = 'sunny';
        } else if ([1, 2, 3, 45, 48].includes(weatherCode)) {
            weather3DState = 'clouds';
        } else if (weatherCode >= 51) {
            weather3DState = 'rain';
        } else {
            weather3DState = realHumidity > 75 ? 'rain' : (realHumidity > 55 ? 'clouds' : 'sunny');
        }
        setWeatherState(weather3DState);

        // Update Mandi prices and charts
        const wholesaleVal = 1800 + (seed * 11 % 1200);
        const marketVal = wholesaleVal + 350 + (seed * 19 % 450);
        const profit = marketVal - wholesaleVal;
        
        // Update regular charts base
        updateChartsData(realTemp, realHumidity, realWind, wholesaleVal, marketVal, profit);

        // Update line charts with real forecast trend data (7 points, sampled at 24h intervals)
        if (weatherTrendChart && hourly && hourly.temperature_2m) {
            const tempTrend = [];
            const rainChanceTrend = [];
            const forecastCodes = [];
            const hourlyRainChance = hourly.precipitation_probability || [];
            
            for (let i = 0; i < 7; i++) {
                const hourIdx = i * 24;
                tempTrend.push(Math.round(hourly.temperature_2m[hourIdx] !== undefined ? hourly.temperature_2m[hourIdx] : realTemp));
                
                // Sample rain probability, fall back to current rain state / humidity mapping if undefined
                let rainProb = hourlyRainChance[hourIdx];
                if (rainProb === undefined) {
                    const h = hourly.relative_humidity_2m && hourly.relative_humidity_2m[hourIdx] !== undefined ? 
                              hourly.relative_humidity_2m[hourIdx] : realHumidity;
                    rainProb = h > 75 ? 80 : (h > 55 ? 40 : 10);
                }
                rainChanceTrend.push(Math.round(rainProb));
                forecastCodes.push(hourly.weather_code && hourly.weather_code[hourIdx] !== undefined ? hourly.weather_code[hourIdx] : weatherCode);
            }
            weatherTrendChart.data.datasets[0].data = tempTrend;
            weatherTrendChart.data.datasets[0].weatherCodes = forecastCodes;
            weatherTrendChart.data.datasets[1].data = rainChanceTrend;
            
            // Adjust visual colors to blue theme for rain chance
            weatherTrendChart.data.datasets[1].borderColor = '#3b82f6';
            weatherTrendChart.data.datasets[1].backgroundColor = 'rgba(59, 130, 246, 0.05)';
            
            if (typeof updateWeatherChartLabelsAndDatasets === 'function') {
                updateWeatherChartLabelsAndDatasets();
            }

            // Update dynamic 3D metrics and labels for equalizer
            const realRainChance = hourlyRainChance[0] !== undefined ? Math.round(hourlyRainChance[0]) : (realHumidity > 75 ? 80 : (realHumidity > 55 ? 40 : 10));
            const realSoil = Math.round(Math.min(100, Math.max(10, realHumidity * 0.6 + realRainChance * 0.4)));

            window.currentWeatherMetrics = {
                temp: realTemp,
                rainChance: realRainChance,
                humidity: realHumidity,
                wind: realWind,
                soil: realSoil
            };

            const valTempEl = document.getElementById('bar-val-temp');
            const valRainEl = document.getElementById('bar-val-rain');
            const valHumEl = document.getElementById('bar-val-humidity');
            const valWindEl = document.getElementById('bar-val-wind');
            const valSoilEl = document.getElementById('bar-val-soil');

            if (valTempEl) valTempEl.innerText = `${realTemp}°C`;
            if (valRainEl) valRainEl.innerText = `${realRainChance}%`;
            if (valHumEl) valHumEl.innerText = `${realHumidity}%`;
            if (valWindEl) valWindEl.innerText = `${realWind} km/h`;
            if (valSoilEl) valSoilEl.innerText = `${realSoil}%`;
        }

    } catch (err) {
        console.error("Forecast fetch error. Using simulated values:", err);
        applyFallback();
    }
}

// Controls weather 3D toggles
function setWeatherState(state) {
    const statusEl = document.getElementById('weather-simulation-status');
    if (statusEl) {
        let stateText = '';
        if (state === 'sunny') {
            stateText = currentLang === 'hi' ? '☀️ धूप / साफ़' : '☀️ Sunny';
            statusEl.style.borderColor = 'rgba(251, 191, 36, 0.4)';
            statusEl.style.color = '#fbbf24';
            statusEl.style.background = 'rgba(251, 191, 36, 0.12)';
        } else if (state === 'clouds') {
            stateText = currentLang === 'hi' ? '☁️ बादल छाए' : '☁️ Overcast';
            statusEl.style.borderColor = 'rgba(156, 163, 175, 0.4)';
            statusEl.style.color = '#e5e7eb';
            statusEl.style.background = 'rgba(156, 163, 175, 0.12)';
        } else if (state === 'rain') {
            stateText = currentLang === 'hi' ? '🌧️ बारिश' : '🌧️ Rainy';
            statusEl.style.borderColor = 'rgba(59, 130, 246, 0.4)';
            statusEl.style.color = '#60a5fa';
            statusEl.style.background = 'rgba(59, 130, 246, 0.12)';
        }
        statusEl.innerText = stateText;
    }

    // Trigger Three.js transition
    if (typeof set3DWeatherState === 'function') {
        set3DWeatherState(state);
    }
}

function getWeatherChartLabels() {
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    
    const todayIdx = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    const labels = [];
    
    for (let i = 0; i < 7; i++) {
        const idx = (todayIdx + i) % 7;
        labels.push(currentLang === 'hi' ? daysHi[idx] : daysEn[idx]);
    }
    return labels;
}

function updateWeatherChartLabelsAndDatasets() {
    if (!weatherTrendChart) return;
    
    // Update X-axis labels to dynamic weekdays
    weatherTrendChart.data.labels = getWeatherChartLabels();
    
    // Update dataset labels based on language
    if (currentLang === 'hi') {
        weatherTrendChart.data.datasets[0].label = 'तापमान (°C)';
        weatherTrendChart.data.datasets[1].label = 'बारिश की संभावना (%)';
    } else {
        weatherTrendChart.data.datasets[0].label = 'Temp (°C)';
        weatherTrendChart.data.datasets[1].label = 'Rain Chance (%)';
    }
    
    weatherTrendChart.update();
}

// ==================== DUAL VISUAL DATA ENGINES (CHART.JS) ====================
function initCharts() {
    // 1. Weather 7-Day Trends Chart
    const weatherCtx = document.getElementById('weather-trend-chart').getContext('2d');
    weatherTrendChart = new Chart(weatherCtx, {
        type: 'line',
        data: {
            labels: getWeatherChartLabels(),
            datasets: [
                {
                    label: currentLang === 'hi' ? 'तापमान (°C)' : 'Temp (°C)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    weatherCodes: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: currentLang === 'hi' ? 'बारिश की संभावना (%)' : 'Rain Chance (%)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }
            ]
        },
        plugins: [weatherEmojiPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 15
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f3f4f6', font: { family: 'Outfit', size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });

    // 2. Mandi Price vs Wholesaler Price Margin Chart
    const mandiCtx = document.getElementById('mandi-price-chart').getContext('2d');
    const allCropLabels = ['Wheat', 'Rice', 'Sugarcane', 'Sesame', 'Mustard', 'Potato', 'Tomato', 'Bajra', 'Maize', 'Peanut', 'Cotton', 'Soybean'];
    const zeroes12 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    mandiPriceChart = new Chart(mandiCtx, {
        type: 'bar',
        data: {
            labels: allCropLabels,
            datasets: [
                {
                    label: 'Market Price (₹)',
                    data: [...zeroes12],
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: '#10b981',
                    borderWidth: 1
                },
                {
                    label: 'Wholesaler Cost (₹)',
                    data: [...zeroes12],
                    backgroundColor: 'rgba(251, 191, 36, 0.55)',
                    borderColor: '#fbbf24',
                    borderWidth: 1
                },
                {
                    label: 'Net Profit Margin (₹)',
                    type: 'line',
                    data: [...zeroes12],
                    borderColor: '#fde047',
                    borderWidth: 2,
                    tension: 0.2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#f3f4f6', font: { family: 'Outfit', size: 11 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

function updateChartsData(temp, humidity, windSpeed, wholesaleVal, marketVal, profit) {
    if (!weatherTrendChart) return;

    // Simulate weather variations over 7 days based on active location values
    const tempTrend = [
        temp, 
        temp - 1 + Math.sin(1) * 2, 
        temp + 1 + Math.sin(2) * 2, 
        temp - 2 + Math.sin(3) * 3, 
        temp + Math.sin(4) * 2, 
        temp + 2 + Math.sin(5) * 2,
        temp - 1 + Math.sin(6) * 3
    ].map(v => Math.round(v));

    const humidityTrend = [
        humidity,
        Math.min(100, Math.max(0, humidity - 4 + Math.sin(1) * 6)),
        Math.min(100, Math.max(0, humidity + 5 + Math.sin(2) * 6)),
        Math.min(100, Math.max(0, humidity - 1 + Math.sin(3) * 4)),
        Math.min(100, Math.max(0, humidity + 3 + Math.sin(4) * 5)),
        Math.min(100, Math.max(0, humidity + Math.sin(5) * 8)),
        Math.min(100, Math.max(0, humidity - 3 + Math.sin(6) * 7))
    ].map(v => Math.round(v));

    const rainChanceTrend = humidityTrend.map(h => {
        if (h > 75) return Math.min(100, Math.round(h - 10 + Math.random() * 20));
        if (h > 55) return Math.round((h - 55) * 2.5 + Math.random() * 10);
        return Math.round(Math.random() * 20);
    });

    const simulatedCodes = tempTrend.map((t, i) => {
        const r = rainChanceTrend[i];
        if (r > 70) return 61; // rain
        if (r > 35) return 2;  // clouds
        return 0;              // sunny
    });

    weatherTrendChart.data.datasets[0].data = tempTrend;
    weatherTrendChart.data.datasets[0].weatherCodes = simulatedCodes;
    weatherTrendChart.data.datasets[1].data = rainChanceTrend;
    
    // Match color to blue rain theme
    weatherTrendChart.data.datasets[1].borderColor = '#3b82f6';
    weatherTrendChart.data.datasets[1].backgroundColor = 'rgba(59, 130, 246, 0.05)';
    
    updateWeatherChartLabelsAndDatasets();

    // Update dynamic 3D weather equalizer metrics and labels
    const currentRainChance = rainChanceTrend[0] !== undefined ? rainChanceTrend[0] : (humidity > 75 ? 85 : (humidity > 55 ? 50 : 15));
    const currentSoilMoisture = Math.round(Math.min(100, Math.max(10, humidity * 0.6 + currentRainChance * 0.4)));

    window.currentWeatherMetrics = {
        temp: temp,
        rainChance: currentRainChance,
        humidity: humidity,
        wind: windSpeed,
        soil: currentSoilMoisture
    };

    const valTempEl = document.getElementById('bar-val-temp');
    const valRainEl = document.getElementById('bar-val-rain');
    const valHumEl = document.getElementById('bar-val-humidity');
    const valWindEl = document.getElementById('bar-val-wind');
    const valSoilEl = document.getElementById('bar-val-soil');

    if (valTempEl) valTempEl.innerText = `${temp}°C`;
    if (valRainEl) valRainEl.innerText = `${currentRainChance}%`;
    if (valHumEl) valHumEl.innerText = `${humidity}%`;
    if (valWindEl) valWindEl.innerText = `${windSpeed} km/h`;
    if (valSoilEl) valSoilEl.innerText = `${currentSoilMoisture}%`;
}

// ==================== CROP DROPDOWNS POPULATOR ====================
function populateCropDropdowns() {
    const diseaseSelect = document.getElementById('disease-crop-select');
    const irrSelect = document.getElementById('irr-crop-select');
    
    if (diseaseSelect) {
        const currentVal = diseaseSelect.value || 'wheat';
        diseaseSelect.innerHTML = '';
        Object.keys(cropsDb).forEach(k => {
            const crop = cropsDb[k];
            const name = currentLang === 'hi' ? `${crop.icon} ${crop.nameHi}` : `${crop.icon} ${crop.nameEn}`;
            const opt = document.createElement('option');
            opt.value = k;
            opt.innerText = name;
            diseaseSelect.appendChild(opt);
        });
        if (Object.keys(cropsDb).includes(currentVal)) {
            diseaseSelect.value = currentVal;
        }
    }
    
    if (irrSelect) {
        const currentVal = irrSelect.value || 'wheat';
        irrSelect.innerHTML = '';
        Object.keys(cropsDb).forEach(k => {
            const crop = cropsDb[k];
            const name = currentLang === 'hi' ? `${crop.icon} ${crop.nameHi}` : `${crop.icon} ${crop.nameEn}`;
            const opt = document.createElement('option');
            opt.value = k;
            opt.innerText = name;
            irrSelect.appendChild(opt);
        });
        if (Object.keys(cropsDb).includes(currentVal)) {
            irrSelect.value = currentVal;
        }
    }
}

// ==================== CROP CATALOG COMPONENT ====================
function renderCropsGrid() {
    const container = document.getElementById('crops-container');
    if (!container) return;

    container.innerHTML = '';

    const cropKeys = Object.keys(cropsDb);
    const halfLen = Math.ceil(cropKeys.length / 2);

    // Filter crops based on currentCropPage (1 or 2)
    const activeKeys = currentCropPage === 1 ? 
        cropKeys.slice(0, halfLen) : 
        cropKeys.slice(halfLen);

    activeKeys.forEach(cropKey => {
        const crop = cropsDb[cropKey];
        const name = currentLang === 'hi' ? crop.nameHi : crop.nameEn;
        const sub = currentLang === 'hi' ? crop.seasonHi.split(' ')[0] : crop.seasonEn.split(' ')[0];

        const card = document.createElement('div');
        card.className = 'crop-card';
        card.onclick = () => openCropDrawer(crop.id);
        card.innerHTML = `
            <div class="crop-icon-box">${crop.icon}</div>
            <div class="crop-name">${name}</div>
            <div class="crop-subtext">${sub}</div>
        `;
        container.appendChild(card);
    });
}

function switchCropPage(pageNum) {
    currentCropPage = pageNum;
    
    // Update active tab buttons visual state
    const btn1 = document.getElementById('btn-crop-page-1');
    const btn2 = document.getElementById('btn-crop-page-2');
    if (btn1 && btn2) {
        if (pageNum === 1) {
            btn1.classList.add('active');
            btn2.classList.remove('active');
        } else {
            btn2.classList.add('active');
            btn1.classList.remove('active');
        }
    }
    
    // Re-render the crop grid cards and the calendar below
    renderCropsGrid();
    renderCropCalendar();
}

// ==================== DRAWER OVERLAY CONTROLLER ====================
function openCropDrawer(cropId) {
    const crop = cropsDb[cropId];
    if (!crop) return;

    const drawer = document.getElementById('crop-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    // Save active crop ID in dataset for language toggle updates
    drawer.dataset.cropId = cropId;

    // Apply translations
    document.getElementById('drawer-icon').innerText = crop.icon;
    document.getElementById('drawer-crop-name').innerText = currentLang === 'hi' ? crop.nameHi : crop.nameEn;
    document.getElementById('drawer-crop-sub').innerText = currentLang === 'hi' ? crop.seasonHi : crop.seasonEn;

    document.getElementById('drawer-soil-val').innerText = currentLang === 'hi' ? crop.soilHi : crop.soilEn;
    document.getElementById('drawer-season-val').innerText = currentLang === 'hi' ? crop.seasonHi : crop.seasonEn;
    document.getElementById('drawer-water-val').innerText = currentLang === 'hi' ? crop.waterHi : crop.waterEn;

    // Highlight chemical formulas beautifully with tags
    const fertilVal = currentLang === 'hi' ? crop.fertilizerHi : crop.fertilizerEn;
    document.getElementById('drawer-fertilizer-val').innerHTML = makeChemicalTags(fertilVal);

    const pestVal = currentLang === 'hi' ? crop.pesticideHi : crop.pesticideEn;
    document.getElementById('drawer-pesticide-val').innerHTML = makeChemicalTags(pestVal);

    // Slide drawer open
    drawer.classList.add('open');
    backdrop.classList.add('open');
}

function closeCropDrawer() {
    document.getElementById('crop-drawer').classList.remove('open');
    document.getElementById('drawer-backdrop').classList.remove('open');
}

function makeChemicalTags(text) {
    // Regex matches common chemical concentrations and compounds like Imidacloprid 17.8% SL, Propiconazole 25% EC, etc.
    const chemRegex = /([A-Za-z]+(?:\s[A-Za-z]+)*\s\d+(?:\.\d+)?%\s[A-Z]{2,3}(?:\s@[^\s;]+)?|[A-Za-z]+ Hydrochloride \d+%\s[A-Z]|[A-Za-z]+ \d+%\s[A-Z]{2,3})/g;
    
    // Hindi translation chemical patterns (for keywords like इमिडाक्लोप्रिड, प्रोपिकोनाज़ोल, कार्बेन्डाजिम etc.)
    const hiChemRegex = /(इमिडाक्लोप्रिड \d+(?:\.\d+)?%\s[A-Z]{2,3}|प्रोपिकोनाज़ोल \d+%\s[A-Z]{2,3}|कार्टाप हाइड्रोक्लोराइड \d+%\s[A-Z]|ट्राइसाइक्लाजोल \d+%\s[A-Z]{2,3}|क्लोरेंट्रानिलिप्रोल|कार्बेन्डाजिम \d+%\s[A-Z]{2,3}|क्विनालफॉस \d+%\s[A-Z]{2,3}|मैनकोजेब \d+%\s[A-Z]{2,3}|डाइमेथोएट \d+%\s[A-Z]{2,3}|मेटालैक्सिल \d+%\s[A-Z]{2,3}|क्लोरोथैलोनिल \d+%\s[A-Z]{2,3}|इंडोक्साकार्ब \d+(?:\.\d+)?%\s[A-Z]{2,3}|कार्बारिल \d+%\s[A-Z]{2,3}|क्लोरपायरीफॉस|स्पिनोसैड \d+%\s[A-Z]{2,3}|एसिटामिप्रिड \d+%\s[A-Z]{2,3})/g;

    let parsedText = text;
    parsedText = parsedText.replace(chemRegex, '<span class="chem-highlight">$1</span>');
    parsedText = parsedText.replace(hiChemRegex, '<span class="chem-highlight">$1</span>');
    return parsedText;
}

// ==================== SCHEMES PANEL COMPONENT ====================
function renderSchemesGrid() {
    const container = document.getElementById('schemes-container');
    if (!container) return;

    // Combine original 4 schemes + 4 expanded schemes for full 8-scheme display
    const allSchemes = [...schemesDb, ...schemesDbExpanded];

    container.innerHTML = '';
    allSchemes.forEach(scheme => {
        const name = currentLang === 'hi' ? scheme.nameHi : scheme.nameEn;
        const desc = currentLang === 'hi' ? scheme.descHi : scheme.descEn;
        const badge = currentLang === 'hi' ? scheme.badgeHi : scheme.badgeEn;
        const linkLabel = currentLang === 'hi' ? 'आधिकारिक वेबसाइट खोलें' : 'Official Portal';
        const icon = scheme.icon || '📋';

        const card = document.createElement('div');
        card.className = 'glass-panel scheme-card';
        card.innerHTML = `
            <div>
                <div class="scheme-header">
                    <h3 class="scheme-title"><span style="margin-right:6px;">${icon}</span>${name}</h3>
                    <span class="scheme-badge">${badge}</span>
                </div>
                <p class="scheme-desc">${desc}</p>
            </div>
            <a href="${scheme.link}" target="_blank" class="scheme-link">
                <i data-lucide="external-link"></i>
                <span>${linkLabel}</span>
            </a>
        `;
        container.appendChild(card);
    });
    lucide.createIcons();
}

// ==================== INTERACTIVE AI CHATBOT SYSTEM ====================
let chatSettings = { mode: 'offline', apiKey: '' };
let chatHistory = [];
let recognition = null;
let isRecognizing = false;
let synth = window.speechSynthesis;
let utterance = null;
let activeSpeakBtn = null;
let voicesList = [];

function populateVoices() {
    if (synth) {
        voicesList = synth.getVoices();
    }
}
populateVoices();
if (synth) {
    synth.onvoiceschanged = populateVoices;
}

function initChatSettings() {
    const saved = localStorage.getItem('kisan_mitra_chat_settings');
    if (saved) {
        try {
            chatSettings = JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing chat settings", e);
        }
    }
    
    // Update settings DOM
    const modeSelect = document.getElementById('chat-mode-select');
    const keyInput = document.getElementById('gemini-api-key-input');
    
    if (modeSelect) modeSelect.value = chatSettings.mode || 'offline';
    if (keyInput) keyInput.value = chatSettings.apiKey || '';
    
    onChatModeChange();
}

function toggleChatSettings() {
    const overlay = document.getElementById('chat-settings-overlay');
    const btn = document.getElementById('chat-settings-toggle-btn');
    if (!overlay) return;
    
    overlay.classList.toggle('open');
    if (btn) btn.classList.toggle('active');
    
    // Clear status msg
    const statusMsg = document.getElementById('settings-status-msg');
    if (statusMsg) {
        statusMsg.style.display = 'none';
        statusMsg.className = '';
    }
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('gemini-api-key-input');
    const btn = document.getElementById('btn-toggle-key-visibility');
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.innerHTML = `<i data-lucide="eye-off" style="width:14px; height:14px;"></i>`;
    } else {
        input.type = 'password';
        if (btn) btn.innerHTML = `<i data-lucide="eye" style="width:14px; height:14px;"></i>`;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function onChatModeChange() {
    const modeSelect = document.getElementById('chat-mode-select');
    const keyGroup = document.getElementById('gemini-key-group');
    if (!modeSelect || !keyGroup) return;
    
    if (modeSelect.value === 'gemini') {
        keyGroup.style.display = 'flex';
    } else {
        keyGroup.style.display = 'none';
    }
}

function showSettingsStatus(msg, type) {
    const el = document.getElementById('settings-status-msg');
    if (!el) return;
    el.innerText = msg;
    el.className = type; // success, error, info
    el.style.display = 'block';
}

function saveChatSettings() {
    const modeSelect = document.getElementById('chat-mode-select');
    const keyInput = document.getElementById('gemini-api-key-input');
    if (!modeSelect || !keyInput) return;
    
    const mode = modeSelect.value;
    const apiKey = keyInput.value.trim();
    
    if (mode === 'gemini' && apiKey === '') {
        showSettingsStatus("Please provide a Gemini API Key to enable Gemini AI mode / जैमिनी मोड के लिए एपीआई की आवश्यक है।", "error");
        return;
    }
    
    chatSettings.mode = mode;
    chatSettings.apiKey = apiKey;
    
    localStorage.setItem('kisan_mitra_chat_settings', JSON.stringify(chatSettings));
    
    showSettingsStatus("Settings saved successfully! / सेटिंग्स सफलतापूर्वक सहेजी गईं!", "success");
    
    setTimeout(() => {
        toggleChatSettings();
    }, 1200);
}

async function testGeminiConnection() {
    const keyInput = document.getElementById('gemini-api-key-input');
    if (!keyInput) return;
    
    const apiKey = keyInput.value.trim();
    if (apiKey === '') {
        showSettingsStatus("Please enter an API key to test / कृपया परीक्षण के लिए एपीआई की दर्ज करें।", "error");
        return;
    }
    
    showSettingsStatus("Testing connection... / कनेक्शन परीक्षण किया जा रहा है...", "info");
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: "Hello, respond with exactly 'Success'" }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 10
                }
            })
        });
        
        if (!response.ok) {
            throw new Error("Invalid API key or network error.");
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        
        if (text.toLowerCase().includes('success')) {
            showSettingsStatus("Connection successful! Key is valid. / कनेक्शन सफल! कुंजी मान्य है।", "success");
        } else {
            showSettingsStatus("API responded, but authentication failed. / एपीआई ने प्रतिक्रिया दी, लेकिन प्रमाणीकरण विफल रहा।", "error");
        }
    } catch (e) {
        showSettingsStatus(`Connection failed: ${e.message} / कनेक्शन विफल रहा`, "error");
    }
}

function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.SpeechRecognition) {
        console.warn("Speech Recognition API is not supported in this browser.");
        const micBtn = document.getElementById('chat-mic-btn');
        if (micBtn) micBtn.style.display = 'none'; // Hide if not supported
        return;
    }

    recognition = new window.SpeechRecognition();
    recognition.continuous = false; // Stop listening when user stops speaking
    recognition.interimResults = false; // Only final results

    recognition.onstart = () => {
        isRecognizing = true;
        const micBtn = document.getElementById('chat-mic-btn');
        if (micBtn) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = `<i data-lucide="mic-off"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        const input = document.getElementById('chat-user-input');
        if (input) {
            input.placeholder = currentLang === 'hi' ? "सुन रहा हूँ... बोलें..." : "Listening... Speak now...";
        }
    };

    recognition.onend = () => {
        isRecognizing = false;
        const micBtn = document.getElementById('chat-mic-btn');
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = `<i data-lucide="mic"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        const input = document.getElementById('chat-user-input');
        if (input) {
            input.placeholder = currentLang === 'hi' ? "कृषि संबंधित प्रश्न पूछें..." : "Type agricultural query...";
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        isRecognizing = false;
        const micBtn = document.getElementById('chat-mic-btn');
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = `<i data-lucide="mic"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    recognition.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        const input = document.getElementById('chat-user-input');
        if (input && resultText) {
            input.value = resultText;
            sendChatMessage();
        }
    };
}

function toggleSpeechRecognition() {
    if (!recognition) {
        initSpeechRecognition();
    }
    if (!recognition) return;

    if (isRecognizing) {
        recognition.stop();
    } else {
        recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-IN';
        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start speech recognition", e);
        }
    }
}

// Text-to-Speech Read Aloud function for bot messages
function speakMessage(btn) {
    if (!synth) {
        console.warn("Speech Synthesis is not supported in this browser.");
        return;
    }
    
    const msgElement = btn.closest('.chat-msg').querySelector('.chat-msg-text') || btn.closest('.chat-msg');
    let text = msgElement.innerText || msgElement.textContent;
    
    // Clean emojis and examples/code formatting for a natural voice output
    text = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");
    text = text.replace(/Example:\s*".*?"\s*or\s*".*?"/gi, "");

    // Toggle speech if same button clicked
    if (synth.speaking && activeSpeakBtn === btn) {
        synth.cancel();
        btn.classList.remove('speaking');
        btn.innerHTML = `<i data-lucide="volume-2"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        activeSpeakBtn = null;
        return;
    }
    
    // Cancel current speaking if any
    if (synth.speaking) {
        synth.cancel();
        if (activeSpeakBtn) {
            activeSpeakBtn.classList.remove('speaking');
            activeSpeakBtn.innerHTML = `<i data-lucide="volume-2"></i>`;
        }
    }
    
    utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.0;
    utterance.rate = 0.95; // Slightly slower, more clear/natural pronunciation rate
    activeSpeakBtn = btn;
    
    // Choose voice language based on text scripts
    const isHindiText = /[\u0900-\u097F]/.test(text) || currentLang === 'hi';
    utterance.lang = isHindiText ? 'hi-IN' : 'en-IN';
    
    // Get currently available voices (either from cached voicesList or direct browser query)
    let availableVoices = voicesList.length > 0 ? voicesList : synth.getVoices();
    let selectedVoice = null;
    
    // Sort and prioritize high-quality natural, online, or Google voices
    const rankVoices = (voices) => {
        return [...voices].sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aScore = (aName.includes('natural') ? 4 : 0) + 
                           (aName.includes('google') ? 3 : 0) + 
                           (aName.includes('online') ? 2 : 0) + 
                           (aName.includes('neural') ? 1 : 0);
            const bScore = (bName.includes('natural') ? 4 : 0) + 
                           (bName.includes('google') ? 3 : 0) + 
                           (bName.includes('online') ? 2 : 0) + 
                           (bName.includes('neural') ? 1 : 0);
            return bScore - aScore;
        });
    };

    if (isHindiText) {
        // Filter and rank Hindi voices
        const hindiVoices = availableVoices.filter(v => {
            const l = v.lang.toLowerCase().replace('_', '-');
            return l.startsWith('hi') || v.name.toLowerCase().includes('hindi');
        });
        const ranked = rankVoices(hindiVoices);
        if (ranked.length > 0) {
            selectedVoice = ranked[0];
        }
    } else {
        // Filter and rank English voices
        const englishVoices = availableVoices.filter(v => {
            const l = v.lang.toLowerCase().replace('_', '-');
            return l.startsWith('en') || v.name.toLowerCase().includes('english');
        });
        const ranked = rankVoices(englishVoices);
        if (ranked.length > 0) {
            selectedVoice = ranked[0];
        }
    }
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    btn.classList.add('speaking');
    btn.innerHTML = `<i data-lucide="volume-x"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    utterance.onend = () => {
        btn.classList.remove('speaking');
        btn.innerHTML = `<i data-lucide="volume-2"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (activeSpeakBtn === btn) activeSpeakBtn = null;
    };
    
    utterance.onerror = () => {
        btn.classList.remove('speaking');
        btn.innerHTML = `<i data-lucide="volume-2"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (activeSpeakBtn === btn) activeSpeakBtn = null;
    };
    
    synth.speak(utterance);
}

// Quick query data and render engine
const quickQueriesData = {
    en: [
        { label: "🌦️ Today's Weather", query: "what is the weather today?" },
        { label: "🌾 Wheat Cultivation", query: "wheat guide" },
        { label: "🧪 Soil Testing", query: "how to test soil?" },
        { label: "🏛️ Government Schemes", query: "government welfare schemes" }
    ],
    hi: [
        { label: "🌦️ आज का मौसम", query: "aaj ka mausam" },
        { label: "🌾 गेहूँ की खेती", query: "gehu ki kheti" },
        { label: "🧪 मिट्टी परीक्षण", query: "soil test kaise karein" },
        { label: "🏛️ सरकारी योजनाएं", query: "pm kisan yojana" }
    ]
};

function renderQuickQueries() {
    const container = document.getElementById('chat-quick-queries');
    if (!container) return;
    
    const queries = quickQueriesData[currentLang] || quickQueriesData.en;
    container.innerHTML = '';
    
    queries.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'query-bubble';
        btn.innerText = q.label;
        btn.onclick = () => {
            const input = document.getElementById('chat-user-input');
            if (input) {
                input.value = q.query;
                sendChatMessage();
            }
        };
        container.appendChild(btn);
    });
}

// Dynamic Weather Alert system
function checkWeatherAlerts(maxRainChance, windSpeed) {
    const banner = document.getElementById('weather-alert-banner');
    if (!banner) return;
    
    let messageEn = '';
    let messageHi = '';
    let isAlert = false;
    
    if (maxRainChance > 50) {
        isAlert = true;
        messageEn = `⚠️ <strong>Weather Alert:</strong> High probability of rain (${maxRainChance}%) in the next 24 hours. Delay pesticide spray!`;
        messageHi = `⚠️ <strong>मौसम चेतावनी:</strong> अगले 24 घंटों में बारिश की अधिक संभावना (${maxRainChance}%) है। कीटनाशक छिड़काव अभी रोक दें!`;
    } else if (windSpeed > 25) {
        isAlert = true;
        messageEn = `⚠️ <strong>Weather Alert:</strong> High wind speed (${windSpeed} km/h) expected. Exercise caution during irrigation!`;
        messageHi = `⚠️ <strong>मौसम चेतावनी:</strong> तेज हवाएं (${windSpeed} किमी/घंटा) चलने की संभावना है। सिंचाई करते समय सावधानी बरतें!`;
    }
    
    if (isAlert) {
        banner.innerHTML = currentLang === 'hi' ? messageHi : messageEn;
        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(90deg, #b91c1c, #991b1b)';
    } else {
        messageEn = `☀️ <strong>Farming Tip:</strong> Good weather forecast. Ideal for sowing, weeding, and soil health testing!`;
        messageHi = `☀️ <strong>कृषि सुझाव:</strong> मौसम अनुकूल है। बुवाई, निराई और मृदा स्वास्थ्य परीक्षण के लिए उत्तम समय है!`;
        banner.innerHTML = currentLang === 'hi' ? messageHi : messageEn;
        banner.style.display = 'flex';
        banner.style.background = 'linear-gradient(90deg, #15803d, #166534)';
    }
}

function toggleChat() {
    const wrapper = document.getElementById('chat-wrapper');
    wrapper.classList.toggle('open');
    if (wrapper.classList.contains('open')) {
        setTimeout(() => {
            const input = document.getElementById('chat-user-input');
            if (input) input.focus();
        }, 150);
    }
}

// Close chatbot when clicking outside of it
document.addEventListener('click', (event) => {
    const wrapper = document.getElementById('chat-wrapper');
    if (!wrapper) return;
    
    if (wrapper.classList.contains('open') && !wrapper.contains(event.target)) {
        wrapper.classList.remove('open');
        // Close settings overlay if it was open
        const overlay = document.getElementById('chat-settings-overlay');
        const btn = document.getElementById('chat-settings-toggle-btn');
        if (overlay) overlay.classList.remove('open');
        if (btn) btn.classList.remove('active');
    }
});

function handleChatKey(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-user-input');
    const msgContainer = document.getElementById('chat-messages-container');
    const sendBtn = document.querySelector('.chat-send-btn');
    if (!input || !msgContainer) return;

    const rawText = input.value.trim();
    if (rawText === '') return;

    // Disable input and send button
    input.disabled = true;
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
    }
    input.style.opacity = '0.5';

    // 1. Render User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerHTML = `<p>${escapeHtml(rawText)}</p>`;
    msgContainer.appendChild(userMsg);

    // Save to history
    chatHistory.push({ role: 'user', parts: [{ text: rawText }] });
    if (chatHistory.length > 8) { // Keep last 4 turns (8 messages)
        chatHistory.shift();
    }

    // Clear input
    input.value = '';

    // Scroll to bottom
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Show typing loader representation
    const loaderMsg = document.createElement('div');
    loaderMsg.className = 'chat-msg bot typing-loader';
    loaderMsg.innerHTML = `<p style="display:flex; align-items:center; gap: 4px; color: var(--text-muted); margin: 0;"><i data-lucide="loader-2" class="animate-spin" style="width:14px; height:14px;"></i> Thinking...</p>`;
    msgContainer.appendChild(loaderMsg);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Trigger processing
    setTimeout(async () => {
        let responseHTML = '';
        
        if (chatSettings.mode === 'gemini' && chatSettings.apiKey) {
            responseHTML = await callGeminiAPI(rawText, chatSettings.apiKey);
        } else {
            responseHTML = processKisanMitraBackendQuery(rawText);
        }
        
        // Remove typing loader
        loaderMsg.remove();

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        botMsg.innerHTML = `
            <div class="chat-msg-text">${responseHTML}</div>
            <button class="chat-speak-btn" onclick="speakMessage(this)" title="Voice Read-Aloud / बोलकर सुनें">
                <i data-lucide="volume-2"></i>
            </button>
        `;
        msgContainer.appendChild(botMsg);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // Re-enable input and send button
        input.disabled = false;
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '';
            sendBtn.style.cursor = '';
        }
        input.style.opacity = '';
        input.focus();
        
        // Rebuild Lucide icons in chat responses if any exist
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 450);
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function callGeminiAPI(query, apiKey) {
    // Construct a context from active location and current weather to make the AI extremely smart!
    const activeBlock = activeLocation.block || 'Not specified';
    const activeDistrict = activeLocation.district || 'Not specified';
    const activeState = activeLocation.state || 'Not specified';
    
    let tempVal = '--';
    let humidityVal = '--';
    try {
        tempVal = document.getElementById('val-temp').innerText;
        humidityVal = document.getElementById('val-humidity').innerText;
    } catch (e) {}

    const locationContext = `[Context: The farmer's location is State: ${activeState}, District: ${activeDistrict}, Block/Village: ${activeBlock}. Current local weather is Temperature: ${tempVal}, Humidity: ${humidityVal}. Use this context to personalize your advice if relevant.]`;
    
    const systemPrompt = `You are Kisan Mitra, a professional, highly empathetic, and humanized AI agricultural expert helper for Indian farmers.
Goal: Provide practical, accurate, and localized farming advice.

- **Conversation Guidelines**:
  1. DO NOT REPEAT GREETINGS: Do not say hello, "Namaste", or repeat "Kisan bhai/sister" in every response. You should ONLY greet the user once at the very beginning of the chat. In all subsequent replies, dive directly into answering their question naturally without welcoming them or greeting them again.
  2. Answer queries fully, naturally, and conversationally. Do NOT cut off mid-sentence.
  3. Keep responses concise (under 180 words) to fit nicely in a mobile chat drawer. Use bullet points and relevant emojis.

- **Language & Tone Mirroring**:
  - You must match the script, language, vocabulary, and tone of the user's last message.
  - If the user asks in casual Hinglish (Hindi written in Latin script, e.g., "mausam kesa hoga"), respond in casual Hinglish.
  - If the user asks in Hindi Devanagari (e.g., "मौसम कैसा होगा"), respond in Hindi Devanagari.
  - If the user asks in regional scripts (Punjabi, Marathi, etc.), respond in that regional script.

- **Agricultural Context & Weather Inquiries**:
  - Current location and weather details: ${locationContext}.
  - You only have access to this current weather.
  - If the user asks about the weather forecast for tomorrow, next week, or future days, explain that you only see the current weather on your screen and politely guide them to check the "Weather & Jurisdiction" module on the dashboard, which shows a detailed 7-Day Meteorological Trend & Forecast chart.

- **Focus**: Focus strictly on farming, crop seasons (Rabi, Kharif, Zaid), organic methods, pest control, soil health, and government welfare schemes. Politely redirect unrelated queries.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: chatHistory,
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 600
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || 'API Error');
        }

        const data = await response.json();
        let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (reply === '') {
            throw new Error('Received empty response from Gemini API.');
        }

        // Save bot response to history
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
        if (chatHistory.length > 8) {
            chatHistory.shift();
        }

        reply = formatMarkdownToHTML(reply);
        return reply;
    } catch (error) {
        console.error("Gemini API Error:", error);
        // Remove the failed user message from history so they can retry
        chatHistory.pop();
        return `<p style="color:#f87171;">⚠️ <strong>API Error:</strong> Failed to connect to Gemini. (${error.message})</p>
                <p>Running in offline database matching mode instead...</p>
                <hr style="opacity:0.1; margin: 8px 0;">
                ${processKisanMitraBackendQuery(query)}`;
    }
}

function formatMarkdownToHTML(text) {
    let html = escapeHtml(text);
    
    // Convert headers (**text**) to bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert single asterisks to italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert newlines to paragraphs/breaks
    const lines = html.split('\n');
    let formattedLines = [];
    let inList = false;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            if (!inList) {
                formattedLines.push('<ul style="margin-left: 16px; margin-bottom: 8px; list-style-type: disc;">');
                inList = true;
            }
            formattedLines.push(`<li style="margin-bottom: 4px;">${trimmed.substring(2)}</li>`);
        } else {
            if (inList) {
                formattedLines.push('</ul>');
                inList = false;
            }
            if (trimmed !== '') {
                formattedLines.push(`<p style="margin-bottom: 8px;">${trimmed}</p>`);
            }
        }
    });
    if (inList) {
        formattedLines.push('</ul>');
    }
    
    return formattedLines.join('');
}

/**
 * Backend engine matcher logic
 * Leverage a strict domain knowledge base and matches localized intent
 */
function processKisanMitraBackendQuery(query) {
    const q = query.toLowerCase();
    
    // Check if query is in Hindi or Hinglish based on keywords
    const isHindi = /([\u0900-\u097F]|kheti|khad|gehu|chawal|ganna|sarso|aloo|tamatar|bajra|makka|mungfali|kapas|soyabean|yojana|krishi)/.test(q);
    
    // Matcher Helper
    const matches = (keywords) => {
        return keywords.some(kw => q.includes(kw));
    };

    // 1. WHEAT (गेहूँ)
    if (matches(['wheat', 'gehu', 'gehū', 'गेहूँ', 'गेहू'])) {
        return renderCropChatResponse(cropsDb.wheat, isHindi);
    }
    // 2. RICE (चावल)
    if (matches(['rice', 'chawal', 'धान', 'चावल'])) {
        return renderCropChatResponse(cropsDb.rice, isHindi);
    }
    // 3. SUGARCANE (गन्ना)
    if (matches(['sugarcane', 'ganna', 'गन्ना'])) {
        return renderCropChatResponse(cropsDb.sugarcane, isHindi);
    }
    // 4. SESAME / TIL (तिल)
    if (matches(['sesame', 'til', 'तिल'])) {
        return renderCropChatResponse(cropsDb.sesame, isHindi);
    }
    // 5. MUSTARD (सरसों)
    if (matches(['mustard', 'sarso', 'सरसों', 'सरसो'])) {
        return renderCropChatResponse(cropsDb.mustard, isHindi);
    }
    // 6. POTATO (आलू)
    if (matches(['potato', 'aloo', 'आलू'])) {
        return renderCropChatResponse(cropsDb.potato, isHindi);
    }
    // 7. TOMATO (टमाटर)
    if (matches(['tomato', 'tamatar', 'टमाटर'])) {
        return renderCropChatResponse(cropsDb.tomato, isHindi);
    }
    // 8. PEARL MILLET / BAJRA (बाजरा)
    if (matches(['bajra', 'millet', 'बाजरा'])) {
        return renderCropChatResponse(cropsDb.bajra, isHindi);
    }
    // 9. CORN (मक्का)
    if (matches(['corn', 'maize', 'makka', 'मक्का'])) {
        return renderCropChatResponse(cropsDb.corn, isHindi);
    }
    // 10. PEANUTS (मूंगफली)
    if (matches(['peanut', 'groundnut', 'mungfali', 'मूंगफली'])) {
        return renderCropChatResponse(cropsDb.peanuts, isHindi);
    }
    // 11. COTTON (कपास)
    if (matches(['cotton', 'kapas', 'कपास'])) {
        return renderCropChatResponse(cropsDb.cotton, isHindi);
    }
    // 12. SOYBEAN (सोयाबीन)
    if (matches(['soybean', 'soyabean', 'सोयाबीन'])) {
        return renderCropChatResponse(cropsDb.soybean, isHindi);
    }

    // 13. PM KISAN
    if (matches(['pm kisan', 'pmkisan', 'किसान योजना', '₹6000', '6000'])) {
        return isHindi ? 
            `<p><strong>पीएम किसान सम्मान निधि योजना:</strong></p>
             <p>छोटे और सीमांत किसानों को वित्तीय सुरक्षा प्रदान करने के लिए प्रति वर्ष <strong>₹6000</strong> की वित्तीय सहायता प्रदान की जाती है।</p>
             <p>🔗 <strong>आधिकारिक वेबसाइट:</strong> <a href="https://pmkisan.gov.in" target="_blank" style="color:var(--accent-light);">pmkisan.gov.in</a></p>` :
            `<p><strong>PM Kisan Yojana:</strong></p>
             <p>Provides direct income support of <strong>₹6000/year</strong> in three equal installments to small and marginal farmers.</p>
             <p>🔗 <strong>Official Website:</strong> <a href="https://pmkisan.gov.in" target="_blank" style="color:var(--accent-light);">pmkisan.gov.in</a></p>`;
    }

    // 14. SOIL HEALTH CARD
    if (matches(['soil health', 'mridha', 'mitti test', 'मृदा स्वास्थ्य', 'मिट्टी परीक्षण'])) {
        return isHindi ? 
            `<p><strong>मृदा स्वास्थ्य कार्ड योजना (Soil Health Card):</strong></p>
             <p>यह योजना मिट्टी के रासायनिक मापदंडों और पोषक तत्वों (NPK, सूक्ष्म तत्व) की जांच कर किसानों को सही उर्वरक उपयोग का सुझाव देती है।</p>
             <p>🔗 <strong>पोर्टल लिंक:</strong> <a href="https://soilhealth.dac.gov.in" target="_blank" style="color:var(--accent-light);">soilhealth.dac.gov.in</a></p>` :
            `<p><strong>Soil Health Card Scheme:</strong></p>
             <p>Monitors soil chemistry parameters and nutrient deficiencies to guide fertilization and maximize crop yield parameters.</p>
             <p>🔗 <strong>Portal Link:</strong> <a href="https://soilhealth.dac.gov.in" target="_blank" style="color:var(--accent-light);">soilhealth.dac.gov.in</a></p>`;
    }

    // 15. PMFBY (FASAL BIMA)
    if (matches(['insurance', 'bima', 'calamities', 'calamity', 'pmfby', 'बीमा', 'फसल बीमा'])) {
        return isHindi ? 
            `<p><strong>प्रधानमंत्री फसल बीमा योजना (PMFBY):</strong></p>
             <p>यह योजना प्राकृतिक आपदाओं, कीड़ों, या बीमारियों के कारण फसल की बर्बादी होने पर किसानों को वित्तीय सुरक्षा (बीमा) प्रदान करती है।</p>
             <p>🔗 <strong>पोर्टल लिंक:</strong> <a href="https://pmfby.gov.in" target="_blank" style="color:var(--accent-light);">pmfby.gov.in</a></p>` :
            `<p><strong>Pradhan Mantri Fasal Bima Yojana (PMFBY):</strong></p>
             <p>Offers low-premium crop insurance protecting farmers against natural hazards, weather failures, and biological threats.</p>
             <p>🔗 <strong>Portal Link:</strong> <a href="https://pmfby.gov.in" target="_blank" style="color:var(--accent-light);">pmfby.gov.in</a></p>`;
    }

    // 16. NMSA
    if (matches(['nmsa', 'sustainable', 'organic', 'composting', 'टिकाऊ कृषि', 'जैविक'])) {
        return isHindi ? 
            `<p><strong>सतत कृषि के लिए राष्ट्रीय मिशन (NMSA):</strong></p>
             <p>यह मिशन पानी के कुशल उपयोग, जैविक खाद (composting), और कृषि वानिकी द्वारा टिकाऊ मिट्टी स्वास्थ्य को बढ़ावा देता है।</p>
             <p>🔗 <strong>पोर्टल लिंक:</strong> <a href="https://nmsa.dac.gov.in" target="_blank" style="color:var(--accent-light);">nmsa.dac.gov.in</a></p>` :
            `<p><strong>National Mission for Sustainable Agriculture (NMSA):</strong></p>
             <p>Focuses on making agriculture productive, sustainable, remunerative, and climate-resilient through water use efficiency and organic composting.</p>
             <p>🔗 <strong>Portal Link:</strong> <a href="https://nmsa.dac.gov.in" target="_blank" style="color:var(--accent-light);">nmsa.dac.gov.in</a></p>`;
    }

    // 17. WEATHER OR IRRIGATION SPECIFIC INQUIRIES
    if (matches(['weather', 'temp', 'rain', 'mausam', 'barish', 'temperature', 'सिंचाई', 'सिचाई', 'मौसम', 'तापमान', 'तापमान'])) {
        const activeBlockName = activeLocation.block || 'Selected Block';
        return isHindi ?
            `<p>📍 <strong>${activeBlockName} मौसम रिपोर्ट:</strong></p>
             <p>तापमान: ${document.getElementById('val-temp').innerText} | आर्द्रता: ${document.getElementById('val-humidity').innerText}</p>
             <p>फसलों की सिंचाई मिट्टी में नमी के स्तर को ध्यान में रखकर करें। रबी फसलों को हल्की व खरीफ फसलों को भारी सिंचाई की जरूरत होती है।</p>` :
            `<p>📍 <strong>Weather & Irrigation at ${activeBlockName}:</strong></p>
             <p>Current: Temp: ${document.getElementById('val-temp').innerText} | Humidity: ${document.getElementById('val-humidity').innerText}</p>
             <p>Check the 3D Weather Canvas on the dashboard for real-time visualization and use the 6-day trend graph to plan your irrigations.</p>`;
    }

    // 18. SOIL / DISEASE / NPK QUERIES
    if (matches(['soil', 'ph', 'npk', 'nitrogen', 'fertilizer', 'khad', 'mitti', 'मिट्टी', 'उर्वरक', 'खाद', 'नाइट्रोजन', 'पीएच'])) {
        return isHindi ?
            `<p><strong>🧪 मिट्टी स्वास्थ्य गाइड:</strong></p>
             <p>मिट्टी का आदर्श pH 6.0-7.5 होना चाहिए। NPK अनुपात जानने के लिए <strong>मृदा एवं रोग निदान</strong> मॉड्यूल में जाएं और अपने मिट्टी के मान दर्ज करें।</p>
             <p>🌿 <strong>सुझाव:</strong> अम्लीय मिट्टी (pH &lt; 6) के लिए चूना डालें। क्षारीय मिट्टी (pH &gt; 7.5) के लिए जिप्सम प्रयोग करें।</p>` :
            `<p><strong>🧪 Soil Health Quick Guide:</strong></p>
             <p>Ideal soil pH is <strong>6.0–7.5</strong> for most crops. Use the <strong>Soil & Disease Diagnosis</strong> module to analyze your NPK levels and get personalized recommendations.</p>
             <p>🌿 <strong>Tip:</strong> For acidic soil (pH &lt; 6), apply agricultural lime. For alkaline soil (pH &gt; 7.5), use gypsum or sulfur.`;
    }

    // 19. DISEASE QUERIES
    if (matches(['disease', 'pest', 'blight', 'rust', 'borer', 'aphid', 'रोग', 'कीट', 'झुलसा', 'रतुआ', 'चेपा', 'छेदक'])) {
        return isHindi ?
            `<p><strong>🔍 रोग निदान सहायक:</strong></p>
             <p>फसल रोग की पहचान के लिए <strong>मृदा एवं रोग निदान</strong> मॉड्यूल खोलें। वहां अपनी फसल चुनें और दिख रहे लक्षणों का चयन करें।</p>
             <p>⚡ हमारा AI 9 फसलों के 20+ रोगों की पहचान करके सटीक कीटनाशक सिफारिश देगा।</p>` :
            `<p><strong>🔍 Disease Diagnosis Guide:</strong></p>
             <p>Open the <strong>Soil & Disease Diagnosis</strong> module, select your crop, click the symptoms you observe — our AI will match and diagnose the disease with specific chemical treatment recommendations.</p>
             <p>⚡ Covers 20+ diseases across 9 major crops including wheat rust, rice blast, potato blight, cotton bollworm and more.</p>`;
    }

    // 20. GRACEFUL FALLBACK (Conversational standard matching)
    return isHindi ? 
        `<p><strong>नमस्ते!</strong> मैं केवल 12 मुख्य फसलों (गेहूँ, चावल, गन्ना, तिल, सरसों, आलू, टमाटर, बाजरा, मक्का, मूंगफली, कपास, सोयाबीन), मौसम, सिंचाई, खाद/कीटनाशकों और सरकारी योजनाओं से संबंधित कृषि सलाह दे सकता हूँ।</p>
         <p>💡 <em>सुझाव:</em> उन्नत एआई बातचीत शुरू करने के लिए ऊपर ⚙️ सेटिंग्स में अपनी **Gemini API Key** दर्ज करें!</p>` :
        `<p><strong>Greetings from Kisan Mitra!</strong> I specialize in weather analytics, irrigation protocols, soil metrics, chemical guides, and government welfare programs for our 12 primary crops.</p>
         <p>💡 <em>Tip:</em> To unlock advanced natural language AI responses, enter your **Gemini API Key** in the ⚙️ settings panel above!</p>`;
}


function renderCropChatResponse(crop, isHindi) {
    const cropName = isHindi ? crop.nameHi : crop.nameEn;
    const soil = isHindi ? crop.soilHi : crop.soilEn;
    const season = isHindi ? crop.seasonHi : crop.seasonEn;
    const water = isHindi ? crop.waterHi : crop.waterEn;
    const fertil = isHindi ? crop.fertilizerHi : crop.fertilizerEn;
    const pest = isHindi ? crop.pesticideHi : crop.pesticideEn;

    return `
        <p>🌾 <strong>${crop.icon} ${cropName} Guide:</strong></p>
        <p>🌱 <strong>Soil:</strong> ${soil}</p>
        <p>📅 <strong>Season:</strong> ${season}</p>
        <p>💧 <strong>Irrigation:</strong> ${water}</p>
        <p>🧪 <strong>Fertilizers:</strong> ${makeChemicalTags(fertil)}</p>
        <p>🛡️ <strong>Pesticides:</strong> ${makeChemicalTags(pest)}</p>
    `;
}

// ==================== HTML5 GEOLOCATION AUTO-DETECTOR ====================
function autoDetectLocation(silent = false) {
    const locateBtn = document.getElementById('btn-locate-me');
    let originalHtml = '';
    
    if (locateBtn && !silent) {
        originalHtml = locateBtn.innerHTML;
        locateBtn.disabled = true;
        locateBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> <span>Detecting...</span>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    if (!navigator.geolocation) {
        if (!silent) alert("Geolocation is not supported by your browser / आपके ब्राउज़र द्वारा जियोलोकेशन समर्थित नहीं है।");
        if (locateBtn && !silent) {
            locateBtn.innerHTML = originalHtml;
            locateBtn.disabled = false;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            console.log(`Detected coordinates: Lat ${lat}, Lon ${lon}, Accuracy: ${accuracy}m`);

            // If the accuracy is very low (e.g. > 5km), warn the user that it might fall back to IP geolocation
            if (accuracy > 5000 && !silent) {
                alert(`Note: Location accuracy is low (approx. ${Math.round(accuracy / 1000)} km). The system may be using IP address routing instead of active GPS. If the detected location is incorrect, please select your location manually or use a GPS-enabled device.\n\nसूचना: स्थान की सटीकता कम है (लगभग ${Math.round(accuracy / 1000)} किमी)। यह गलत होने पर कृपया मैन्युअल रूप से अपना राज्य/जिला चुनें।`);
            }

            try {
                // Nominatim reverse geocoding
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`, {
                    headers: {
                        'User-Agent': 'KisanMitraApp/1.0'
                    }
                });
                if (!res.ok) throw new Error("Reverse geocoding request failed");
                const data = await res.json();
                
                if (data && data.address) {
                    const detectedState = data.address.state;
                    const detectedDistrict = data.address.state_district || data.address.district || data.address.city || data.address.county || data.address.suburb || data.address.town || data.address.village;
                    console.log(`Geocoded location: State: ${detectedState}, District: ${detectedDistrict}`);

                    if (detectedState) {
                        // Match state in local locationData database
                        let matchedState = '';
                        Object.keys(locationData).forEach(s => {
                            const cleanS = s.toLowerCase().trim();
                            const cleanDet = detectedState.toLowerCase().trim();
                            if (cleanS === cleanDet || cleanS.includes(cleanDet) || cleanDet.includes(cleanS)) {
                                matchedState = s;
                            }
                        });

                        if (matchedState) {
                            // Populate State select dropdown
                            const stateSelect = document.getElementById('select-state');
                            stateSelect.value = matchedState;
                            onStateChange();

                            // Match district in state
                            if (detectedDistrict) {
                                let matchedDistrict = '';
                                const districts = Object.keys(locationData[matchedState]);
                                
                                let normDetDistrict = detectedDistrict.toLowerCase().trim();
                                // Special geolocation district matching normalizations
                                if (normDetDistrict.includes("prayagraj") || normDetDistrict.includes("allahabad")) {
                                    matchedDistrict = "Allahabad";
                                } else if (normDetDistrict.includes("varanasi") || 
                                           normDetDistrict.includes("banaras") || 
                                           normDetDistrict.includes("banarsi") || 
                                           normDetDistrict.includes("vanarsi")) {
                                    matchedDistrict = "Varanasi";
                                }

                                if (!matchedDistrict) {
                                    // Direct match
                                    districts.forEach(d => {
                                        if (d.toLowerCase().trim() === normDetDistrict) {
                                            matchedDistrict = d;
                                        }
                                    });
                                }

                                // Substring match
                                if (!matchedDistrict) {
                                    districts.forEach(d => {
                                        const cleanD = d.toLowerCase().replace(/\s*\(.*\)/g, '').trim();
                                        if (cleanD.includes(normDetDistrict) || normDetDistrict.includes(cleanD)) {
                                            matchedDistrict = d;
                                        }
                                    });
                                }

                                if (matchedDistrict) {
                                    const districtSelect = document.getElementById('select-district');
                                    districtSelect.value = matchedDistrict;
                                    onDistrictChange();

                                    // Auto-select first available block in matched district
                                    const blockSelect = document.getElementById('select-block');
                                    if (blockSelect && blockSelect.options.length > 1) {
                                        blockSelect.selectedIndex = 1; // select the first block option
                                        onBlockChange();
                                    }
                                    
                                    console.log(`Auto-configured location to: State: ${matchedState}, District: ${matchedDistrict}`);
                                } else {
                                    console.warn(`Could not match district "${detectedDistrict}" in state "${matchedState}".`);
                                }
                            }
                        } else {
                            console.warn(`Could not match state "${detectedState}" in location database.`);
                        }
                    }
                }
            } catch (err) {
                console.error("Reverse geocoding error:", err);
                if (!silent) alert("Failed to resolve location address / स्थान का पता लगाने में विफल।");
            } finally {
                if (locateBtn && !silent) {
                    locateBtn.innerHTML = originalHtml;
                    locateBtn.disabled = false;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        },
        (error) => {
            console.warn("Geolocation permission or retrieval error:", error);
            if (!silent) {
                let msg = "Could not access location / स्थान तक पहुँचने में असमर्थ।";
                if (error.code === error.PERMISSION_DENIED) {
                    msg = "Location access denied. Please grant location access in browser settings or select manually. / स्थान पहुंच अस्वीकृत। कृपया मैन्युअल रूप से चुनें।";
                } else if (error.code === error.TIMEOUT) {
                    msg = "Location request timed out. Please try again or select manually. / स्थान अनुरोध का समय समाप्त हो गया। कृपया पुन: प्रयास करें या मैन्युअल रूप से चुनें।";
                }
                alert(msg);
            }
            if (locateBtn && !silent) {
                locateBtn.innerHTML = originalHtml;
                locateBtn.disabled = false;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

// ==================== EXPANDED SCHEMES DATABASE (8 SCHEMES) ====================
const schemesDbExpanded = [
    { nameEn: 'Kisan Credit Card (KCC)', nameHi: 'किसान क्रेडिट कार्ड (KCC)', descEn: 'Short-term credit for agricultural needs at subsidized interest rates (2-4% p.a.) via all nationalized banks.', descHi: 'सभी राष्ट्रीयकृत बैंकों के माध्यम से 2-4% वार्षिक सब्सिडी दर पर कृषि आवश्यकताओं के लिए अल्पकालिक ऋण।', badgeEn: 'Credit & Loans', badgeHi: 'ऋण सहायता', icon: '💳', link: 'https://www.nabard.org/content.aspx?id=572' },
    { nameEn: 'PM Krishi Sinchai Yojana (PMKSY)', nameHi: 'पीएम कृषि सिंचाई योजना (PMKSY)', descEn: '"Har Khet Ko Pani" — water for every farm. Up to 55% subsidy on drip & sprinkler micro-irrigation systems.', descHi: '"हर खेत को पानी" — ड्रिप और स्प्रिंकलर सिंचाई पर 55% तक सब्सिडी।', badgeEn: 'Irrigation', badgeHi: 'सिंचाई', icon: '💧', link: 'https://pmksy.gov.in' },
    { nameEn: 'Agriculture Infrastructure Fund (AIF)', nameHi: 'कृषि अवसंरचना कोष (AIF)', descEn: 'Rs.1 lakh crore fund for post-harvest infrastructure: cold chains, warehouses, silos, and primary processing units.', descHi: 'शीत भंडार, गोदाम, साइलो और प्रसंस्करण इकाइयों के लिए 1 लाख करोड़ का सरकारी कोष।', badgeEn: 'Infrastructure', badgeHi: 'भंडारण', icon: '🏭', link: 'https://agriinfra.dac.gov.in' },
    { nameEn: 'e-NAM (National Agriculture Market)', nameHi: 'ई-नाम (राष्ट्रीय कृषि बाजार)', descEn: 'Online trading portal connecting 1000+ mandis. Transparent bidding for best prices on farm produce across India.', descHi: '1000+ मंडियों को जोड़ने वाला ऑनलाइन पोर्टल। पारदर्शी बोली से किसानों को उत्पाद का सर्वोत्तम मूल्य।', badgeEn: 'Market Access', badgeHi: 'बाजार पहुंच', icon: '📱', link: 'https://enam.gov.in' }
];

// ==================== IRRIGATION CALCULATOR ====================
const irrigationData = {
    wheat:      { baseMM: 40, stageMulti: { germination: 0.6, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.1, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Furrow / Flood Irrigation', methodHi: 'नाली/बाढ़ सिंचाई', freqDays: { germination: 5, vegetative: 7, flowering: 5, 'grain-fill': 8, maturity: 12 } },
    rice:       { baseMM: 80, stageMulti: { germination: 1.0, vegetative: 1.4, flowering: 1.5, 'grain-fill': 1.2, maturity: 0.7 }, soilMulti: { sandy: 1.6, loamy: 1.0, clay: 0.6, 'sandy-loam': 1.2 }, method: 'Flood / Puddling', methodHi: 'बाढ़/पोखर सिंचाई', freqDays: { germination: 3, vegetative: 4, flowering: 3, 'grain-fill': 5, maturity: 10 } },
    sugarcane:  { baseMM: 60, stageMulti: { germination: 0.7, vegetative: 1.2, flowering: 1.4, 'grain-fill': 1.3, maturity: 0.8 }, soilMulti: { sandy: 1.5, loamy: 1.0, clay: 0.7, 'sandy-loam': 1.2 }, method: 'Drip Irrigation (Preferred)', methodHi: 'ड्रिप सिंचाई (सर्वोत्तम)', freqDays: { germination: 5, vegetative: 6, flowering: 5, 'grain-fill': 7, maturity: 10 } },
    sesame:     { baseMM: 20, stageMulti: { germination: 0.5, vegetative: 0.8, flowering: 1.2, 'grain-fill': 1.0, maturity: 0.4 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.85, 'sandy-loam': 1.1 }, method: 'Sprinkler / Furrow', methodHi: 'स्प्रिंकलर/नाली सिंचाई', freqDays: { germination: 10, vegetative: 12, flowering: 8, 'grain-fill': 12, maturity: 20 } },
    mustard:    { baseMM: 25, stageMulti: { germination: 0.5, vegetative: 0.8, flowering: 1.2, 'grain-fill': 1.0, maturity: 0.4 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.1 }, method: 'Sprinkler / Furrow', methodHi: 'स्प्रिंकलर/नाली सिंचाई', freqDays: { germination: 8, vegetative: 10, flowering: 7, 'grain-fill': 12, maturity: 20 } },
    potato:     { baseMM: 45, stageMulti: { germination: 0.8, vegetative: 1.1, flowering: 1.4, 'grain-fill': 1.3, maturity: 0.7 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip / Sprinkler', methodHi: 'ड्रिप/स्प्रिंकलर सिंचाई', freqDays: { germination: 4, vegetative: 6, flowering: 4, 'grain-fill': 5, maturity: 10 } },
    tomato:     { baseMM: 50, stageMulti: { germination: 0.7, vegetative: 1.1, flowering: 1.4, 'grain-fill': 1.2, maturity: 0.8 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip Irrigation', methodHi: 'ड्रिप सिंचाई', freqDays: { germination: 4, vegetative: 5, flowering: 3, 'grain-fill': 4, maturity: 8 } },
    bajra:      { baseMM: 20, stageMulti: { germination: 0.5, vegetative: 0.8, flowering: 1.2, 'grain-fill': 1.0, maturity: 0.4 }, soilMulti: { sandy: 1.2, loamy: 1.0, clay: 0.85, 'sandy-loam': 1.1 }, method: 'Rain-fed / Sprinkler', methodHi: 'वर्षाश्रित/स्प्रिंकलर', freqDays: { germination: 8, vegetative: 10, flowering: 8, 'grain-fill': 10, maturity: 18 } },
    corn:       { baseMM: 45, stageMulti: { germination: 0.7, vegetative: 1.0, flowering: 1.4, 'grain-fill': 1.3, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Furrow Irrigation', methodHi: 'नाली सिंचाई', freqDays: { germination: 5, vegetative: 7, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    peanuts:    { baseMM: 30, stageMulti: { germination: 0.6, vegetative: 0.9, flowering: 1.3, 'grain-fill': 1.1, maturity: 0.5 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Sprinkler / Furrow', methodHi: 'स्प्रिंकलर/नाली सिंचाई', freqDays: { germination: 7, vegetative: 8, flowering: 6, 'grain-fill': 8, maturity: 14 } },
    cotton:     { baseMM: 55, stageMulti: { germination: 0.6, vegetative: 1.1, flowering: 1.5, 'grain-fill': 1.2, maturity: 0.6 }, soilMulti: { sandy: 1.5, loamy: 1.0, clay: 0.7, 'sandy-loam': 1.2 }, method: 'Drip / Furrow', methodHi: 'ड्रिप/नाली सिंचाई', freqDays: { germination: 6, vegetative: 8, flowering: 5, 'grain-fill': 8, maturity: 15 } },
    soybean:    { baseMM: 35, stageMulti: { germination: 0.6, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.1, maturity: 0.5 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Sprinkler / Rain-fed', methodHi: 'स्प्रिंकलर/वर्षाश्रित', freqDays: { germination: 7, vegetative: 10, flowering: 6, 'grain-fill': 9, maturity: 15 } },
    barley:     { baseMM: 35, stageMulti: { germination: 0.6, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.1, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Furrow / Flood', methodHi: 'नाली/बाढ़ सिंचाई', freqDays: { germination: 6, vegetative: 8, flowering: 6, 'grain-fill': 8, maturity: 14 } },
    chickpea:   { baseMM: 25, stageMulti: { germination: 0.5, vegetative: 0.8, flowering: 1.2, 'grain-fill': 1.0, maturity: 0.5 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Sprinkler / Furrow', methodHi: 'स्प्रिंकलर/नाली सिंचाई', freqDays: { germination: 8, vegetative: 10, flowering: 7, 'grain-fill': 10, maturity: 18 } },
    lentil:     { baseMM: 25, stageMulti: { germination: 0.5, vegetative: 0.8, flowering: 1.2, 'grain-fill': 1.0, maturity: 0.5 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Sprinkler / Furrow', methodHi: 'स्प्रिंकलर/नाली सिंचाई', freqDays: { germination: 8, vegetative: 10, flowering: 7, 'grain-fill': 10, maturity: 18 } },
    pigeonpea:  { baseMM: 30, stageMulti: { germination: 0.6, vegetative: 0.9, flowering: 1.3, 'grain-fill': 1.1, maturity: 0.5 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Furrow / Rain-fed', methodHi: 'नाली/वर्षाश्रित', freqDays: { germination: 7, vegetative: 9, flowering: 6, 'grain-fill': 8, maturity: 15 } },
    greengram:  { baseMM: 25, stageMulti: { germination: 0.5, vegetative: 0.9, flowering: 1.2, 'grain-fill': 1.1, maturity: 0.5 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.1 }, method: 'Sprinkler / Drip', methodHi: 'स्प्रिंकलर/ड्रिप', freqDays: { germination: 6, vegetative: 8, flowering: 6, 'grain-fill': 8, maturity: 14 } },
    blackgram:  { baseMM: 25, stageMulti: { germination: 0.5, vegetative: 0.9, flowering: 1.2, 'grain-fill': 1.1, maturity: 0.5 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.1 }, method: 'Sprinkler / Drip', methodHi: 'स्प्रिंकलर/ड्रिप', freqDays: { germination: 6, vegetative: 8, flowering: 6, 'grain-fill': 8, maturity: 14 } },
    sunflower:  { baseMM: 40, stageMulti: { germination: 0.6, vegetative: 1.0, flowering: 1.4, 'grain-fill': 1.2, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Furrow / Sprinkler', methodHi: 'नाली/स्प्रिंकलर', freqDays: { germination: 6, vegetative: 8, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    onion:      { baseMM: 45, stageMulti: { germination: 0.7, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.1, maturity: 0.5 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip / Sprinkler', methodHi: 'ड्रिप/स्प्रिंकलर', freqDays: { germination: 5, vegetative: 6, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    cabbage:    { baseMM: 45, stageMulti: { germination: 0.7, vegetative: 1.1, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip / Sprinkler', methodHi: 'ड्रिप/स्प्रिंकलर', freqDays: { germination: 5, vegetative: 6, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    cauliflower:{ baseMM: 45, stageMulti: { germination: 0.7, vegetative: 1.1, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip / Sprinkler', methodHi: 'ड्रिप/स्प्रिंकलर', freqDays: { germination: 5, vegetative: 6, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    chili:      { baseMM: 40, stageMulti: { germination: 0.7, vegetative: 1.0, flowering: 1.4, 'grain-fill': 1.2, maturity: 0.7 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip Irrigation', methodHi: 'ड्रिप सिंचाई', freqDays: { germination: 5, vegetative: 7, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    ginger:     { baseMM: 50, stageMulti: { germination: 0.8, vegetative: 1.2, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.7 }, soilMulti: { sandy: 1.5, loamy: 1.0, clay: 0.7, 'sandy-loam': 1.2 }, method: 'Sprinkler / Rain-fed', methodHi: 'स्प्रिंकलर/वर्षाश्रित', freqDays: { germination: 8, vegetative: 10, flowering: 8, 'grain-fill': 10, maturity: 15 } },
    turmeric:   { baseMM: 50, stageMulti: { germination: 0.8, vegetative: 1.2, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.7 }, soilMulti: { sandy: 1.5, loamy: 1.0, clay: 0.7, 'sandy-loam': 1.2 }, method: 'Sprinkler / Rain-fed', methodHi: 'स्प्रिंकलर/वर्षाश्रित', freqDays: { germination: 8, vegetative: 10, flowering: 8, 'grain-fill': 10, maturity: 15 } },
    banana:     { baseMM: 70, stageMulti: { germination: 0.8, vegetative: 1.2, flowering: 1.4, 'grain-fill': 1.3, maturity: 0.9 }, soilMulti: { sandy: 1.5, loamy: 1.0, clay: 0.7, 'sandy-loam': 1.25 }, method: 'Drip Irrigation', methodHi: 'ड्रिप सिंचाई', freqDays: { germination: 3, vegetative: 4, flowering: 3, 'grain-fill': 4, maturity: 7 } },
    mango:      { baseMM: 30, stageMulti: { germination: 0.5, vegetative: 0.8, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.5 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Drip / Basin Irrigation', methodHi: 'ड्रिप/थाला सिंचाई', freqDays: { germination: 10, vegetative: 15, flowering: 7, 'grain-fill': 10, maturity: 20 } },
    orange:     { baseMM: 45, stageMulti: { germination: 0.6, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.7 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip Irrigation', methodHi: 'ड्रिप सिंचाई', freqDays: { germination: 7, vegetative: 10, flowering: 6, 'grain-fill': 8, maturity: 15 } },
    grapes:     { baseMM: 35, stageMulti: { germination: 0.6, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.6 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.15 }, method: 'Drip Irrigation', methodHi: 'ड्रिप सिंचाई', freqDays: { germination: 6, vegetative: 8, flowering: 5, 'grain-fill': 7, maturity: 12 } },
    tea:        { baseMM: 50, stageMulti: { germination: 0.8, vegetative: 1.1, flowering: 1.2, 'grain-fill': 1.2, maturity: 0.9 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Sprinkler / Rain-fed', methodHi: 'स्प्रिंकलर/वर्षाश्रित', freqDays: { germination: 5, vegetative: 7, flowering: 5, 'grain-fill': 7, maturity: 10 } },
    coffee:     { baseMM: 40, stageMulti: { germination: 0.7, vegetative: 1.0, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.8 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Sprinkler / Drip', methodHi: 'स्प्रिंकलर/ड्रिप', freqDays: { germination: 7, vegetative: 10, flowering: 5, 'grain-fill': 8, maturity: 12 } },
    coconut:    { baseMM: 60, stageMulti: { germination: 0.8, vegetative: 1.1, flowering: 1.3, 'grain-fill': 1.2, maturity: 0.9 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.75, 'sandy-loam': 1.2 }, method: 'Drip / Basin Irrigation', methodHi: 'ड्रिप/थाला सिंचाई', freqDays: { germination: 5, vegetative: 6, flowering: 5, 'grain-fill': 6, maturity: 10 } },
    jute:       { baseMM: 40, stageMulti: { germination: 0.7, vegetative: 1.1, flowering: 1.2, 'grain-fill': 1.2, maturity: 0.7 }, soilMulti: { sandy: 1.4, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Flood / Rain-fed', methodHi: 'बाढ़/वर्षाश्रित', freqDays: { germination: 5, vegetative: 7, flowering: 6, 'grain-fill': 8, maturity: 12 } },
    rubber:     { baseMM: 30, stageMulti: { germination: 0.6, vegetative: 0.9, flowering: 1.1, 'grain-fill': 1.0, maturity: 0.7 }, soilMulti: { sandy: 1.3, loamy: 1.0, clay: 0.8, 'sandy-loam': 1.15 }, method: 'Rain-fed / Drip', methodHi: 'वर्षाश्रित/ड्रिप', freqDays: { germination: 10, vegetative: 15, flowering: 10, 'grain-fill': 12, maturity: 20 } }
};

function calculateIrrigation() {
    const crop = document.getElementById('irr-crop-select').value;
    const area = parseFloat(document.getElementById('irr-area-input').value) || 1;
    const soil = document.getElementById('irr-soil-select').value;
    const stage = document.getElementById('irr-stage-select').value;

    const data = irrigationData[crop];
    if (!data) return;

    const baseMM = data.baseMM;
    const stageMult = data.stageMulti[stage] || 1.0;
    const soilMult = data.soilMulti[soil] || 1.0;
    const adjustedMM = Math.round(baseMM * stageMult * soilMult);
    const totalLitres = Math.round(adjustedMM * area * 10000 / 1000); // mm * ha * 10000m2/ha / 1000 L/m3 -> kL
    const freqDays = data.freqDays[stage] || 7;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + freqDays);
    const nextStr = nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    document.getElementById('irr-val-water').innerText = `${totalLitres.toLocaleString('en-IN')} kL`;
    document.getElementById('irr-val-freq').innerText = `Every ${freqDays} days`;
    document.getElementById('irr-val-next').innerText = nextStr;
    document.getElementById('irr-val-method').innerText = currentLang === 'hi' ? data.methodHi : data.method;

    // Advice text
    const adviceMap = {
        germination: 'Light frequent irrigation during germination prevents crust formation and ensures uniform emergence.',
        vegetative: 'Maintain consistent moisture during vegetative growth. Avoid waterlogging to prevent root diseases.',
        flowering: 'Critical stage — never let the soil dry out during flowering. Water stress reduces yield by 20-40%.',
        'grain-fill': 'Moderate irrigation during grain fill. Excess water can cause lodging and reduce grain quality.',
        maturity: 'Reduce irrigation as the crop approaches maturity. Stop 2 weeks before harvest for dry harvesting.'
    };
    const adviceMapHi = {
        germination: 'अंकुरण के दौरान हल्की और बार-बार सिंचाई से मिट्टी की ऊपरी परत नहीं जमती और अंकुरण एक समान होता है।',
        vegetative: 'वानस्पतिक वृद्धि के दौरान मिट्टी में नमी बनाए रखें। जड़ रोगों से बचाने के लिए जलभराव न होने दें।',
        flowering: 'महत्वपूर्ण अवस्था — पुष्पन के दौरान मिट्टी को कभी न सूखने दें। पानी की कमी से उपज 20-40% घट सकती है।',
        'grain-fill': 'दाना भरने के दौरान मध्यम सिंचाई करें। अत्यधिक पानी से फसल गिर सकती है और अनाज की गुणवत्ता घट सकती है।',
        maturity: 'पकने के निकट सिंचाई कम करें। सूखी कटाई के लिए फसल की कटाई से 2 सप्ताह पहले सिंचाई बंद करें।'
    };
    const adviceText = currentLang === 'hi' ? adviceMapHi[stage] : adviceMap[stage];
    document.getElementById('irr-advice-text').innerText = adviceText;
    lucide.createIcons();
}

// ==================== SEASONAL CROP CALENDAR ====================
const cropCalendarData = [
    { crop: 'Wheat', cropHi: 'गेहूँ', icon: '🌾', sow: [9,10,11], grow: [11,0,1,2], harvest: [3,4] },
    { crop: 'Rice', cropHi: 'चावल', icon: '🌾', sow: [5,6], grow: [6,7,8], harvest: [9,10] },
    { crop: 'Sugarcane', cropHi: 'गन्ना', icon: '🎋', sow: [1,2,3], grow: [3,4,5,6,7,8,9,10], harvest: [11,0,1] },
    { crop: 'Sesame', cropHi: 'तिल', icon: '🌱', sow: [5,6], grow: [6,7,8], harvest: [9,10] },
    { crop: 'Mustard', cropHi: 'सरसों', icon: '🌼', sow: [9,10], grow: [10,11,0], harvest: [1,2] },
    { crop: 'Potato', cropHi: 'आलू', icon: '🥔', sow: [9,10], grow: [10,11,0], harvest: [1,2] },
    { crop: 'Tomato', cropHi: 'टमाटर', icon: '🍅', sow: [10,11], grow: [11,0,1], harvest: [2,3,4] },
    { crop: 'Pearl Millet / Bajra', cropHi: 'बाजरा', icon: '🌾', sow: [5,6], grow: [6,7,8], harvest: [9,10] },
    { crop: 'Corn / Maize', cropHi: 'मक्का', icon: '🌽', sow: [2,3,4], grow: [4,5,6], harvest: [7,8] },
    { crop: 'Peanuts / Groundnut', cropHi: 'मूंगफली', icon: '🥜', sow: [5,6], grow: [6,7,8], harvest: [9,10] },
    { crop: 'Cotton', cropHi: 'कपास', icon: '☁️', sow: [5,6], grow: [6,7,8,9], harvest: [10,11] },
    { crop: 'Soybean', cropHi: 'सोयाबीन', icon: '🫘', sow: [5,6], grow: [6,7,8], harvest: [9,10] },
    { crop: 'Barley', cropHi: 'जौ', icon: '🌾', sow: [9,10], grow: [10,11,0], harvest: [1,2] },
    { crop: 'Chickpea (Gram/Chana)', cropHi: 'चना (छोला)', icon: '🌱', sow: [9,10,11], grow: [11,0,1], harvest: [2,3] },
    { crop: 'Lentil (Masoor)', cropHi: 'मसूर', icon: '🌱', sow: [9,10], grow: [10,11,0], harvest: [1,2] },
    { crop: 'Pigeon Pea (Arhar/Tur)', cropHi: 'अरहर (तुअर)', icon: '🌱', sow: [5,6], grow: [6,7,8,9,10], harvest: [11,0] },
    { crop: 'Green Gram (Moong)', cropHi: 'मूंग', icon: '🌱', sow: [2,3], grow: [4,5], harvest: [6] },
    { crop: 'Black Gram (Urad)', cropHi: 'उड़द', icon: '🌱', sow: [5,6], grow: [6,7,8], harvest: [9,10] },
    { crop: 'Sunflower', cropHi: 'सूरजमुखी', icon: '🌻', sow: [0,1], grow: [2,3], harvest: [4,5] },
    { crop: 'Onion', cropHi: 'प्याज़', icon: '🧅', sow: [9,10], grow: [11,0,1], harvest: [2,3] },
    { crop: 'Cabbage', cropHi: 'पत्तागोभी', icon: '🥬', sow: [8,9], grow: [10,11], harvest: [0,1] },
    { crop: 'Cauliflower', cropHi: 'फूलगोभी', icon: '🥦', sow: [8,9], grow: [10,11], harvest: [0,1] },
    { crop: 'Chili', cropHi: 'मिर्च', icon: '🌶️', sow: [5,6], grow: [7,8,9], harvest: [10,11] },
    { crop: 'Ginger', cropHi: 'अदरक', icon: '🫚', sow: [3,4], grow: [5,6,7,8,9,10], harvest: [11,0] },
    { crop: 'Turmeric', cropHi: 'हल्दी', icon: '✨', sow: [4,5], grow: [6,7,8,9,10,11], harvest: [0,1] },
    { crop: 'Banana', cropHi: 'केला', icon: '🍌', sow: [5,6], grow: [7,8,9,10,11,0,1,2], harvest: [3,4,5] },
    { crop: 'Mango', cropHi: 'आम', icon: '🥭', sow: [6,7], grow: [8,9,10,11,0,1,2], harvest: [3,4,5] },
    { crop: 'Orange', cropHi: 'संतरा', icon: '🍊', sow: [6,7], grow: [8,9,10,11,0,1], harvest: [2,3] },
    { crop: 'Grapes', cropHi: 'अंगूर', icon: '🍇', sow: [0,1], grow: [2,3,4,5,6,7,8,9,10,11], harvest: [1,2] },
    { crop: 'Tea', cropHi: 'चाय', icon: '🫖', sow: [9,10], grow: [11,0,1,2,3,4,5,6,7,8], harvest: [3,4,5,6,7,8,9] },
    { crop: 'Coffee', cropHi: 'कॉफ़ी', icon: '☕', sow: [5,6], grow: [7,8,9,10], harvest: [11,0,1] },
    { crop: 'Coconut', cropHi: 'नारियल', icon: '🥥', sow: [5,6], grow: [7,8,9,10,11,0,1,2,3,4], harvest: [0,1,2,3,4,5,6,7,8,9,10,11] },
    { crop: 'Jute', cropHi: 'जूट', icon: '🎋', sow: [2,3,4], grow: [4,5,6], harvest: [7,8] },
    { crop: 'Rubber', cropHi: 'रबर', icon: '🌿', sow: [5,6], grow: [7,8,9,10,11,0,1,2,3,4,5], harvest: [9,10,11,0] }
];

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function renderCropCalendar() {
    const container = document.getElementById('crop-calendar-grid');
    if (!container) return;
    container.innerHTML = '';

    // Header row with crop label spacer
    const headerRow = document.createElement('div');
    headerRow.className = 'cal-crop-row';
    const spacer = document.createElement('div');
    spacer.style.cssText = 'background: transparent;';
    headerRow.appendChild(spacer);
    monthNames.forEach(m => {
        const cell = document.createElement('div');
        cell.className = 'cal-header';
        cell.textContent = m;
        headerRow.appendChild(cell);
    });
    container.appendChild(headerRow);

    // Filter crop rows by page (17 crops per page)
    const startIdx = currentCropPage === 1 ? 0 : 17;
    const endIdx = currentCropPage === 1 ? 17 : 34;
    const activeCalendarCrops = cropCalendarData.slice(startIdx, endIdx);

    // Crop rows
    activeCalendarCrops.forEach(c => {
        const row = document.createElement('div');
        row.className = 'cal-crop-row';

        const label = document.createElement('div');
        label.className = 'cal-crop-label';
        label.innerHTML = `<span>${c.icon}</span> <span>${currentLang === 'hi' ? c.cropHi : c.crop}</span>`;
        row.appendChild(label);

        for (let m = 0; m < 12; m++) {
            const cell = document.createElement('div');
            cell.className = 'cal-month-cell';
            if (c.sow.includes(m)) cell.classList.add('sowing');
            else if (c.grow.includes(m)) cell.classList.add('growing');
            else if (c.harvest.includes(m)) cell.classList.add('harvest');
            cell.title = `${currentLang === 'hi' ? c.cropHi : c.crop} — ${monthNames[m]}`;
            row.appendChild(cell);
        }
        container.appendChild(row);
    });

    // Legend
    const legend = document.createElement('div');
    legend.className = 'cal-legend';
    legend.innerHTML = `
        <div class="cal-legend-item"><div class="cal-legend-dot sowing"></div><span>${currentLang === 'hi' ? 'बुवाई' : 'Sowing'}</span></div>
        <div class="cal-legend-item"><div class="cal-legend-dot growing"></div><span>${currentLang === 'hi' ? 'उगना' : 'Growing'}</span></div>
        <div class="cal-legend-item"><div class="cal-legend-dot harvest"></div><span>${currentLang === 'hi' ? 'कटाई' : 'Harvest'}</span></div>
    `;
    container.appendChild(legend);
}

// ==================== SOIL HEALTH ANALYZER ====================
function updateSoilSlider(param, value) {
    const el = document.getElementById(`soil-${param}-val`);
    if (el) el.innerText = value;
}

function analyzeSoil() {
    const ph = parseFloat(document.getElementById('soil-ph').value);
    const nitrogen = parseInt(document.getElementById('soil-nitrogen').value);
    const phosphorus = parseInt(document.getElementById('soil-phosphorus').value);
    const potassium = parseInt(document.getElementById('soil-potassium').value);

    const container = document.getElementById('soil-analysis-result');
    if (!container) return;

    // Evaluate statuses
    const getPhStatus = (v) => { if (v >= 6.0 && v <= 7.5) return 'good'; if (v >= 5.5 && v < 6.0 || v > 7.5 && v <= 8.0) return 'medium'; return 'poor'; };
    const getNStatus  = (v) => { if (v >= 100 && v <= 200) return 'good'; if (v >= 60 && v < 100 || v > 200 && v <= 250) return 'medium'; return 'poor'; };
    const getPStatus  = (v) => { if (v >= 30 && v <= 60) return 'good'; if (v >= 15 && v < 30 || v > 60) return 'medium'; return 'poor'; };
    const getKStatus  = (v) => { if (v >= 80 && v <= 140) return 'good'; if (v >= 40 && v < 80 || v > 140 && v <= 180) return 'medium'; return 'poor'; };

    const phSt = getPhStatus(ph);
    const nSt  = getNStatus(nitrogen);
    const pSt  = getPStatus(phosphorus);
    const kSt  = getKStatus(potassium);

    const statusLabel = (s, en, hi) => { const l = currentLang === 'hi' ? hi : en; return `<span class="soil-result-value soil-status-${s}">${l}</span>`; };
    const statusMap = { good: ['Optimal ✓', 'उत्तम ✓'], medium: ['Moderate ⚠', 'मध्यम ⚠'], poor: ['Deficient ✗', 'अपर्याप्त ✗'] };

    // Build recommendations
    let recs = [];
    if (ph < 6.0) recs.push(currentLang === 'hi' ? 'pH कम है — 2-4 टन/हेक्टेयर चूना (Lime) डालें।' : 'Low pH — Apply 2-4 tonnes/ha agricultural lime to correct acidity.');
    else if (ph > 7.5) recs.push(currentLang === 'hi' ? 'pH अधिक है — जिप्सम या सल्फर प्रयोग करें।' : 'High pH — Apply gypsum or elemental sulfur to lower alkalinity.');
    if (nSt === 'poor') recs.push(currentLang === 'hi' ? 'नाइट्रोजन की कमी — 20-40 kg/ha यूरिया/अमोनियम सल्फेट डालें।' : 'Low Nitrogen — Apply 20-40 kg/ha Urea or Ammonium Sulphate.');
    if (nSt === 'good' && nitrogen > 180) recs.push(currentLang === 'hi' ? 'नाइट्रोजन अधिक है — फसल जलने का खतरा, उर्वरक कम करें।' : 'High Nitrogen — Risk of crop burn, reduce N fertilizer application.');
    if (pSt === 'poor') recs.push(currentLang === 'hi' ? 'फॉस्फोरस कम — SSP या DAP (20-30 kg/ha) डालें।' : 'Low Phosphorus — Apply SSP or DAP at 20-30 kg/ha at sowing.');
    if (kSt === 'poor') recs.push(currentLang === 'hi' ? 'पोटाश की कमी — म्यूरेट ऑफ पोटाश (MOP) 30-40 kg/ha डालें।' : 'Low Potassium — Apply Muriate of Potash (MOP) at 30-40 kg/ha.');
    if (recs.length === 0) recs.push(currentLang === 'hi' ? 'मिट्टी की स्थिति उत्तम है! वर्तमान उर्वरक संतुलन बनाए रखें।' : 'Soil health is excellent! Maintain the current balanced fertilizer program.');

    const recHtml = recs.map(r => `<li>${r}</li>`).join('');

    container.innerHTML = `
        <div class="soil-result-grid">
            <div class="soil-result-item">
                <span class="soil-result-label">pH</span>
                ${statusLabel(phSt, statusMap[phSt][0], statusMap[phSt][1])}
                <span style="font-size:0.75rem;color:var(--text-muted);">${ph}</span>
            </div>
            <div class="soil-result-item">
                <span class="soil-result-label">${currentLang === 'hi' ? 'नाइट्रोजन (N)' : 'Nitrogen (N)'}</span>
                ${statusLabel(nSt, statusMap[nSt][0], statusMap[nSt][1])}
                <span style="font-size:0.75rem;color:var(--text-muted);">${nitrogen} mg/kg</span>
            </div>
            <div class="soil-result-item">
                <span class="soil-result-label">${currentLang === 'hi' ? 'फॉस्फोरस (P)' : 'Phosphorus (P)'}</span>
                ${statusLabel(pSt, statusMap[pSt][0], statusMap[pSt][1])}
                <span style="font-size:0.75rem;color:var(--text-muted);">${phosphorus} kg/ha</span>
            </div>
            <div class="soil-result-item">
                <span class="soil-result-label">${currentLang === 'hi' ? 'पोटाश (K)' : 'Potassium (K)'}</span>
                ${statusLabel(kSt, statusMap[kSt][0], statusMap[kSt][1])}
                <span style="font-size:0.75rem;color:var(--text-muted);">${potassium} kg/ha</span>
            </div>
        </div>
        <div class="soil-recommendation">
            <strong style="color:var(--primary-light);">${currentLang === 'hi' ? 'सिफारिशें:' : 'Recommendations:'}</strong>
            <ul style="margin-top:8px; padding-left:16px; line-height:1.8;">${recHtml}</ul>
        </div>
    `;
}

// ==================== DISEASE DIAGNOSIS ENGINE ====================
const diseaseDb = {
    wheat: [
        { nameEn: 'Wheat Rust (Brown/Yellow)', nameHi: 'गेहूँ का रतुआ (भूरा/पीला)', symptoms: ['yellow-spots', 'brown-powder', 'leaf-curl', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Apply Propiconazole 25% EC @ 500ml/ha or Tebuconazole 250 EW @ 750ml/ha. Apply at first sign of rust pustules.', treatmentHi: '<strong>उपचार:</strong> प्रोपिकोनाज़ोल 25% EC @ 500 मिली/हेक्टेयर या टेब्यूकोनाज़ोल 250 EW @ 750 मिली/हेक्टेयर का प्रयोग करें।' },
        { nameEn: 'Wheat Loose Smut', nameHi: 'गेहूँ का ढीला कण्डुआ', symptoms: ['black-powder', 'stunted-growth', 'no-grain'], treatmentEn: '<strong>Treatment:</strong> Seed treatment with Carboxin 37.5% + Thiram 37.5% DS @ 2.5g/kg seed before sowing.', treatmentHi: '<strong>उपचार:</strong> बुवाई से पहले कार्बोक्सिन 37.5% + थिरम 37.5% DS @ 2.5 ग्राम/किग्रा बीज से बीज उपचार करें।' },
        { nameEn: 'Aphid Infestation', nameHi: 'चेपा कीट का प्रकोप', symptoms: ['sticky-leaves', 'curled-leaves', 'yellowing', 'small-insects'], treatmentEn: '<strong>Treatment:</strong> Spray Imidacloprid 17.8% SL @ 150ml/ha or Dimethoate 30% EC @ 500ml/ha with 500L water.', treatmentHi: '<strong>उपचार:</strong> इमिडाक्लोप्रिड 17.8% SL @ 150 मिली/हेक्टेयर या डाइमेथोएट 30% EC @ 500 मिली/हेक्टेयर का प्रयोग करें।' }
    ],
    rice: [
        { nameEn: 'Blast Disease', nameHi: 'धान झुलसा रोग', symptoms: ['grey-lesions', 'diamond-spots', 'leaf-curl', 'brown-powder'], treatmentEn: '<strong>Treatment:</strong> Apply Tricyclazole 75% WP @ 500g/ha or Isoprothiolane 40% EC @ 1.5L/ha. Drain water from field.', treatmentHi: '<strong>उपचार:</strong> ट्राइसाइक्लाजोल 75% WP @ 500 ग्राम/हेक्टेयर या आइसोप्रोथियोलेन 40% EC @ 1.5 लीटर/हेक्टेयर का प्रयोग करें।' },
        { nameEn: 'Stem Borer', nameHi: 'तना छेदक कीट', symptoms: ['dead-heart', 'white-ear', 'holes-in-stem', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Apply Cartap Hydrochloride 4% GR @ 25kg/ha or Chlorantraniliprole 0.4% GR @ 10kg/ha in standing water.', treatmentHi: '<strong>उपचार:</strong> कार्टाप हाइड्रोक्लोराइड 4% GR @ 25 किग्रा/हेक्टेयर या क्लोरेंट्रानिलिप्रोल 0.4% GR @ 10 किग्रा/हेक्टेयर का प्रयोग करें।' },
        { nameEn: 'Bacterial Leaf Blight', nameHi: 'जीवाणु पर्ण अंगमारी', symptoms: ['water-soaked', 'yellowing', 'wilting', 'brown-edges'], treatmentEn: '<strong>Treatment:</strong> Apply Copper Oxychloride 50% WP @ 3g/L. Avoid excess nitrogen. Ensure proper drainage.', treatmentHi: '<strong>उपचार:</strong> कॉपर ऑक्सीक्लोराइड 50% WP @ 3 ग्राम/लीटर का प्रयोग करें। अधिक नाइट्रोजन से बचें और उचित जल निकासी सुनिश्चित करें।' }
    ],
    sugarcane: [
        { nameEn: 'Red Rot', nameHi: 'लाल सड़न रोग', symptoms: ['brown-edges', 'wilting', 'dead-heart', 'grey-lesions'], treatmentEn: '<strong>Treatment:</strong> Use disease-free setts. Treat setts with Carbendazim 50% WP @ 0.1% solution for 30 minutes before planting.', treatmentHi: '<strong>उपचार:</strong> रोगमुक्त बीज का प्रयोग करें। रोपाई से पहले 30 मिनट के लिए कार्बेन्डाजिम 50% WP @ 0.1% घोल में बीज भिगोएं।' },
        { nameEn: 'Stem Borer', nameHi: 'तना छेदक कीट', symptoms: ['dead-heart', 'holes-in-stem', 'stunted-growth', 'wilting'], treatmentEn: '<strong>Treatment:</strong> Apply Chlorantraniliprole 18.5% SC @ 150ml/ha or release Trichogramma parasitoids at 50,000/ha.', treatmentHi: '<strong>उपचार:</strong> क्लोरेंट्रानिलिप्रोल 18.5% SC @ 150 मिली/हेक्टेयर का प्रयोग करें।' }
    ],
    sesame: [
        { nameEn: 'Phytophthora Blight', nameHi: 'तिल का झुलसा रोग', symptoms: ['brown-edges', 'wilting', 'water-soaked'], treatmentEn: '<strong>Treatment:</strong> Apply Mancozeb 75% WP @ 2g/L at first appearance of the disease.', treatmentHi: '<strong>उपचार:</strong> रोग के पहले लक्षण दिखाई देने पर मैनकोजेब 75% WP @ 2 ग्राम/लीटर का प्रयोग करें।' },
        { nameEn: 'Phyllody Disease', nameHi: 'फाइलोडी रोग', symptoms: ['curled-leaves', 'stunted-growth', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Spray Dimethoate 30% EC @ 500ml/ha to control leafhopper vectors.', treatmentHi: '<strong>उपचार:</strong> लीफहॉपर वाहकों को नियंत्रित करने के लिए डाइमेथोएट 30% EC @ 500 मिली/हेक्टेयर का छिड़काव करें।' }
    ],
    mustard: [
        { nameEn: 'White Rust', nameHi: 'सफेद गेरूआ रोग', symptoms: ['white-powder', 'yellow-spots', 'leaf-curl', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Apply Metalaxyl 8% + Mancozeb 64% WP @ 2.5g/L at first appearance of pustules.', treatmentHi: '<strong>उपचार:</strong> गेरूआ के पहले लक्षण दिखने पर मेटालैक्सिल 8% + मैनकोजेब 64% WP @ 2.5 ग्राम/लीटर का प्रयोग करें।' },
        { nameEn: 'Aphid Infestation', nameHi: 'चेपा का प्रकोप', symptoms: ['sticky-leaves', 'small-insects', 'curled-leaves', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Spray Dimethoate 30% EC @ 500ml/ha or Oxydemeton methyl 25% EC @ 600ml/ha.', treatmentHi: '<strong>उपचार:</strong> डाइमेथोएट 30% EC @ 500 मिली/हेक्टेयर या ऑक्सीडेमेटन मिथाइल 25% EC @ 600 मिली/हेक्टेयर का प्रयोग करें।' }
    ],
    potato: [
        { nameEn: 'Late Blight', nameHi: 'पछेती झुलसा रोग', symptoms: ['brown-edges', 'water-soaked', 'grey-lesions', 'wilting'], treatmentEn: '<strong>Treatment:</strong> Spray Metalaxyl 8% + Mancozeb 64% WP @ 2.5g/L or Cymoxanil 8% + Mancozeb 64% @ 3g/L every 7 days.', treatmentHi: '<strong>उपचार:</strong> मेटालैक्सिल 8% + मैनकोजेब 64% WP @ 2.5 ग्राम/लीटर का हर 7 दिन में प्रयोग करें।' },
        { nameEn: 'Aphid & Virus', nameHi: 'चेपा और विषाणु रोग', symptoms: ['curled-leaves', 'yellowing', 'stunted-growth', 'small-insects'], treatmentEn: '<strong>Treatment:</strong> Use virus-free certified seed. Apply Imidacloprid 17.8% SL @ 200ml/ha to control aphid vectors.', treatmentHi: '<strong>उपचार:</strong> प्रमाणित रोगमुक्त बीज का प्रयोग करें। चेपा नियंत्रण के लिए इमिडाक्लोप्रिड 17.8% SL @ 200 मिली/हेक्टेयर डालें।' }
    ],
    tomato: [
        { nameEn: 'Fruit Borer', nameHi: 'फल छेदक कीट', symptoms: ['holes-in-fruit', 'wilting', 'holes-in-stem', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Apply Indoxacarb 14.5% SC @ 500ml/ha or Spinosad 45% SC @ 150ml/ha. Set pheromone traps.', treatmentHi: '<strong>उपचार:</strong> इंडोक्साकार्ब 14.5% SC @ 500 मिली/हेक्टेयर या स्पिनोसैड 45% SC @ 150 मिली/हेक्टेयर का प्रयोग करें।' },
        { nameEn: 'Early Blight', nameHi: 'अगेती झुलसा रोग', symptoms: ['brown-edges', 'yellow-spots', 'grey-lesions', 'leaf-curl'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2g/L or Chlorothalonil 75% WP @ 2g/L. Avoid overhead irrigation.', treatmentHi: '<strong>उपचार:</strong> मैनकोजेब 75% WP @ 2 ग्राम/लीटर या क्लोरोथैलोनिल 75% WP @ 2 ग्राम/लीटर का प्रयोग करें।' }
    ],
    bajra: [
        { nameEn: 'Downy Mildew / Green Ear', nameHi: 'मृदु रोमिल आसिता (हरा कान)', symptoms: ['white-powder', 'yellowing', 'stunted-growth', 'leaf-curl'], treatmentEn: '<strong>Treatment:</strong> Seed treatment with Metalaxyl 35 SD @ 6g/kg seed. Spray Mancozeb @ 2g/L.', treatmentHi: '<strong>उपचार:</strong> मेटालैक्सिल 35 SD @ 6 ग्राम/किग्रा बीज से बीज उपचार। मैनकोजेब @ 2 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Ergot Disease', nameHi: 'अरगट रोग', symptoms: ['sticky-leaves', 'brown-powder', 'no-grain'], treatmentEn: '<strong>Treatment:</strong> Immerse seed in 10% salt solution to remove sclerotia. Spray Carbendazim @ 1g/L.', treatmentHi: '<strong>उपचार:</strong> स्क्लेरोटिया हटाने के लिए बीज को 10% नमक के घोल में भिगोएं। कार्बेन्डाजिम @ 1 ग्राम/लीटर छिड़कें।' }
    ],
    corn: [
        { nameEn: 'Fall Armyworm', nameHi: 'स्पोडोप्टेरा फल छेदक', symptoms: ['holes-in-stem', 'grey-lesions', 'stunted-growth', 'dead-heart'], treatmentEn: '<strong>Treatment:</strong> Apply Emamectin Benzoate 5% SG @ 220g/ha or Spinetoram 11.7% SC @ 500ml/ha in the whorl.', treatmentHi: '<strong>उपचार:</strong> इमामेक्टिन बेंजोएट 5% SG @ 220 ग्राम/हेक्टेयर या स्पाइनेटोरम 11.7% SC @ 500 मिली/हेक्टेयर का प्रयोग करें।' },
        { nameEn: 'Leaf Blight', nameHi: 'पत्ती झुलसा रोग', symptoms: ['yellow-spots', 'brown-edges', 'grey-lesions', 'wilting'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2g/L or Zineb 75% WP @ 2.5g/L at 10 day intervals.', treatmentHi: '<strong>उपचार:</strong> मैनकोजेब 75% WP @ 2 ग्राम/लीटर या जिनेब 75% WP @ 2.5 ग्राम/लीटर का प्रयोग 10 दिन के अंतर पर करें।' }
    ],
    peanuts: [
        { nameEn: 'Tikka Leaf Spot', nameHi: 'टिक्का पत्ती धब्बा रोग', symptoms: ['yellow-spots', 'brown-edges', 'grey-lesions'], treatmentEn: '<strong>Treatment:</strong> Spray Carbendazim 50% WP @ 1g/L or Mancozeb 75% WP @ 2g/L. Maintain crop rotation.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर या मैनकोजेब 75% WP @ 2 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Collar Rot', nameHi: 'कॉलर रॉट', symptoms: ['wilting', 'water-soaked', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Seed treatment with Thiram + Carbendazim @ 3g/kg seed. Avoid waterlogging.', treatmentHi: '<strong>उपचार:</strong> थिरम + कार्बेन्डाजिम @ 3 ग्राम/किग्रा बीज से बीज उपचार करें। जलभराव से बचें।' }
    ],
    cotton: [
        { nameEn: 'Bollworm Attack', nameHi: 'बोलवॉर्म का प्रकोप', symptoms: ['holes-in-fruit', 'wilting', 'stunted-growth', 'dead-heart'], treatmentEn: '<strong>Treatment:</strong> Apply Spinosad 45% SC @ 100ml/ha or Indoxacarb 15.8% EC @ 333ml/ha. Set bollworm pheromone traps.', treatmentHi: '<strong>उपचार:</strong> स्पिनोसैड 45% SC @ 100 मिली/हेक्टेयर का प्रयोग करें। बोलवॉर्म फेरोमोन ट्रैप लगाएं।' },
        { nameEn: 'Whitefly Infestation', nameHi: 'सफेद मक्खी का प्रकोप', symptoms: ['small-insects', 'sticky-leaves', 'yellowing', 'curled-leaves'], treatmentEn: '<strong>Treatment:</strong> Apply Acetamiprid 20% SP @ 150g/ha or Diafenthiuron 50% WP @ 600g/ha. Use yellow sticky traps.', treatmentHi: '<strong>उपचार:</strong> एसिटामिप्रिड 20% SP @ 150 ग्राम/हेक्टेयर का प्रयोग करें। पीले चिपचिपे ट्रैप लगाएं।' }
    ],
    soybean: [
        { nameEn: 'Yellow Mosaic Virus', nameHi: 'पीला मोज़ेक विषाणु', symptoms: ['yellowing', 'yellow-spots', 'stunted-growth', 'curled-leaves'], treatmentEn: '<strong>Treatment:</strong> No direct cure. Control whitefly vector with Imidacloprid @ 200ml/ha. Use resistant varieties.', treatmentHi: '<strong>उपचार:</strong> कोई सीधा उपचार नहीं। सफेद मक्खी नियंत्रण के लिए इमिडाक्लोप्रिड @ 200 मिली/हेक्टेयर। प्रतिरोधी किस्मों का उपयोग करें।' },
        { nameEn: 'Girdle Beetle', nameHi: 'गर्डल बीटल', symptoms: ['holes-in-stem', 'wilting', 'dead-heart', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Spray Chlorpyriphos 20% EC @ 1.5L/ha or Quinalphos 25% EC @ 1.5L/ha at 15-20 days after germination.', treatmentHi: '<strong>उपचार:</strong> अंकुरण के 15-20 दिन बाद क्लोरपायरीफॉस 20% EC @ 1.5 लीटर/हेक्टेयर का प्रयोग करें।' }
    ],
    barley: [
        { nameEn: 'Net Blotch', nameHi: 'नेट ब्लॉच', symptoms: ['grey-lesions', 'yellow-spots', 'brown-edges'], treatmentEn: '<strong>Treatment:</strong> Apply Tebuconazole @ 750ml/ha. Use certified disease-free seeds.', treatmentHi: '<strong>उपचार:</strong> टेबुकोनाज़ोल @ 750 मिली/हेक्टेयर का प्रयोग करें। प्रमाणित रोगमुक्त बीजों का उपयोग करें।' },
        { nameEn: 'Barley Rust', nameHi: 'जौ का रतुआ', symptoms: ['yellow-spots', 'brown-powder', 'leaf-curl'], treatmentEn: '<strong>Treatment:</strong> Spray Propiconazole 25% EC @ 500ml/ha at first appearance of symptoms.', treatmentHi: '<strong>उपचार:</strong> लक्षणों के पहली बार दिखाई देने पर प्रोपिकोनाज़ोल 25% EC @ 500 मिली/हेक्टेयर का छिड़काव करें।' }
    ],
    chickpea: [
        { nameEn: 'Fusarium Wilt', nameHi: 'चना उकठा रोग', symptoms: ['wilting', 'yellowing', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Seed treatment with Trichoderma viride @ 4g/kg seed. Follow crop rotation with non-host crops.', treatmentHi: '<strong>उपचार:</strong> ट्राइकोडर्मा विरिड @ 4 ग्राम/किग्रा बीज से बीज उपचार। गैर-मेजबान फसलों के साथ फसल चक्र अपनाएं।' },
        { nameEn: 'Pod Borer', nameHi: 'फली छेदक कीट', symptoms: ['holes-in-fruit', 'small-insects', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Spray Spinosad 45% SC @ 200ml/ha or Chlorantraniliprole 18.5% SC @ 150ml/ha.', treatmentHi: '<strong>उपचार:</strong> स्पिनोसैड 45% SC @ 200 मिली/हेक्टेयर या क्लोरेंट्रानिलिप्रोल 18.5% SC @ 150 मिली/हेक्टेयर छिड़कें।' }
    ],
    lentil: [
        { nameEn: 'Lentil Rust', nameHi: 'मसूर का रतुआ', symptoms: ['brown-powder', 'yellow-spots', 'leaf-curl'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2g/L or Hexaconazole 5% EC @ 1ml/L.', treatmentHi: '<strong>उपचार:</strong> मैनकोजेब 75% WP @ 2 ग्राम/लीटर या हेक्साकोनाज़ोल 5% EC @ 1 मिली/लीटर का छिड़काव करें।' },
        { nameEn: 'Vascular Wilt', nameHi: 'उकठा रोग', symptoms: ['wilting', 'yellowing', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Seed treatment with Carbendazim + Mancozeb @ 3g/kg seed. Ensure well-drained soils.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम + मैनकोजेब @ 3 ग्राम/किग्रा बीज से बीज उपचार। मिट्टी की जल-निकासी सुनिश्चित करें।' }
    ],
    pigeonpea: [
        { nameEn: 'Fusarium Wilt', nameHi: 'अरहर का उकठा', symptoms: ['wilting', 'yellowing', 'stunted-growth', 'brown-edges'], treatmentEn: '<strong>Treatment:</strong> Grow wilt-resistant varieties. Treat seeds with Trichoderma harzianum @ 10g/kg seed.', treatmentHi: '<strong>उपचार:</strong> उकठा-प्रतिरोधी किस्में उगाएं। बीजों का ट्राइकोडर्मा हर्ज़ियानम @ 10 ग्राम/किग्रा से उपचार करें।' },
        { nameEn: 'Pod Fly', nameHi: 'फली मक्खी', symptoms: ['holes-in-fruit', 'small-insects', 'no-grain'], treatmentEn: '<strong>Treatment:</strong> Spray Indoxacarb 14.5% SC @ 300ml/ha or Monocrotophos 36% SL @ 1L/ha at flowering stage.', treatmentHi: '<strong>उपचार:</strong> पुष्पन अवस्था में इंडोक्साकार्ब 14.5% SC @ 300 मिली/हेक्टेयर या मोनोक्रोटोफॉस 36% SL @ 1 लीटर/हेक्टेयर का छिड़काव करें।' }
    ],
    greengram: [
        { nameEn: 'Yellow Mosaic Disease', nameHi: 'पीला मोज़ेक रोग', symptoms: ['yellowing', 'yellow-spots', 'curled-leaves'], treatmentEn: '<strong>Treatment:</strong> Spray Thiamethoxam 25% WG @ 100g/ha to check whitefly vectors. Roguing of early infected plants.', treatmentHi: '<strong>उपचार:</strong> सफेद मक्खी को नियंत्रित करने के लिए थायामेथोक्सम 25% WG @ 100 ग्राम/हेक्टेयर का छिड़काव करें।' },
        { nameEn: 'Powdery Mildew', nameHi: 'चूर्णी फफूंद', symptoms: ['white-powder', 'leaf-curl', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Spray Carbendazim 50% WP @ 1g/L or wettable Sulphur @ 3g/L.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर या घुलनशील सल्फर @ 3 ग्राम/लीटर का छिड़काव करें।' }
    ],
    blackgram: [
        { nameEn: 'Leaf Spot', nameHi: 'पत्ती धब्बा', symptoms: ['yellow-spots', 'brown-edges', 'grey-lesions'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2g/L or Carbendazim 50% WP @ 1g/L at 10-14 days intervals.', treatmentHi: '<strong>उपचार:</strong> 10-14 दिनों के अंतराल पर मैनकोजेब 75% WP @ 2 ग्राम/लीटर या कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Powdery Mildew', nameHi: 'चूर्णी फफूंद', symptoms: ['white-powder', 'leaf-curl', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Apply Hexaconazole 5% EC @ 1ml/L or spray Propiconazole 25% EC @ 1ml/L.', treatmentHi: '<strong>उपचार:</strong> हेक्साकोनाज़ोल 5% EC @ 1 मिली/लीटर या प्रोपिकोनाज़ोल 25% EC @ 1 मिली/लीटर का प्रयोग करें।' }
    ],
    sunflower: [
        { nameEn: 'Alternaria Leaf Blight', nameHi: 'अल्टरनेरिया पत्ता झुलसा', symptoms: ['yellow-spots', 'brown-edges', 'grey-lesions'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride @ 3g/L.', treatmentHi: '<strong>उपचार:</strong> मैनकोजेब 75% WP @ 2.5 ग्राम/लीटर या कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर छिड़कें।' },
        { nameEn: 'Head Rot', nameHi: 'फूल सड़न रोग', symptoms: ['water-soaked', 'wilting', 'no-grain'], treatmentEn: '<strong>Treatment:</strong> Spray Carbendazim @ 1g/L in the center of flower head during bud development.', treatmentHi: '<strong>उपचार:</strong> कली बनते समय फूल के मध्य में कार्बेन्डाजिम @ 1 ग्राम/लीटर का छिड़काव करें।' }
    ],
    onion: [
        { nameEn: 'Purple Blotch', nameHi: 'बैंगनी धब्बा रोग', symptoms: ['grey-lesions', 'water-soaked', 'yellow-spots', 'brown-edges'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2.5g/L or Copper Oxychloride @ 3g/L with adhesive agent.', treatmentHi: '<strong>उपचार:</strong> चिपकने वाले पदार्थ के साथ मैनकोजेब 75% WP @ 2.5 ग्राम/लीटर या कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर छिड़कें।' },
        { nameEn: 'Onion Thrips', nameHi: 'प्याज़ के थ्रिप्स', symptoms: ['sticky-leaves', 'yellowing', 'small-insects', 'curled-leaves'], treatmentEn: '<strong>Treatment:</strong> Apply Fipronil 5% SC @ 1.5ml/L or Spinosad 45% SC @ 1ml/3L water.', treatmentHi: '<strong>उपचार:</strong> फिप्रोनिल 5% SC @ 1.5 मिली/लीटर या स्पिनोसैड 45% SC @ 1 मिली/3 लीटर पानी का छिड़काव करें।' }
    ],
    cabbage: [
        { nameEn: 'Black Rot', nameHi: 'काली सड़न रोग', symptoms: ['brown-edges', 'wilting', 'yellowing', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Spray Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 1g/10L water.', treatmentHi: '<strong>उपचार:</strong> कॉपर ऑक्सीक्लोराइड 50% WP @ 2.5 ग्राम/लीटर + स्ट्रेप्टोसाइक्लिन @ 1 ग्राम/10 लीटर पानी छिड़कें।' },
        { nameEn: 'Diamondback Moth (DBM)', nameHi: 'हीरा पीठ पतंगा (DBM)', symptoms: ['holes-in-stem', 'holes-in-fruit', 'small-insects'], treatmentEn: '<strong>Treatment:</strong> Spray Spinosad 45% SC @ 150ml/ha or Chlorantraniliprole 18.5% SC @ 150ml/ha.', treatmentHi: '<strong>उपचार:</strong> स्पिनोसैड 45% SC @ 150 मिली/हेक्टेयर या क्लोरेंट्रानिलिप्रोल 18.5% SC @ 150 मिली/हेक्टेयर का छिड़काव करें।' }
    ],
    cauliflower: [
        { nameEn: 'Downy Mildew', nameHi: 'मृदु रोमिल आसिता', symptoms: ['white-powder', 'yellow-spots', 'leaf-curl'], treatmentEn: '<strong>Treatment:</strong> Spray Metalaxyl 8% + Mancozeb 64% WP @ 2g/L or Copper Oxychloride @ 2.5g/L.', treatmentHi: '<strong>उपचार:</strong> मेटालैक्सिल 8% + मैनकोजेब 64% WP @ 2 ग्राम/लीटर या कॉपर ऑक्सीक्लोराइड @ 2.5 ग्राम/लीटर छिड़कें।' },
        { nameEn: 'Sclerotinia Stem Rot', nameHi: 'सड़ांध रोग', symptoms: ['water-soaked', 'wilting', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Drench soil with Carbendazim 50% WP @ 1g/L. Keep soil well-aerated.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर से मृदा उपचार करें। मिट्टी को हवादार रखें।' }
    ],
    chili: [
        { nameEn: 'Anthracnose & Fruit Rot', nameHi: 'एन्थ्रेक्नोज और फल सड़न', symptoms: ['yellow-spots', 'brown-edges', 'wilting', 'holes-in-fruit'], treatmentEn: '<strong>Treatment:</strong> Spray Azoxystrobin 25% SC @ 1ml/L or Copper Oxychloride @ 3g/L. Collect and destroy affected pods.', treatmentHi: '<strong>उपचार:</strong> एजोक्सीस्ट्रोबिन 25% SC @ 1 मिली/लीटर या कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Chili Leaf Curl Virus', nameHi: 'मिर्च का पर्ण कुंचन रोग', symptoms: ['curled-leaves', 'stunted-growth', 'small-insects', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Control insect vectors (thrips/whiteflies) using Imidacloprid 17.8% SL @ 0.5ml/L.', treatmentHi: '<strong>उपचार:</strong> इमिडाक्लोप्रिड 17.8% SL @ 0.5 मिली/लीटर का उपयोग करके कीट वाहकों (थ्रिप्स/सफेद मक्खी) को नियंत्रित करें।' }
    ],
    ginger: [
        { nameEn: 'Soft Rot / Rhizome Rot', nameHi: 'नरम सड़न / कंद सड़न', symptoms: ['water-soaked', 'wilting', 'yellowing', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Soil drenching with Metalaxyl @ 2.5g/L or Boardeaux mixture 1%. Ensure proper sub-soil drainage.', treatmentHi: '<strong>उपचार:</strong> मेटालैक्सिल @ 2.5 ग्राम/लीटर या बोर्डो मिश्रण 1% के साथ मृदा उपचार करें। जल-निकासी का ध्यान रखें।' },
        { nameEn: 'Leaf Spot', nameHi: 'पत्ती धब्बा रोग', symptoms: ['yellow-spots', 'brown-edges', 'grey-lesions'], treatmentEn: '<strong>Treatment:</strong> Spray Mancozeb 75% WP @ 2g/L or Carbendazim @ 1g/L. Avoid shadow overgrowth.', treatmentHi: '<strong>उपचार:</strong> मैनकोजेब 75% WP @ 2 ग्राम/लीटर या कार्बेन्डाजिम @ 1 ग्राम/लीटर का छिड़काव करें।' }
    ],
    turmeric: [
        { nameEn: 'Rhizome Rot', nameHi: 'कंद सड़न रोग', symptoms: ['water-soaked', 'wilting', 'yellowing', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Seed rhizome treatment with Mancozeb @ 2.5g/L for 30 minutes before planting. Drench infected spots.', treatmentHi: '<strong>उपचार:</strong> बुवाई से पहले 30 मिनट के लिए मैनकोजेब @ 2.5 ग्राम/लीटर से बीज उपचार करें। संक्रमित स्थानों का उपचार करें।' },
        { nameEn: 'Leaf Spot', nameHi: 'पत्ती धब्बा रोग', symptoms: ['yellow-spots', 'grey-lesions', 'brown-edges'], treatmentEn: '<strong>Treatment:</strong> Spray Carbendazim 50% WP @ 1g/L or Propiconazole 25% EC @ 1ml/L.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर या प्रोपिकोनाज़ोल 25% EC @ 1 मिली/लीटर का छिड़काव करें।' }
    ],
    banana: [
        { nameEn: 'Sigatoka Leaf Spot', nameHi: 'सिगाटोका पत्ती धब्बा', symptoms: ['grey-lesions', 'yellow-spots', 'brown-edges', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Spray Propiconazole 25% EC @ 1ml/L or Carbendazim @ 1g/L with wetting agent.', treatmentHi: '<strong>उपचार:</strong> चिपकने वाले एजेंट के साथ प्रोपिकोनाज़ोल 25% EC @ 1 मिली/लीटर या कार्बेन्डाजिम @ 1 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Panama Wilt', nameHi: 'पनामा मुरझान रोग', symptoms: ['yellowing', 'wilting', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Soil application of Trichoderma viride. Uproot and burn severely infected pseudostems.', treatmentHi: '<strong>उपचार:</strong> ट्राइकोडर्मा विरिड का मिट्टी में प्रयोग। गंभीर रूप से संक्रमित तनों को उखाड़ कर जला दें।' }
    ],
    mango: [
        { nameEn: 'Mango Anthracnose', nameHi: 'आम का एन्थ्रेक्नोज रोग', symptoms: ['grey-lesions', 'yellow-spots', 'brown-edges', 'holes-in-fruit'], treatmentEn: '<strong>Treatment:</strong> Spray Carbendazim 50% WP @ 1g/L or Copper Oxychloride @ 3g/L. Prune dead twigs.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर या कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Mango Hopper Infestation', nameHi: 'आम के भुनगे का प्रकोप', symptoms: ['sticky-leaves', 'small-insects', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Spray Imidacloprid 17.8% SL @ 3ml/10L or Thiamethoxam @ 2g/10L water at panicle emergence.', treatmentHi: '<strong>उपचार:</strong> बौर आने के समय इमिडाक्लोप्रिड 17.8% SL @ 3 मिली/10 लीटर या थायामेथोक्सम @ 2 ग्राम/10 लीटर पानी का छिड़काव करें।' }
    ],
    orange: [
        { nameEn: 'Citrus Canker', nameHi: 'सिट्रस कैंकर', symptoms: ['grey-lesions', 'yellow-spots', 'brown-edges'], treatmentEn: '<strong>Treatment:</strong> Spray Streptocycline @ 1g/10L + Copper Oxychloride @ 3g/L. Prune infected twigs.', treatmentHi: '<strong>उपचार:</strong> स्ट्रेप्टोसाइक्लिन @ 1 ग्राम/10 लीटर + कॉपर ऑक्सीक्लोराइड @ 3 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Citrus Leaf Miner', nameHi: 'सिट्रस लीफ माइनर', symptoms: ['curled-leaves', 'sticky-leaves', 'small-insects'], treatmentEn: '<strong>Treatment:</strong> Apply Imidacloprid 17.8% SL @ 5ml/10L or Profenofos @ 2ml/L on new flushes.', treatmentHi: '<strong>उपचार:</strong> नई पत्तियों पर इमिडाक्लोप्रिड 17.8% SL @ 5 मिली/10 लीटर या प्रोफेनोफॉस @ 2 मिली/लीटर डालें।' }
    ],
    grapes: [
        { nameEn: 'Powdery Mildew', nameHi: 'चूर्णी फफूंद', symptoms: ['white-powder', 'leaf-curl', 'no-grain'], treatmentEn: '<strong>Treatment:</strong> Spray wettable Sulphur 80% WP @ 3g/L or Dinocap 48% EC @ 1ml/L at intervals.', treatmentHi: '<strong>उपचार:</strong> घुलनशील सल्फर 80% WP @ 3 ग्राम/लीटर या डाइनोकैप 48% EC @ 1 मिली/लीटर का छिड़काव करें।' },
        { nameEn: 'Downy Mildew', nameHi: 'मृदु रोमिल आसिता', symptoms: ['water-soaked', 'yellow-spots', 'white-powder'], treatmentEn: '<strong>Treatment:</strong> Spray Boardeaux mixture 1% or Metalaxyl + Mancozeb @ 2g/L. Keep canopy well pruned.', treatmentHi: '<strong>उपचार:</strong> बोर्डो मिश्रण 1% या मेटालैक्सिल + मैनकोजेब @ 2 ग्राम/लीटर छिड़कें। छंटाई का ध्यान रखें।' }
    ],
    tea: [
        { nameEn: 'Blister Blight', nameHi: 'फफोला झुलसा रोग', symptoms: ['grey-lesions', 'water-soaked', 'leaf-curl'], treatmentEn: '<strong>Treatment:</strong> Spray Hexaconazole 5% EC @ 200ml/ha + Copper Oxychloride @ 210g/ha.', treatmentHi: '<strong>उपचार:</strong> हेक्साकोनाज़ोल 5% EC @ 200 मिली/हेक्टेयर + कॉपर ऑक्सीक्लोराइड @ 210 ग्राम/हेक्टेयर का प्रयोग करें।' },
        { nameEn: 'Red Spider Mite', nameHi: 'लाल मकड़ी का प्रकोप', symptoms: ['yellowing', 'small-insects', 'sticky-leaves'], treatmentEn: '<strong>Treatment:</strong> Spray Ethion 50% EC @ 1.5ml/L or Fenazaquin 10% EC @ 1ml/L.', treatmentHi: '<strong>उपचार:</strong> इथियान 50% EC @ 1.5 मिली/लीटर या फेनाज़ाक्विन 10% EC @ 1 मिली/लीटर का छिड़काव करें।' }
    ],
    coffee: [
        { nameEn: 'Coffee Leaf Rust', nameHi: 'कॉफ़ी गेरूआ', symptoms: ['yellow-spots', 'brown-powder', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Spray Boardeaux mixture 0.5% or Triadimefon 25% WP @ 1g/L.', treatmentHi: '<strong>उपचार:</strong> बोर्डो मिश्रण 0.5% या ट्रायडाइमेफोन 25% WP @ 1 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Coffee White Stem Borer', nameHi: 'सफेद तना छेदक', symptoms: ['holes-in-stem', 'wilting', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Swab the main stem and thick primaries with Chlorpyriphos 20% EC @ 2ml/L.', treatmentHi: '<strong>उपचार:</strong> मुख्य तने और मोटी शाखाओं पर क्लोरपायरीफॉस 20% EC @ 2 मिली/लीटर लगाएं।' }
    ],
    coconut: [
        { nameEn: 'Bud Rot', nameHi: 'कली सड़न रोग', symptoms: ['wilting', 'yellowing', 'water-soaked'], treatmentEn: '<strong>Treatment:</strong> Apply Boardeaux paste on cut surface after removing infected parts. Apply Trichoderma.', treatmentHi: '<strong>उपचार:</strong> संक्रमित भागों को हटाने के बाद कटी हुई सतह पर बोर्डो पेस्ट लगाएं। ट्राइकोडर्मा डालें।' },
        { nameEn: 'Rhinoceros Beetle', nameHi: 'गेंडा भृंग', symptoms: ['holes-in-stem', 'stunted-growth', 'small-insects'], treatmentEn: '<strong>Treatment:</strong> Set Rhinolure pheromone traps @ 2/ha. Apply Carbaryl 10% dust + sand in leaf axils.', treatmentHi: '<strong>उपचार:</strong> राइनोल्योर फेरोमोन ट्रैप लगाएं। पत्तियों के कक्षों में कार्बारिल 10% धूल + रेत का मिश्रण डालें।' }
    ],
    jute: [
        { nameEn: 'Stem Rot', nameHi: 'तना सड़न रोग', symptoms: ['holes-in-stem', 'grey-lesions', 'wilting'], treatmentEn: '<strong>Treatment:</strong> Spray Carbendazim 50% WP @ 1g/L or Mancozeb @ 2g/L. Ensure seeds are treated.', treatmentHi: '<strong>उपचार:</strong> कार्बेन्डाजिम 50% WP @ 1 ग्राम/लीटर या मैनकोजेब @ 2 ग्राम/लीटर का छिड़काव करें।' },
        { nameEn: 'Jute Semilooper', nameHi: 'जूट सेमीलूपर सुंडी', symptoms: ['holes-in-stem', 'small-insects', 'stunted-growth'], treatmentEn: '<strong>Treatment:</strong> Spray Profenofos 50% EC @ 2ml/L or Cypermethrin @ 1ml/L.', treatmentHi: '<strong>उपचार:</strong> प्रोफेनोफॉस 50% EC @ 2 मिली/लीटर या साइपरमेथ्रिन @ 1 मिली/लीटर का छिड़काव करें।' }
    ],
    rubber: [
        { nameEn: 'Abnormal Leaf Fall', nameHi: 'असामान्य पर्णपात रोग', symptoms: ['water-soaked', 'wilting', 'stunted-growth', 'yellowing'], treatmentEn: '<strong>Treatment:</strong> Spray Boardeaux mixture 1% or Copper Oxychloride in oil dispersion before monsoons.', treatmentHi: '<strong>उपचार:</strong> मानसून से पहले बोर्डो मिश्रण 1% या तेल में फैले कॉपर ऑक्सीक्लोराइड का छिड़काव करें।' },
        { nameEn: 'Pink Disease', nameHi: 'गुलाबी रोग', symptoms: ['white-powder', 'brown-edges', 'wilting'], treatmentEn: '<strong>Treatment:</strong> Apply Bordeaux paste 10% or Carbendazim paste on affected bark regions.', treatmentHi: '<strong>उपचार:</strong> प्रभावित छाल पर बोर्डो पेस्ट 10% या कार्बेन्डाजिम पेस्ट लगाएं।' }
    ]
};

const allSymptoms = [
    { id: 'yellow-spots', en: '🟡 Yellow Spots', hi: '🟡 पीले धब्बे' },
    { id: 'brown-edges', en: '🟤 Brown Leaf Edges', hi: '🟤 पत्तियों के भूरे किनारे' },
    { id: 'white-powder', en: '⬜ White Powder/Coating', hi: '⬜ सफेद चूर्ण' },
    { id: 'brown-powder', en: '🟫 Brown/Orange Powder', hi: '🟫 भूरा/नारंगी चूर्ण' },
    { id: 'grey-lesions', en: '🩶 Grey/Dark Lesions', hi: '🩶 धूसर/काले घाव' },
    { id: 'water-soaked', en: '💧 Water-soaked Patches', hi: '💧 पानी से भीगे धब्बे' },
    { id: 'curled-leaves', en: '🌀 Curled/Deformed Leaves', hi: '🌀 मुड़ी/विकृत पत्तियां' },
    { id: 'yellowing', en: '🌿 General Yellowing', hi: '🌿 पत्तियों का पीलापन' },
    { id: 'wilting', en: '😔 Plant Wilting', hi: '😔 पौधे का मुरझाना' },
    { id: 'stunted-growth', en: '⬇️ Stunted Growth', hi: '⬇️ रुकी हुई बढ़वार' },
    { id: 'dead-heart', en: '💀 Dead Heart (Central Shoot)', hi: '💀 मृत ह्रदय (केंद्रीय तना)' },
    { id: 'holes-in-stem', en: '🕳️ Holes in Stem', hi: '🕳️ तने में छेद' },
    { id: 'holes-in-fruit', en: '🕳️ Holes in Fruit/Boll', hi: '🕳️ फल/टिंडे में छेद' },
    { id: 'small-insects', en: '🐛 Small Insects Visible', hi: '🐛 छोटे कीड़े दिखना' },
    { id: 'sticky-leaves', en: '🍯 Sticky/Honeydew on Leaves', hi: '🍯 पत्तियों पर चिपचिपापन' },
    { id: 'no-grain', en: '🌾 No Grain Formation', hi: '🌾 दाना नहीं बनना' }
];

let selectedSymptoms = [];

function renderDiseaseSymptoms() {
    selectedSymptoms = [];
    const container = document.getElementById('symptom-pills-container');
    const diagResult = document.getElementById('diagnosis-result');
    if (!container) return;
    if (diagResult) diagResult.innerHTML = '';
    container.innerHTML = '';
    allSymptoms.forEach(s => {
        const pill = document.createElement('div');
        pill.className = 'symptom-pill';
        pill.innerText = currentLang === 'hi' ? s.hi : s.en;
        pill.dataset.id = s.id;
        pill.addEventListener('click', () => {
            pill.classList.toggle('selected');
            if (pill.classList.contains('selected')) {
                selectedSymptoms.push(s.id);
            } else {
                selectedSymptoms = selectedSymptoms.filter(x => x !== s.id);
            }
        });
        container.appendChild(pill);
    });
    lucide.createIcons();
}

function runDiseaseDiagnosis() {
    const crop = document.getElementById('disease-crop-select').value;
    const result = document.getElementById('diagnosis-result');
    if (!result) return;

    if (selectedSymptoms.length === 0) {
        result.innerHTML = `<div class="no-diagnosis-msg">${currentLang === 'hi' ? '⚠️ कृपया कम से कम एक लक्षण चुनें।' : '⚠️ Please select at least one symptom to diagnose.'}</div>`;
        return;
    }

    const diseases = diseaseDb[crop] || [];
    // Score each disease by matched symptoms
    const scored = diseases.map(d => {
        const matched = selectedSymptoms.filter(s => d.symptoms.includes(s));
        const score = matched.length / d.symptoms.length;
        return { ...d, matched, score };
    }).filter(d => d.matched.length > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
        result.innerHTML = `<div class="no-diagnosis-msg">${currentLang === 'hi' ? '✅ चुने गए लक्षणों से कोई ज्ञात रोग नहीं मिला। किसी कृषि अधिकारी से परामर्श लें।' : '✅ No matching disease found for selected symptoms. Consult your local agriculture officer.'}</div>`;
        return;
    }

    result.innerHTML = scored.map((d, i) => {
        const name = currentLang === 'hi' ? d.nameHi : d.nameEn;
        const pct = Math.round(d.score * 100);
        const matchClass = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
        const matchLabel = pct >= 70 ? (currentLang === 'hi' ? 'उच्च संभावना' : 'High Match') : pct >= 40 ? (currentLang === 'hi' ? 'मध्यम संभावना' : 'Possible Match') : (currentLang === 'hi' ? 'कम संभावना' : 'Low Match');
        const matchedNames = d.matched.map(sid => { const s = allSymptoms.find(x => x.id === sid); return s ? (currentLang === 'hi' ? s.hi : s.en) : sid; }).join(', ');
        const treatment = currentLang === 'hi' ? d.treatmentHi : d.treatmentEn;
        return `
            <div class="diagnosis-disease-card ${matchClass}-match" style="animation-delay:${i*0.1}s">
                <div class="diag-disease-header">
                    <span class="diag-disease-name">${name}</span>
                    <span class="diag-match-badge ${matchClass}">${matchLabel} (${pct}%)</span>
                </div>
                <div class="diag-symptoms-matched">${currentLang === 'hi' ? 'मिलान लक्षण:' : 'Matched symptoms:'} ${matchedNames}</div>
                <div class="diag-treatment">${treatment}</div>
            </div>`;
    }).join('');
    lucide.createIcons();
}
