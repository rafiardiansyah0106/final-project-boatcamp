// === MASUKKAN API KEY KAMU DI SINI ===
const API_KEY = "AIzaSyCc3A0YOc2fNfQkGoaagPQtv6hc_9DCwJU";

// ======================================
const API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY;

const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const userText = input.value.trim();
  if (!userText) return;

  appendMessage("user", userText);
  input.value = "";

  // Tampilkan bubble menunggu
  appendMessage("bot", "Mengetik...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: userText }] }
        ]
      })
    });

    const data = await response.json();

    // Hapus bubble "Mengetik..."
    chatBox.removeChild(chatBox.lastChild);

    // Ambil respon teks
    const botReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "⚠ Tidak ada respon dari API";

    appendMessage("bot", botReply);

  } catch (error) {
    console.error(error);
    appendMessage("bot", "❌ Error: API tidak bisa dihubungi!");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});