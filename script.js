// --- DATABASE BAHASA SUARA (60+ Negara) ---
// Format: [Nama Bahasa, Kode Suara (Speech), Kode Translate (API)]
const languages = [
    ["🇮🇩 Indonesia", "id-ID", "id"],
    ["🇺🇸 English (US)", "en-US", "en"],
    ["🇬🇧 English (UK)", "en-GB", "en"],
    ["🇯🇵 Japanese", "ja-JP", "ja"],
    ["🇰🇷 Korean", "ko-KR", "ko"],
    ["🇸🇦 Arabic (Saudi)", "ar-SA", "ar"],
    ["🇨🇳 Chinese (Mandarin)", "zh-CN", "zh-CN"],
    ["🇹🇼 Chinese (Taiwan)", "zh-TW", "zh-TW"],
    ["🇭🇰 Chinese (Cantonese)", "zh-HK", "zh-TW"],
    ["🇪🇸 Spanish (Spain)", "es-ES", "es"],
    ["🇲🇽 Spanish (Mexico)", "es-MX", "es"],
    ["🇫🇷 French", "fr-FR", "fr"],
    ["🇩🇪 German", "de-DE", "de"],
    ["🇷🇺 Russian", "ru-RU", "ru"],
    ["🇮🇹 Italian", "it-IT", "it"],
    ["🇳🇱 Dutch", "nl-NL", "nl"],
    ["🇹🇷 Turkish", "tr-TR", "tr"],
    ["🇹🇭 Thai", "th-TH", "th"],
    ["🇻🇳 Vietnamese", "vi-VN", "vi"],
    ["🇮🇳 Hindi", "hi-IN", "hi"],
    ["🇲🇾 Malay", "ms-MY", "ms"],
    ["🇵🇭 Filipino", "fil-PH", "tl"],
    ["🇵🇹 Portuguese (BR)", "pt-BR", "pt"],
    ["🇵🇹 Portuguese (PT)", "pt-PT", "pt"],
    ["🇵🇱 Polish", "pl-PL", "pl"],
    ["🇺🇦 Ukrainian", "uk-UA", "uk"],
    ["🇸🇪 Swedish", "sv-SE", "sv"],
    ["🇳🇴 Norwegian", "no-NO", "no"],
    ["🇩🇰 Danish", "da-DK", "da"],
    ["🇫🇮 Finnish", "fi-FI", "fi"],
    ["🇬🇷 Greek", "el-GR", "el"],
    ["🇨🇿 Czech", "cs-CZ", "cs"],
    ["🇭🇺 Hungarian", "hu-HU", "hu"],
    ["🇷🇴 Romanian", "ro-RO", "ro"],
    ["🇸🇰 Slovak", "sk-SK", "sk"],
    ["🇿🇦 Afrikaans", "af-ZA", "af"],
    ["🇧🇩 Bengali", "bn-BD", "bn"],
    ["🇪🇸 Catalan", "ca-ES", "ca"],
    ["🇱🇰 Sinhala", "si-LK", "si"],
    ["🇰🇭 Khmer", "km-KH", "km"],
    ["🇱🇦 Lao", "lo-LA", "lo"],
    ["🇳🇵 Nepali", "ne-NP", "ne"],
    ["🇮🇩 Javanese", "jv-ID", "jw"], // Support Device Tertentu
    ["🇮🇩 Sundanese", "su-ID", "su"], // Support Device Tertentu
    ["🇮🇱 Hebrew", "he-IL", "iw"],
    ["🇮🇷 Persian", "fa-IR", "fa"],
    ["🇵🇰 Urdu", "ur-PK", "ur"],
    ["🇰🇪 Swahili", "sw-KE", "sw"],
    ["🇷🇸 Serbian", "sr-RS", "sr"],
    ["🇭🇷 Croatian", "hr-HR", "hr"],
    ["🇧🇬 Bulgarian", "bg-BG", "bg"]
];

// --- INIT ELEMENT ---
const langA = document.getElementById('langA');
const langB = document.getElementById('langB');
const btnA = document.getElementById('btnA');
const btnB = document.getElementById('btnB');
const textA = document.getElementById('textA'); // Transcript A
const transA = document.getElementById('transA'); // Terjemahan di sisi A
const textB = document.getElementById('textB'); // Transcript B
const transB = document.getElementById('transB'); // Terjemahan di sisi B
const statusDiv = document.getElementById('status');

// --- POPULATE DROPDOWNS ---
function initLanguages() {
    languages.forEach((lang, index) => {
        const optionA = new Option(lang[0], index);
        const optionB = new Option(lang[0], index);
        langA.add(optionA);
        langB.add(optionB);
    });
    
    // Default: Indonesia vs English
    langA.selectedIndex = 0; // Indonesia
    langB.selectedIndex = 1; // English
}
initLanguages();

// --- SPEECH RECOGNITION SETUP ---
let recognition;
let isListening = false;
let activeSide = null; // 'A' or 'B'

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        updateStatus("Mendengarkan...", activeSide === 'A' ? 'text-blue-400' : 'text-orange-400');
        
        if (activeSide === 'A') {
            btnA.classList.add('mic-active-blue');
            textA.innerText = "...";
            transB.innerText = ""; // Hapus hasil lama di sisi lawan
        } else {
            btnB.classList.add('mic-active-orange');
            textB.innerText = "...";
            transA.innerText = ""; // Hapus hasil lama di sisi lawan
        }
    };

    recognition.onend = () => {
        isListening = false;
        btnA.classList.remove('mic-active-blue');
        btnB.classList.remove('mic-active-orange');
        updateStatus("Memproses...", "text-white");
        
        // Ambil teks final
        const finalTranscript = (activeSide === 'A') ? textA.innerText : textB.innerText;
        
        if (finalTranscript && finalTranscript !== "...") {
            handleTranslation(finalTranscript);
        } else {
            updateStatus("Siap", "text-white");
        }
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        
        if (activeSide === 'A') textA.innerText = transcript;
        else textB.innerText = transcript;
    };

    recognition.onerror = (e) => {
        console.error(e);
        isListening = false;
        btnA.classList.remove('mic-active-blue');
        btnB.classList.remove('mic-active-orange');
        updateStatus("Error: " + e.error, "text-red-500");
    };
} else {
    alert("Browser tidak support Voice. Gunakan Chrome.");
}

// --- FUNGSI TRIGGER MIC ---
function startListening(side) {
    if (isListening) {
        recognition.stop();
        return;
    }

    activeSide = side;
    
    // Ambil data bahasa dari array berdasarkan index dropdown
    const langIndex = (side === 'A') ? langA.value : langB.value;
    const langCode = languages[langIndex][1]; // Ambil kode speech (e.g., id-ID)

    recognition.lang = langCode;
    recognition.start();
}

function updateStatus(msg, colorClass) {
    statusDiv.innerText = msg;
    statusDiv.className = `absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 px-4 py-2 rounded-full text-xs font-mono border border-white/10 z-50 pointer-events-none hidden md:block ${colorClass}`;
}

// --- CORE TRANSLATION LOGIC ---
async function handleTranslation(text) {
    // Tentukan Arah: A -> B atau B -> A
    const sourceIndex = (activeSide === 'A') ? langA.value : langB.value;
    const targetIndex = (activeSide === 'A') ? langB.value : langA.value;

    const sl = languages[sourceIndex][2]; // Kode API Source (e.g., id)
    const tl = languages[targetIndex][2]; // Kode API Target (e.g., en)
    
    // Helper Fetch
    const libreFetch = async (baseUrl, txt) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        try {
            const res = await fetch(baseUrl, {
                method: "POST",
                body: JSON.stringify({ q: txt, source: sl, target: tl, format: "text" }),
                headers: { "Content-Type": "application/json" },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error('Down');
            const json = await res.json();
            return json.translatedText;
        } catch (e) { clearTimeout(timeoutId); throw e; }
    };

    const providers = [
        { url: (t) => `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(t)}`, type: "google" },
        { url: (t) => `https://lingva.ml/api/v1/${sl}/${tl}/${encodeURIComponent(t)}`, type: "lingva" },
        { url: (t) => `https://lingva.se/api/v1/${sl}/${tl}/${encodeURIComponent(t)}`, type: "lingva" },
        { fn: (t) => libreFetch("https://translate.argosopentech.com/translate", t), type: "libre" }
    ];

    let resultText = "";

    for (const provider of providers) {
        try {
            if (provider.type === "google" || provider.type === "lingva") {
                const res = await fetch(provider.url(text));
                if (!res.ok) continue;
                const data = await res.json();
                resultText = (provider.type === "lingva") ? data.translation : data[0].map(x => x[0]).join('');
            } else {
                resultText = await provider.fn(text);
            }
            if (resultText) break;
        } catch (e) {}
    }

    if (resultText) {
        // Tampilkan Hasil di Sisi Lawan
        if (activeSide === 'A') {
            transB.innerText = resultText; // Tampilkan di area B
            speakResult(resultText, languages[targetIndex][1]); // Bicara pakai aksen B
        } else {
            transA.innerText = resultText; // Tampilkan di area A
            speakResult(resultText, languages[targetIndex][1]); // Bicara pakai aksen A
        }
        updateStatus("Selesai", "text-green-400");
    } else {
        updateStatus("Gagal Koneksi", "text-red-500");
    }
}

// --- TTS (BICARA) ---
function speakResult(text, langCode) {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}
