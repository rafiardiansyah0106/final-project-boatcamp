// ====== CLIENT-SIDE GUARDRAILS / LIMITATIONS ======
const API_KEY = "AIzaSyCc3A0YOc2fNfQkGoaagPQtv6hc_9DCwJU";

const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY;

// --------- THEME LOCK (sesuaikan dengan tema chatbot-mu) ----------
const THEME_NAME = "Konsultasi Jadwal Kuliah UPNVJT";
const THEME_KEYWORDS = [
  "krs", "jadwal", "matkul", "kelas", "dosen", "ruang",
  "siamik", "pengisian krs", "konflik jadwal", "semester", "upnvjt"
];

// Penolakan di luar tema
const OUT_OF_SCOPE_REPLY =
  "Maaf, aku khusus membantu **" + THEME_NAME +
  "**. Coba ajukan pertanyaan seputar jadwal kuliah, KRS, konflik jam, atau hal akademik UPNVJT ya.";

// Profanity/unsafe (contoh sederhana – boleh tambah)
const BLOCKED_PATTERNS = [
  /kartu kredit|otp|password|akun|login/i,       // data sensitif
  /cara hack|retas|phishing|ddos|bypass/i,       // misuse
  /sara|ujaran kebencian|porn|seks|dewasa/i      // inappropriate (kasar)
];

// Rate limit & panjang pesan
const COOLDOWN_MS = 3000;           // jeda min. 3 detik antar kirim
const MAX_USER_CHARS = 300;         // maksimal 300 karakter per input
let lastSentAt = 0;

// --------- UI HOOKS ----------
const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = text; // kita izinkan HTML ringan untuk bold/italic pada balasan
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function isOnTheme(text) {
  const t = text.toLowerCase();
  return THEME_KEYWORDS.some(k => t.includes(k.toLowerCase()));
}

function violatesBlocked(text) {
  return BLOCKED_PATTERNS.some(re => re.test(text));
}

function now() { return Date.now(); }

// --------- KIRIM PESAN ----------
async function sendMessage() {
  const ts = now();
  if (ts - lastSentAt < COOLDOWN_MS) {
    appendMessage("bot", "Tunggu sebentar ya… (anti-spam aktif).");
    return;
  }

  let userText = input.value.trim();
  if (!userText) return;

  if (userText.length > MAX_USER_CHARS) {
    appendMessage("bot", `Pesan kamu kepanjangan (${userText.length} karakter). Potong jadi ≤ ${MAX_USER_CHARS} ya.`);
    return;
  }

  // Limitation: blok konten berbahaya/privasi
  if (violatesBlocked(userText)) {
    appendMessage("bot", "Permintaan ditolak karena melanggar kebijakan privasi/keamanan. Jangan minta data sensitif atau hal berbahaya ya.");
    return;
  }

  // Limitation: wajib sesuai tema
  if (!isOnTheme(userText)) {
    appendMessage("user", userText);
    input.value = "";
    appendMessage("bot", OUT_OF_SCOPE_REPLY);
    return;
  }

  appendMessage("user", userText);
  input.value = "";

  // Tampilkan bubble menunggu
  appendMessage("bot", "Mengetik...");

  lastSentAt = ts;

  // System prompt (kita sisipkan sebagai instruksi di awal)
  const SYSTEM_PROMPT =
`Kamu adalah asisten untuk **${THEME_NAME}**.
Batasan:
- Jawab hanya topik jadwal kuliah/KRS/akademik UPNVJT.
- Jika di luar tema, tolak secara sopan dan arahkan kembali.
- Jawab singkat, maksimum 5 kalimat + langkah terstruktur jika perlu.
- Jangan memproses atau meminta data sensitif (OTP, password, nomor kartu, dsb).
- Jika informasi tidak pasti, katakan tidak yakin dan beri saran langkah berikutnya.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userText}` }]
          }
        ]
      })
    });

    const data = await response.json();

    // Hapus bubble "Mengetik..."
    chatBox.removeChild(chatBox.lastChild);

    const botReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "⚠ Tidak ada respon dari API";

    // Tambahan: jika model keluar tema, paksa arahkan balik
    const finalReply = isOnTheme(botReply)
      ? botReply
      : OUT_OF_SCOPE_REPLY;

    appendMessage("bot", finalReply);

  } catch (error) {
    console.error(error);
    // Ganti bubble "Mengetik..." jika masih ada
    if (chatBox.lastChild?.textContent === "Mengetik...") {
      chatBox.removeChild(chatBox.lastChild);
    }
    appendMessage("bot", "❌ Error: API tidak bisa dihubungi! Coba cek koneksi atau kunci API.");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
