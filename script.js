// --- KONFIGURASI UI ---
const micBtn = document.getElementById('micBtn');
const transcriptText = document.getElementById('transcriptText');
const translatedText = document.getElementById('translatedText');
const statusText = document.getElementById('statusText');
const waveAnim = document.getElementById('waveAnim');
const loadingIndicator = document.getElementById('loadingIndicator');

// Dropdown Bahasa
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');

let isListening = false;
let recognition;

// --- 1. SETUP PENDENGARAN (SPEECH RECOGNITION) ---
// Cek apakah browser mendukung fitur ini
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = false; // Stop otomatis setelah kalimat selesai
    recognition.interimResults = true; // Tampilkan teks sambil bicara (real-time)
    recognition.maxAlternatives = 1;

    // Saat mulai bicara
    recognition.onstart = () => {
        isListening = true;
        // Efek Visual
        micBtn.classList.add('mic-active'); // Efek denyut merah
        waveAnim.classList.remove('opacity-0'); // Munculkan gelombang
        
        statusText.innerText = "Mendengarkan...";
        statusText.className = "text-xs text-red-400 mt-4 font-mono animate-pulse";
        
        transcriptText.innerText = ""; // Bersihkan teks lama
        translatedText.innerText = "...";
    };

    // Saat selesai bicara (mic mati otomatis)
    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('mic-active');
        waveAnim.classList.add('opacity-0');

        const textToTranslate = transcriptText.innerText;

        // Cek jika ada suara yang tertangkap
        if (textToTranslate && textToTranslate !== '"Tekan mikrofon untuk bicara..."') {
            statusText.innerText = "Menerjemahkan...";
            statusText.className = "text-xs text-cyan-400 mt-4 font-mono";
            processTranslation(textToTranslate); // Kirim ke translate engine
        } else {
            statusText.innerText = "Suara tidak terdengar. Coba lagi.";
            statusText.className = "text-xs text-slate-500 mt-4 font-mono";
        }
    };

    // Saat hasil suara didapat
    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
        transcriptText.innerText = `"${transcript}"`;
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        statusText.innerText = "Error: " + event.error;
        micBtn.classList.remove('mic-active');
        waveAnim.classList.add('opacity-0');
        isListening = false;
    };

} else {
    alert("Browser ini tidak mendukung fitur Suara. Gunakan Google Chrome atau Edge.");
    micBtn.disabled = true;
}

// --- FUNGSI TOMBOL MIC ---
function toggleListening() {
    if (isListening) {
        recognition.stop();
    } else {
        // Ambil kode bahasa untuk suara (bagian kiri sebelum tanda |)
        // Contoh: "id-ID|id" -> Kita ambil "id-ID"
        const langCode = sourceLangSelect.value.split('|')[0];
        recognition.lang = langCode; 
        recognition.start();
    }
}


// --- 2. ENGINE TERJEMAHAN (MULTI-SERVER) ---
async function processTranslation(text) {
    loadingIndicator.classList.remove('hidden');
    
    // Ambil kode bahasa untuk API Translate (bagian kanan setelah tanda |)
    // Contoh: "id-ID|id" -> Kita ambil "id"
    const sl = sourceLangSelect.value.split('|')[1]; 
    const tl = targetLangSelect.value.split('|')[1];

    // Helper Fetch untuk API yang butuh POST
    const libreFetch = async (baseUrl, txt) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout 3 detik
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

    // DAFTAR SERVER (Campuran Cepat & Stabil)
    const providers = [
        // Google Family (Cepat)
        { url: (t) => `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(t)}`, type: "google" },
        { url: (t) => `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(t)}`, type: "google" },
        
        // Lingva Family (Stabil)
        { url: (t) => `https://lingva.ml/api/v1/${sl}/${tl}/${encodeURIComponent(t)}`, type: "lingva" },
        { url: (t) => `https://lingva.se/api/v1/${sl}/${tl}/${encodeURIComponent(t)}`, type: "lingva" },
        { url: (t) => `https://translate.ploud.jp/api/v1/${sl}/${tl}/${encodeURIComponent(t)}`, type: "lingva" },
        
        // Libre Family (Cadangan)
        { fn: (t) => libreFetch("https://translate.argosopentech.com/translate", t), type: "libre" },
        { fn: (t) => libreFetch("https://de.libretranslate.com/translate", t), type: "libre" }
    ];

    let resultText = "";
    
    // Loop Server
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
            
            if (resultText) break; // Jika berhasil, stop loop
        } catch (e) {
            console.log("Server skip...");
        }
    }

    loadingIndicator.classList.add('hidden');

    if (resultText) {
        translatedText.innerText = resultText;
        statusText.innerText = "Selesai";
        statusText.className = "text-xs text-green-400 mt-4 font-mono";
        
        // --- 3. AUTO SPEAK (BICARA OTOMATIS) ---
        speakResult(resultText);
    } else {
        translatedText.innerText = "Gagal Terjemah";
        statusText.innerText = "Koneksi Error";
        statusText.className = "text-xs text-red-500 mt-4 font-mono";
    }
}

// --- FUNGSI TEXT-TO-SPEECH ---
function speakResult(text) {
    if (!text) return;
    
    // Hentikan suara sebelumnya jika ada
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Ambil kode bahasa suara tujuan (bagian kiri sebelum tanda |)
    // Contoh: "en-US|en" -> Kita ambil "en-US" agar aksennya benar
    const langCodeSpeech = targetLangSelect.value.split('|')[0];
    
    utterance.lang = langCodeSpeech;
    utterance.rate = 1.0; // Kecepatan normal
    utterance.pitch = 1.0; // Nada normal

    window.speechSynthesis.speak(utterance);
}
