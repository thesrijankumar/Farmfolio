import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, Languages, Mic, MicOff, Volume2, Square } from "lucide-react";
import { api, type LandReport } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Shell } from "../components/farmfolio/Shell";
import { CountUp } from "../components/farmfolio/CountUp";
import { getCurrentReport } from "../lib/report-store";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

type Lang = "en" | "hi" | "mr" | "ta" | "te";



const TRANSLATIONS = {
  en: {
    loading: "Loading report…",
    fieldReport: "Field report",
    session: "Session",
    climateNasa: "Climate · NASA POWER",
    temperature: "Temperature",
    rainfall: "Rainfall",
    humidity: "Humidity",
    solarRadiation: "Solar radiation",
    windSpeed: "Wind speed",
    soilWaterNasa: "Soil & Water · NASA POWER",
    surfaceMoisture: "Surface soil moisture",
    rootMoisture: "Root zone moisture",
    evapotranspiration: "Evapotranspiration",
    dewPoint: "Dew point",
    frostDays: "Frost days / year",
    surfaceNote: "0–1 scale (top layer)",
    rootNote: "0–1 scale (root zone)",
    evapoNote: "Water lost from soil + plants",
    dewNote: "Moisture condensation threshold",
    frostNote: "Average annual frost days",
    fieldNote: "Field note",
    agronomyAssistant: "Farmfolio agronomy assistant",
    vegIndexNdvi: "Vegetation index · NDVI · Sentinel-2",
    nitrogenChloro: "Nitrogen & Chlorophyll · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE and chlorophyll index are satellite proxies for leaf nitrogen content (industry standard)",
    ndreProxy: "NDRE — Nitrogen proxy",
    chlorophyllIndex: "Chlorophyll index (Red Edge)",
    chloroDesc: "Higher = more chlorophyll = more nitrogen uptake",
    evi: "EVI — Enhanced vegetation",
    eviDesc: "Less affected by atmosphere & clouds than NDVI",
    waterMoistureStress: "Water & Moisture Stress · Sentinel-2",
    ndwi: "NDWI — Canopy water content",
    moistureStressIdx: "Moisture stress index (B8A/B11)",
    askAgronomist: "Ask the agronomist",
    followUp: "Follow up on this report.",
    noData: "No data available",
    bare: "0.0 · bare",
    sparse: "0.3 · sparse",
    healthy: "0.6 · healthy",
    denseCanopy: "0.9 · dense canopy",
    min: "Min",
    mean: "Mean",
    max: "Max",
    deficient: "0.0 · deficient",
    adequate: "0.25 · adequate",
    optimal: "0.45+ · optimal",
    noQuestions: "No questions yet. Ask anything about this field — planting windows, water balance, crop suitability, NDVI trend.",
    you: "You",
    thinking: "Thinking…",
    askPlaceholder: "Ask a question about this field…",
    askBtn: "Ask",
    suggested: "Suggested",
    sug1: "Which crops would suit this climate?",
    sug2: "Is irrigation likely necessary?",
    sug3: "What does the NDVI trend suggest right now?",
    langToggle: "हिन्दी",
    micBtn: "Mic",
    listening: "Listening…",
    micNotSupported: "Voice input not supported in this browser",
    readAloud: "Read aloud",
    stopReading: "Stop",
    noHindiVoice: "Hindi voice not available on this device",
    translating: "Generating Hindi summary…",
  },
  hi: {
    loading: "रिपोर्ट लोड हो रही है...",
    fieldReport: "खेत रिपोर्ट",
    session: "सत्र",
    climateNasa: "जलवायु · NASA POWER",
    temperature: "तापमान",
    rainfall: "वर्षा",
    humidity: "नमी",
    solarRadiation: "सौर विकिरण",
    windSpeed: "हवा की गति",
    soilWaterNasa: "मिट्टी और जल · NASA POWER",
    surfaceMoisture: "सतह की मिट्टी की नमी",
    rootMoisture: "जड़ क्षेत्र की नमी",
    evapotranspiration: "वाष्पीकरण",
    dewPoint: "ओस बिंदु",
    frostDays: "पाला के दिन / वर्ष",
    surfaceNote: "0-1 पैमाना (ऊपरी परत)",
    rootNote: "0-1 पैमाना (जड़ क्षेत्र)",
    evapoNote: "मिट्टी + पौधों से पानी का नुकसान",
    dewNote: "नमी संघनन सीमा",
    frostNote: "औसत वार्षिक पाला के दिन",
    fieldNote: "खेत नोट",
    agronomyAssistant: "फार्मफोलियो कृषि सहायक",
    vegIndexNdvi: "वनस्पति सूचकांक · NDVI · Sentinel-2",
    nitrogenChloro: "नाइट्रोजन और क्लोरोफिल · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE और क्लोरोफिल सूचकांक पत्ती नाइट्रोजन सामग्री के लिए उपग्रह प्रॉक्सी हैं (उद्योग मानक)",
    ndreProxy: "NDRE - नाइट्रोजन प्रॉक्सी",
    chlorophyllIndex: "क्लोरोफिल सूचकांक (Red Edge)",
    chloroDesc: "उच्च = अधिक क्लोरोफिल = अधिक नाइट्रोजन ग्रहण",
    evi: "EVI - उन्नत वनस्पति",
    eviDesc: "NDVI की तुलना में वायुमंडल और बादलों से कम प्रभावित",
    waterMoistureStress: "जल और नमी तनाव · Sentinel-2",
    ndwi: "NDWI - कैनोपी जल सामग्री",
    moistureStressIdx: "नमी तनाव सूचकांक (B8A/B11)",
    askAgronomist: "कृषिविज्ञानी से पूछें",
    followUp: "इस रिपोर्ट पर अनुवर्ती कार्रवाई करें।",
    noData: "कोई डेटा उपलब्ध नहीं",
    bare: "0.0 · खाली",
    sparse: "0.3 · विरल",
    healthy: "0.6 · स्वस्थ",
    denseCanopy: "0.9 · घनी कैनोपी",
    min: "न्यूनतम",
    mean: "औसत",
    max: "अधिकतम",
    deficient: "0.0 · कमी",
    adequate: "0.25 · पर्याप्त",
    optimal: "0.45+ · इष्टतम",
    noQuestions: "अभी तक कोई प्रश्न नहीं। इस क्षेत्र के बारे में कुछ भी पूछें - रोपण का समय, जल संतुलन, फसल उपयुक्तता, NDVI प्रवृत्ति।",
    you: "आप",
    thinking: "सोच रहा है...",
    askPlaceholder: "इस क्षेत्र के बारे में एक प्रश्न पूछें...",
    askBtn: "पूछें",
    suggested: "सुझाव",
    sug1: "इस जलवायु के लिए कौन सी फसलें उपयुक्त होंगी?",
    sug2: "क्या सिंचाई की संभावना है?",
    sug3: "NDVI प्रवृत्ति अभी क्या सुझाव देती है?",
    langToggle: "English",
    micBtn: "माइक",
    listening: "सुन रहा है…",
    micNotSupported: "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है",
    readAloud: "पढ़कर सुनाएँ",
    stopReading: "रोकें",
    noHindiVoice: "इस डिवाइस पर हिन्दी आवाज़ उपलब्ध नहीं है",
    translating: "हिन्दी सारांश बन रहा है…",
  },
  mr: {
    loading: "अहवाल लोड होत आहे…",
    fieldReport: "शेत अहवाल",
    session: "सत्र",
    climateNasa: "हवामान · NASA POWER",
    temperature: "तापमान",
    rainfall: "पाऊस",
    humidity: "आर्द्रता",
    solarRadiation: "सौर विकिरण",
    windSpeed: "वाऱ्याचा वेग",
    soilWaterNasa: "माती आणि पाणी · NASA POWER",
    surfaceMoisture: "पृष्ठभागाची माती ओलावा",
    rootMoisture: "मूळ क्षेत्राची ओलावा",
    evapotranspiration: "बाष्पोत्सर्जन",
    dewPoint: "दवबिंदू",
    frostDays: "दंव दिवस / वर्ष",
    surfaceNote: "0-1 प्रमाण (वरचा थर)",
    rootNote: "0-1 प्रमाण (मूळ क्षेत्र)",
    evapoNote: "माती + झाडांमधून गेलेले पाणी",
    dewNote: "आर्द्रता संघनन उंबरठा",
    frostNote: "सरासरी वार्षिक दंव दिवस",
    fieldNote: "शेत नोंद",
    agronomyAssistant: "फार्मफोलिओ कृषी सहाय्यक",
    vegIndexNdvi: "वनस्पती निर्देशांक · NDVI · Sentinel-2",
    nitrogenChloro: "नायट्रोजन आणि क्लोरोफिल · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE आणि क्लोरोफिल निर्देशांक पानांच्या नायट्रोजनसाठी उपग्रह प्रॉक्सी आहेत",
    ndreProxy: "NDRE — नायट्रोजन प्रॉक्सी",
    chlorophyllIndex: "क्लोरोफिल निर्देशांक (Red Edge)",
    chloroDesc: "जास्त = अधिक क्लोरोफिल = अधिक नायट्रोजन",
    evi: "EVI — सुधारित वनस्पती",
    eviDesc: "NDVI पेक्षा वातावरण आणि ढगांचा कमी प्रभाव",
    waterMoistureStress: "पाणी आणि ओलावा ताण · Sentinel-2",
    ndwi: "NDWI — छत पाणी सामग्री",
    moistureStressIdx: "ओलावा ताण निर्देशांक (B8A/B11)",
    askAgronomist: "कृषितज्ञाला विचारा",
    followUp: "या अहवालावर पाठपुरावा करा.",
    noData: "डेटा उपलब्ध नाही",
    bare: "0.0 · रिकामे",
    sparse: "0.3 · विरळ",
    healthy: "0.6 · निरोगी",
    denseCanopy: "0.9 · घनदाट छत",
    min: "किमान",
    mean: "सरासरी",
    max: "कमाल",
    deficient: "0.0 · कमतरता",
    adequate: "0.25 · पुरेसे",
    optimal: "0.45+ · इष्टतम",
    noQuestions: "अजून प्रश्न नाहीत. या शेताबद्दल काहीही विचारा.",
    you: "तुम्ही",
    thinking: "विचार करत आहे…",
    askPlaceholder: "या शेताबद्दल प्रश्न विचारा…",
    askBtn: "विचारा",
    suggested: "सुचवलेले",
    sug1: "या हवामानासाठी कोणती पिके योग्य आहेत?",
    sug2: "सिंचनाची गरज आहे का?",
    sug3: "NDVI प्रवृत्ती सध्या काय सुचवते?",
    langToggle: "मराठी",
    micBtn: "मायक्रोफोन",
    listening: "ऐकत आहे…",
    micNotSupported: "या ब्राउझरमध्ये व्हॉइस इनपुट उपलब्ध नाही",
    readAloud: "मोठ्याने वाचा",
    stopReading: "थांबा",
    noHindiVoice: "या डिव्हाइसवर मराठी आवाज उपलब्ध नाही",
    translating: "मराठी सारांश तयार होत आहे…",
  },
  ta: {
    loading: "அறிக்கை ஏற்றுகிறது…",
    fieldReport: "வயல் அறிக்கை",
    session: "அமர்வு",
    climateNasa: "காலநிலை · NASA POWER",
    temperature: "வெப்பநிலை",
    rainfall: "மழைப்பொழிவு",
    humidity: "ஈரப்பதம்",
    solarRadiation: "சூரிய கதிர்வீச்சு",
    windSpeed: "காற்று வேகம்",
    soilWaterNasa: "மண் & நீர் · NASA POWER",
    surfaceMoisture: "மேற்பரப்பு மண் ஈரப்பதம்",
    rootMoisture: "வேர் மண்டல ஈரப்பதம்",
    evapotranspiration: "நீராவியாதல்",
    dewPoint: "பனித்துளி நிலை",
    frostDays: "பனி நாட்கள் / ஆண்டு",
    surfaceNote: "0-1 அளவு (மேல் அடுக்கு)",
    rootNote: "0-1 அளவு (வேர் மண்டலம்)",
    evapoNote: "மண் + தாவரங்களிலிருந்து இழந்த நீர்",
    dewNote: "ஈரப்பத உறைநிலை வரம்பு",
    frostNote: "சராசரி வருடாந்திர பனி நாட்கள்",
    fieldNote: "வயல் குறிப்பு",
    agronomyAssistant: "Farmfolio வேளாண் உதவியாளர்",
    vegIndexNdvi: "தாவர குறியீடு · NDVI · Sentinel-2",
    nitrogenChloro: "நைட்ரஜன் & கிளோரோபில் · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE மற்றும் கிளோரோபில் குறியீடு இலை நைட்ரஜனுக்கான செயற்கைக்கோள் அளவீடுகள்",
    ndreProxy: "NDRE — நைட்ரஜன் அளவீடு",
    chlorophyllIndex: "கிளோரோபில் குறியீடு (Red Edge)",
    chloroDesc: "அதிகம் = அதிக கிளோரோபில் = அதிக நைட்ரஜன்",
    evi: "EVI — மேம்படுத்தப்பட்ட தாவர குறியீடு",
    eviDesc: "NDVI ஐ விட வளிமண்டலம் & மேகங்களால் குறைந்த தாக்கம்",
    waterMoistureStress: "நீர் & ஈரப்பத அழுத்தம் · Sentinel-2",
    ndwi: "NDWI — மேலாடை நீர் உள்ளடக்கம்",
    moistureStressIdx: "ஈரப்பத அழுத்த குறியீடு (B8A/B11)",
    askAgronomist: "வேளாண் நிபுணரிடம் கேளுங்கள்",
    followUp: "இந்த அறிக்கையை தொடர்ந்து கண்காணிக்கவும்.",
    noData: "தரவு இல்லை",
    bare: "0.0 · வெற்று",
    sparse: "0.3 · மெல்லிய",
    healthy: "0.6 · ஆரோக்கியமான",
    denseCanopy: "0.9 · அடர்த்தியான மேலாடை",
    min: "குறைந்தபட்சம்",
    mean: "சராசரி",
    max: "அதிகபட்சம்",
    deficient: "0.0 · குறைபாடு",
    adequate: "0.25 · போதுமான",
    optimal: "0.45+ · உகந்த",
    noQuestions: "இன்னும் கேள்விகள் இல்லை. இந்த வயலைப் பற்றி எதுவும் கேளுங்கள்.",
    you: "நீங்கள்",
    thinking: "யோசிக்கிறது…",
    askPlaceholder: "இந்த வயலைப் பற்றி கேள்வி கேளுங்கள்…",
    askBtn: "கேளுங்கள்",
    suggested: "பரிந்துரை",
    sug1: "இந்த காலநிலைக்கு எந்த பயிர்கள் ஏற்றவை?",
    sug2: "நீர்ப்பாசனம் தேவைப்படுமா?",
    sug3: "NDVI போக்கு இப்போது என்ன சொல்கிறது?",
    langToggle: "தமிழ்",
    micBtn: "மைக்",
    listening: "கேட்கிறது…",
    micNotSupported: "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை",
    readAloud: "சத்தமாக படிக்கவும்",
    stopReading: "நிறுத்தவும்",
    noHindiVoice: "இந்த சாதனத்தில் தமிழ் குரல் இல்லை",
    translating: "தமிழ் சுருக்கம் தயாரிக்கப்படுகிறது…",
  },
  te: {
    loading: "నివేదిక లోడవుతోంది…",
    fieldReport: "పొలం నివేదిక",
    session: "సెషన్",
    climateNasa: "వాతావరణం · NASA POWER",
    temperature: "ఉష్ణోగ్రత",
    rainfall: "వర్షపాతం",
    humidity: "తేమ",
    solarRadiation: "సౌర వికిరణం",
    windSpeed: "గాలి వేగం",
    soilWaterNasa: "నేల & నీరు · NASA POWER",
    surfaceMoisture: "ఉపరితల నేల తేమ",
    rootMoisture: "వేరు మండల తేమ",
    evapotranspiration: "బాష్పోత్సేదనం",
    dewPoint: "మంచు బిందువు",
    frostDays: "మంచు రోజులు / సంవత్సరం",
    surfaceNote: "0-1 స్కేల్ (ఉపరితల పొర)",
    rootNote: "0-1 స్కేల్ (వేరు మండలం)",
    evapoNote: "నేల + మొక్కల నుండి కోల్పోయిన నీరు",
    dewNote: "తేమ ఘనీభవన అంచు",
    frostNote: "సగటు వార్షిక మంచు రోజులు",
    fieldNote: "పొలం గమనిక",
    agronomyAssistant: "Farmfolio వ్యవసాయ సహాయకుడు",
    vegIndexNdvi: "వృక్ష సూచిక · NDVI · Sentinel-2",
    nitrogenChloro: "నత్రజని & క్లోరోఫిల్ · Sentinel-2 Red Edge",
    nitrogenDesc: "NDRE మరియు క్లోరోఫిల్ సూచిక ఆకు నత్రజని కోసం ఉపగ్రహ కొలతలు",
    ndreProxy: "NDRE — నత్రజని కొలత",
    chlorophyllIndex: "క్లోరోఫిల్ సూచిక (Red Edge)",
    chloroDesc: "ఎక్కువ = మరింత క్లోరోఫిల్ = మరింత నత్రజని",
    evi: "EVI — మెరుగైన వృక్ష సూచిక",
    eviDesc: "NDVI కంటే వాతావరణం & మేఘాల వల్ల తక్కువ ప్రభావం",
    waterMoistureStress: "నీరు & తేమ ఒత్తిడి · Sentinel-2",
    ndwi: "NDWI — ఆచ్ఛాదన నీటి పరిమాణం",
    moistureStressIdx: "తేమ ఒత్తిడి సూచిక (B8A/B11)",
    askAgronomist: "వ్యవసాయ నిపుణుడిని అడగండి",
    followUp: "ఈ నివేదికను అనుసరించండి.",
    noData: "డేటా అందుబాటులో లేదు",
    bare: "0.0 · బోడి",
    sparse: "0.3 · అరుదు",
    healthy: "0.6 · ఆరోగ్యకరమైన",
    denseCanopy: "0.9 · దట్టమైన పందిరి",
    min: "కనిష్ఠం",
    mean: "సగటు",
    max: "గరిష్ఠం",
    deficient: "0.0 · లోటు",
    adequate: "0.25 · తగినంత",
    optimal: "0.45+ · అనుకూలమైన",
    noQuestions: "ఇంకా ప్రశ్నలు లేవు. ఈ పొలం గురించి ఏదైనా అడగండి.",
    you: "మీరు",
    thinking: "ఆలోచిస్తోంది…",
    askPlaceholder: "ఈ పొలం గురించి ప్రశ్న అడగండి…",
    askBtn: "అడగండి",
    suggested: "సూచించబడినవి",
    sug1: "ఈ వాతావరణానికి ఏ పంటలు సరిపోతాయి?",
    sug2: "నీటిపారుదల అవసరమా?",
    sug3: "NDVI ధోరణి ఇప్పుడు ఏమి సూచిస్తోంది?",
    langToggle: "తెలుగు",
    micBtn: "మైక్",
    listening: "వింటోంది…",
    micNotSupported: "ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ మద్దతు లేదు",
    readAloud: "声に出して読む",
    stopReading: "ఆపండి",
    noHindiVoice: "ఈ పరికరంలో తెలుగు గొంతు అందుబాటులో లేదు",
    translating: "తెలుగు సారాంశం తయారవుతోంది…",
  },
} as const;



// ── Speech Recognition Hook ──────────────────────────────────────────────────
type SpeechRecognitionHook = {
  isSupported: boolean;
  isListening: boolean;
  start: (lang: string, onResult: (text: string) => void) => void;
  stop: () => void;
};

function useSpeechRecognition(): SpeechRecognitionHook {
  const SRConstructor =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
      : null;
  // Speech API also requires a secure context (HTTPS/localhost) on mobile
  const isSecure = typeof window === "undefined" || window.isSecureContext;
  const isSupported = Boolean(SRConstructor) && isSecure;
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<any>(null);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(
    (lang: string, onResult: (text: string) => void) => {
      if (!SRConstructor || isListening) return;

      // Guard: browser API exists but page is not on HTTPS/localhost
      if (!window.isSecureContext) {
        toast.error("Microphone requires HTTPS. Open the app via a secure URL.");
        return;
      }

      const rec = new SRConstructor();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        onResult(transcript);
      };
      rec.onerror = (e: any) => {
        setIsListening(false);
        const code: string = e?.error ?? "unknown";
        if (code === "not-allowed") {
          toast.error("Microphone access denied. Allow mic permission in your browser settings.");
        } else if (code === "network") {
          toast.error("Speech recognition needs a network connection.");
        } else if (code === "no-speech") {
          // silent — user just didn't say anything
        } else if (code !== "aborted") {
          toast.error(`Microphone error: ${code}`);
        }
      };
      rec.onend = () => setIsListening(false);
      recRef.current = rec;
      rec.start();
      setIsListening(true);
    },
    [SRConstructor, isListening]
  );

  return { isSupported, isListening, start, stop };
}

// ── Speech Synthesis Hook ────────────────────────────────────────────────────
type SpeakResult = { noHindiVoice?: boolean };
type SpeechSynthesisHook = {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, lang: string) => SpeakResult;
  stop: () => void;
};

function useSpeechSynthesis(): SpeechSynthesisHook {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, lang: string): SpeakResult => {
      if (!isSupported) return {};
      window.speechSynthesis.cancel();

      // For Hindi, verify a voice exists first
      if (lang === "hi-IN") {
        const voices = window.speechSynthesis.getVoices();
        const hasHindi = voices.some((v) => v.lang.startsWith("hi"));
        if (!hasHindi) return { noHindiVoice: true };
      }

      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang;
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
      return {};
    },
    [isSupported]
  );

  return { isSupported, isSpeaking, speak, stop };
}

type Msg = { role: "user" | "assistant"; text: string };

function ReportPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<LandReport | null>(null);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    if (!token) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    const r = getCurrentReport();
    if (!r) {
      navigate({ to: "/location", replace: true });
      return;
    }
    setReport(r);
  }, [token, navigate]);

  if (!report) {
    return (
      <Shell>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          {TRANSLATIONS[lang].loading}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ReportView report={report} token={token!} lang={lang} setLang={setLang} />
    </Shell>
  );
}

function ReportView({ report, token, lang, setLang }: { report: LandReport; token: string, lang: Lang, setLang: (l: Lang) => void }) {
  const { rawData, summary, sessionId } = report;
  const { climate, vegetation, location } = rawData;
  const t = TRANSLATIONS[lang];

  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null);
  const [translatingSummary, setTranslatingSummary] = useState(false);
  // TTS
  const tts = useSpeechSynthesis();
  const [noHindiVoice, setNoHindiVoice] = useState(false);

  // Fetch translated summary for any non-English language
  useEffect(() => {
    if (lang !== "en" && !translatedSummary && !translatingSummary) {
      setTranslatingSummary(true);
      const langPrompt: Record<string, string> = {
        hi: "इस खेत का सारांश हिंदी में दें। (Summarise this field's current conditions in Hindi, 3–5 sentences, plain language, no advice.)",
        mr: "या शेताचा सारांश मराठीत द्या. (Summarise this field's current conditions in Marathi, 3–5 sentences, plain language, no advice.)",
        ta: "இந்த வயலின் தற்போதைய நிலையை தமிழில் சுருக்கமாக கூறுங்கள், 3-5 வாக்கியங்கள். (Summarise in Tamil, 3–5 sentences, plain language.)",
        te: "ఈ పొలం యొక్క ప్రస్తుత పరిస్థితిని తెలుగులో సంగ్రహంగా చెప్పండి, 3-5 వాక్యాలు. (Summarise in Telugu, 3–5 sentences.)",
      };
      fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/ask`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          question: langPrompt[lang] ?? langPrompt.hi,
          language: lang,
        }),
      })
        .then((r) => r.json())
        .then(({ reply }) => setTranslatedSummary(reply))
        .catch(() => toast.error("Could not generate translated summary"))
        .finally(() => setTranslatingSummary(false));
    }
    // Stop any ongoing speech when language changes
    tts.stop();
    setNoHindiVoice(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const displaySummary = (lang !== "en" ? translatedSummary : null) ?? summary;

  const SPEECH_LANG: Record<Lang, string> = {
    en: "en-US",
    hi: "hi-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    te: "te-IN",
  };

  function handleReadAloud() {
    if (tts.isSpeaking) {
      tts.stop();
      return;
    }
    const result = tts.speak(displaySummary, SPEECH_LANG[lang]);
    if (result.noHindiVoice) setNoHindiVoice(true);
  }

  const climateStats = useMemo(
    () => [
      { label: t.temperature, value: climate.avgTemperatureC, unit: "°C", decimals: 1 },
      { label: t.rainfall, value: climate.avgRainfallMM, unit: "mm/day", decimals: 2 },
      { label: t.humidity, value: climate.avgHumidityPct, unit: "%", decimals: 0 },
      { label: t.solarRadiation, value: climate.avgSolarRadiation, unit: "kWh/m²", decimals: 1 },
      { label: t.windSpeed, value: climate.avgWindSpeed, unit: "m/s", decimals: 1 },
    ],
    [climate, t],
  );

  const soilStats = useMemo(
    () => [
      {
        label: t.surfaceMoisture,
        value: climate.soilMoistureSurface,
        unit: "",
        decimals: 2,
        note: t.surfaceNote,
      },
      {
        label: t.rootMoisture,
        value: climate.soilMoistureRoot,
        unit: "",
        decimals: 2,
        note: t.rootNote,
      },
      {
        label: t.evapotranspiration,
        value: climate.evapotranspiration,
        unit: "mm/day",
        decimals: 2,
        note: t.evapoNote,
      },
      {
        label: t.dewPoint,
        value: climate.dewPointC,
        unit: "°C",
        decimals: 1,
        note: t.dewNote,
      },
      {
        label: t.frostDays,
        value: climate.frostDaysPerYear,
        unit: "days",
        decimals: 0,
        note: t.frostNote,
      },
    ],
    [climate, t],
  );

  // NDRE badge color
  const ndreColor =
    vegetation.ndreMean == null ? "text-muted-foreground"
    : vegetation.ndreMean > 0.45 ? "text-emerald-700"
    : vegetation.ndreMean > 0.25 ? "text-lime-700"
    : vegetation.ndreMean > 0.10 ? "text-amber-600"
    : "text-red-600";

  return (
    <div className={`mx-auto max-w-6xl px-6 py-14 ${lang !== "en" ? "font-regional" : ""}`}>
      <style>{`
        .font-regional .text-\\[10px\\] { font-size: 13px !important; }
        .font-regional .text-\\[11px\\] { font-size: 14px !important; }
        .font-regional .text-xs { font-size: 15px !important; }
        .font-regional .text-sm { font-size: 16px !important; }
        .font-regional .text-base { font-size: 18px !important; }
        .font-regional p, .font-regional span, .font-regional div, .font-regional button { letter-spacing: 0.02em; }
      `}</style>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
              {t.fieldReport}
            </p>
            {/* Language selector — custom styled pill */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => {
                  setTranslatedSummary(null);
                  setLang(e.target.value as Lang);
                }}
                style={{
                  background: "var(--cream)",
                  border: "1px solid var(--forest)",
                  color: "var(--forest-deep)",
                  borderRadius: "999px",
                  paddingLeft: "2rem",
                  paddingRight: "1.75rem",
                  paddingTop: "0.3rem",
                  paddingBottom: "0.3rem",
                  fontSize: "11px",
                  fontFamily: "inherit",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  appearance: "none",
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "0 0 0 0 transparent",
                  transition: "box-shadow 0.15s, background 0.15s",
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,106,79,0.18)")}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
              </select>
              {/* Globe icon */}
              <Languages
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3"
                style={{ color: "var(--forest)" }}
              />
              {/* Custom chevron */}
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ color: "var(--forest)" }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-tight tracking-tight text-[color:var(--forest-deep)] md:text-5xl">
            {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
          </h1>
        </div>
        <p className="stat-num hidden text-sm text-muted-foreground">
          {t.session} · <span className="text-foreground/70">{sessionId.slice(0, 8)}</span>
        </p>
      </div>

      {/* ── Climate ─────────────────────────────────────────────────── */}
      <section className="mt-14 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.climateNasa}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-5">
          {climateStats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)] md:text-6xl">
                <CountUp value={s.value} decimals={s.decimals} />
                <span className="ml-1 text-lg text-muted-foreground">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Soil Health ─────────────────────────────────────────────── */}
      <section className="mt-16 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.soilWaterNasa}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-5">
          {soilStats.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {s.label}
              </p>
              {s.value != null ? (
                <p className="stat-num mt-3 text-4xl text-[color:var(--forest-deep)] md:text-5xl">
                  <CountUp value={s.value} decimals={s.decimals} />
                  {s.unit && <span className="ml-1 text-base text-muted-foreground">{s.unit}</span>}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">—</p>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground/70">{s.note}</p>
            </div>
          ))}
        </div>
        {/* Soil moisture visual bars */}
        {climate.soilMoistureSurface != null && climate.soilMoistureRoot != null && (
          <div className="mt-10 space-y-4">
            <MoistureBar label={t.surfaceMoisture} value={climate.soilMoistureSurface} />
            <MoistureBar label={t.rootMoisture} value={climate.soilMoistureRoot} />
          </div>
        )}
      </section>

      {/* ── AI Summary ──────────────────────────────────────────────── */}
      <section className="mt-16 grid gap-10 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col gap-3 items-start md:pt-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
            {t.fieldNote}
          </div>
          {translatingSummary && (
            <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {t.translating}
            </p>
          )}
        </div>
        <div>
          <blockquote className="border-l-2 border-[color:var(--forest)] pl-6">
            <p className="font-serif text-2xl leading-snug tracking-tight text-[color:var(--forest-deep)] md:text-3xl">
              &ldquo;{displaySummary}&rdquo;
            </p>
            <footer className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
              {t.agronomyAssistant}
            </footer>
          </blockquote>
          {/* TTS controls */}
          <div className="mt-4 flex items-center gap-3 pl-6">
            {tts.isSupported && (
              <button
                onClick={handleReadAloud}
                disabled={lang === "hi" && !translatedSummary}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                {tts.isSpeaking
                  ? <><Square className="h-3 w-3" />{t.stopReading}</>
                  : <><Volume2 className="h-3 w-3" />{t.readAloud}</>}
              </button>
            )}
            {noHindiVoice && (
              <p className="text-[10px] text-amber-700">{t.noHindiVoice}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── NDVI ────────────────────────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
              {t.vegIndexNdvi}
            </p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[color:var(--forest-deep)]">
              {vegetation.interpretation}
            </h2>
          </div>
          <p className="stat-num text-5xl text-[color:var(--forest-deep)]">
            <CountUp value={vegetation.ndviMean} decimals={2} />
          </p>
        </div>
        <NdviScale
          mean={vegetation.ndviMean}
          min={vegetation.ndviMin}
          max={vegetation.ndviMax}
          lang={lang}
        />
      </section>

      {/* ── Nitrogen & Chlorophyll ──────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.nitrogenChloro}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t.nitrogenDesc}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* NDRE score */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.ndreProxy}
            </p>
            {vegetation.ndreMean != null ? (
              <>
                <p className={`stat-num mt-3 text-5xl ${ndreColor}`}>
                  <CountUp value={vegetation.ndreMean} decimals={3} />
                </p>
                <p className={`mt-2 text-sm font-medium ${ndreColor}`}>
                  {vegetation.ndreInterpretation}
                </p>
                <NdreScale value={vegetation.ndreMean} lang={lang} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
          {/* Chlorophyll Index */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.chlorophyllIndex}
            </p>
            {vegetation.chlorophyllIndex != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.chlorophyllIndex} decimals={2} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.chloroDesc}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
          {/* EVI */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.evi}
            </p>
            {vegetation.eviMean != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.eviMean} decimals={3} />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.eviDesc}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Water & Moisture Stress ─────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.waterMoistureStress}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* NDWI */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.ndwi}
            </p>
            {vegetation.ndwiMean != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.ndwiMean} decimals={3} />
                </p>
                <p className="mt-2 text-sm font-medium text-[color:var(--forest-deep)]">
                  {vegetation.ndwiInterpretation}
                </p>
                <IndexBar value={vegetation.ndwiMean} min={-0.5} max={0.5} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
          {/* Moisture Index */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t.moistureStressIdx}
            </p>
            {vegetation.moistureIndex != null ? (
              <>
                <p className="stat-num mt-3 text-5xl text-[color:var(--forest-deep)]">
                  <CountUp value={vegetation.moistureIndex} decimals={3} />
                </p>
                <p className="mt-2 text-sm font-medium text-[color:var(--forest-deep)]">
                  {vegetation.moistureInterpretation}
                </p>
                <IndexBar value={vegetation.moistureIndex} min={-0.5} max={0.5} />
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t.noData}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Chat ────────────────────────────────────────────────────── */}
      <section className="mt-20 rule-t pt-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--forest)]">
          {t.askAgronomist}
        </p>
        <h2 className="mt-2 max-w-2xl font-serif text-3xl tracking-tight text-[color:var(--forest-deep)]">
          {t.followUp}
        </h2>
        <ChatPanel token={token} sessionId={sessionId} lang={lang} />
      </section>
    </div>
  );
}


function NdviScale({ mean, min, max, lang }: { mean: number; min: number; max: number; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  // Practical scale 0..0.9
  const scaleMin = 0;
  const scaleMax = 0.9;
  const pct = (v: number) =>
    `${Math.min(100, Math.max(0, ((v - scaleMin) / (scaleMax - scaleMin)) * 100))}%`;

  return (
    <div className="mt-10">
      <div className="relative h-3 w-full bg-[color:var(--sage)]/50">
        {/* gradient bar */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: "100%",
            background:
              "linear-gradient(to right, oklch(0.85 0.05 60), oklch(0.78 0.12 120), oklch(0.42 0.12 150))",
            opacity: 0.85,
          }}
        />
        {/* min-max range */}
        <div
          className="absolute inset-y-0 border-x border-[color:var(--forest-deep)]/50 bg-[color:var(--forest-deep)]/10"
          style={{ left: pct(min), width: `calc(${pct(max)} - ${pct(min)})` }}
        />
        {/* mean marker */}
        <div
          className="absolute -top-2 -bottom-2 w-[2px] bg-[color:var(--forest-deep)]"
          style={{ left: pct(mean) }}
        >
          <span className="stat-num absolute -top-6 -translate-x-1/2 text-xs text-[color:var(--forest-deep)]">
            {mean.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="stat-num mt-3 flex justify-between text-[11px] text-muted-foreground">
        <span>{t.bare}</span>
        <span>{t.sparse}</span>
        <span>{t.healthy}</span>
        <span>{t.denseCanopy}</span>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-6 text-sm">
        <Stat label={t.min} value={min} />
        <Stat label={t.mean} value={mean} highlight />
        <Stat label={t.max} value={max} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`stat-num mt-2 text-3xl ${
          highlight ? "text-[color:var(--forest-deep)]" : "text-foreground/80"
        }`}
      >
        {value.toFixed(2)}
      </p>
    </div>
  );
}

function ChatPanel({ token, sessionId, lang }: { token: string; sessionId: string; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechRecognition();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  function handleMicClick() {
    if (speech.isListening) {
      speech.stop();
      return;
    }
    const SPEECH_MIC_LANG: Record<Lang, string> = {
      en: "en-US",
      hi: "hi-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      te: "te-IN",
      mai: "hi-IN",
    };
    speech.start(SPEECH_MIC_LANG[lang], (text) => setInput(text));
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || pending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setPending(true);
    try {
      const { reply } = await api.ask(token, sessionId, q, lang);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not send";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `⚠︎ ${msg}` },
      ]);
    } finally {
      setPending(false);
    }
  }

  const suggestions = [
    t.sug1,
    t.sug2,
    t.sug3,
  ];

  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_auto]">
      <div>
        <div
          ref={scrollRef}
          className="min-h-[220px] max-h-[440px] overflow-y-auto pr-2"
        >
          {messages.length === 0 && !pending && (
            <p className="text-foreground/60">
              {t.noQuestions}
            </p>
          )}
          <ul className="space-y-8">
            {messages.map((m, i) => (
              <li key={i}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {m.role === "user" ? t.you : "Farmfolio"}
                </p>
                <p
                  className={`mt-2 leading-relaxed ${
                    m.role === "assistant"
                      ? "font-serif text-lg text-[color:var(--forest-deep)]"
                      : "text-foreground"
                  }`}
                >
                  {m.text}
                </p>
              </li>
            ))}
            {pending && (
              <li>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Farmfolio
                </p>
                <p className="mt-2 inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.thinking}
                </p>
              </li>
            )}
          </ul>
        </div>

        <form onSubmit={onSend} className="mt-8 flex items-center gap-3 border-t border-border pt-4">
          {/* Mic button */}
          {speech.isSupported ? (
            <button
              type="button"
              onClick={handleMicClick}
              title={speech.isListening ? t.listening : t.micBtn}
              className={`flex-shrink-0 rounded-full p-1.5 transition-colors ${
                speech.isListening
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "text-muted-foreground hover:text-[color:var(--forest)]"
              }`}
            >
              {speech.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={t.micNotSupported}
              className="flex-shrink-0 rounded-full p-1.5 text-muted-foreground/30 cursor-not-allowed"
            >
              <MicOff className="h-4 w-4" />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={speech.isListening ? t.listening : t.askPlaceholder}
            className="flex-1 border-0 bg-transparent px-0 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="inline-flex items-center gap-2 rounded-sm bg-[color:var(--forest)] px-4 py-2 text-sm text-[color:var(--cream)] transition-colors hover:bg-[color:var(--forest-deep)] disabled:opacity-50"
          >
            {t.askBtn}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>

      <aside className="md:w-64 md:border-l md:border-border md:pl-8">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {t.suggested}
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => setInput(s)}
                className="text-left text-foreground/75 hover:text-[color:var(--forest-deep)]"
              >
                — {s}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// ── Visual helper components ─────────────────────────────────────────────────

/** NDRE nitrogen scale — 0 to 0.6 */
function NdreScale({ value, lang }: { value: number; lang: Lang }) {
  const t = TRANSLATIONS[lang];
  const pct = `${Math.min(100, Math.max(0, (value / 0.6) * 100))}%`;
  return (
    <div className="mt-6">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--sage)]/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: pct,
            background: "linear-gradient(to right, oklch(0.65 0.18 30), oklch(0.70 0.16 80), oklch(0.45 0.14 145))",
          }}
        />
      </div>
      <div className="stat-num mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{t.deficient}</span>
        <span>{t.adequate}</span>
        <span>{t.optimal}</span>
      </div>
    </div>
  );
}

/** Moisture bar — 0 to 1 scale */
function MoistureBar({ label, value }: { label: string; value: number }) {
  const pct = `${Math.min(100, Math.max(0, value * 100))}%`;
  const color =
    value > 0.7 ? "oklch(0.42 0.12 225)"
    : value > 0.4 ? "oklch(0.50 0.13 200)"
    : "oklch(0.68 0.12 55)";
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className="stat-num">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[color:var(--sage)]/40">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: pct, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** Generic index bar centered at 0, range [min, max] */
function IndexBar({ value, min, max }: { value: number; min: number; max: number }) {
  const range = max - min;
  const zeroPct = ((0 - min) / range) * 100;
  const valPct = ((value - min) / range) * 100;
  const barLeft = Math.min(zeroPct, valPct);
  const barWidth = Math.abs(valPct - zeroPct);
  const isPositive = value >= 0;

  return (
    <div className="mt-6">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--sage)]/40">
        {/* colored fill from zero to value */}
        <div
          className="absolute inset-y-0 rounded-full"
          style={{
            left: `${barLeft}%`,
            width: `${barWidth}%`,
            backgroundColor: isPositive ? "oklch(0.42 0.12 150)" : "oklch(0.60 0.18 30)",
          }}
        />
        {/* center line */}
        <div
          className="absolute inset-y-0 w-[1px] bg-foreground/30"
          style={{ left: `${zeroPct}%` }}
        />
      </div>
      <div className="stat-num mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{min.toFixed(1)}</span>
        <span>0</span>
        <span>{max.toFixed(1)}</span>
      </div>
    </div>
  );
}
