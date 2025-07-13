// Handle user chat
async function handleUserInput() {
  const inputBox = document.getElementById("user-input");
  const message = inputBox.value.trim();
  if (!message) return;

  addMessage("user", message);
  inputBox.value = "";

  const lower = message.toLowerCase();

  if (lower.includes("price of")) {
    const cardName = lower.split("price of")[1].trim();
    fetchCardPrice(cardName);
  } else if (lower.includes("highest card in")) {
    const setCode = lower.split("highest card in")[1].trim();
    fetchHighestCardInSet(setCode);
  } else {
    addMessage("bot", "🧠 Try prompts like:\n• Price of Black Lotus\n• Highest card in MH2");
  }
}

// Display chat message
function addMessage(sender, text) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Fetch card price
async function fetchCardPrice(name) {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    const card = await res.json();

    if (card.object === "error") {
      addMessage("bot", `❌ Could not find a card named "${name}".`);
      return;
    }

    const price = card.prices.usd || "Not available";
    const type = card.type_line || "Unknown";
    addMessage("bot", `💳 "${card.name}" is a ${type} from ${card.set_name}.\nCurrent USD price: $${price}`);
  } catch (err) {
    addMessage("bot", `⚠️ Error fetching card price.`);
  }
}

// Fetch highest value card in a set
async function fetchHighestCardInSet(setCode) {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/search?q=e%3A${setCode}&order=usd&dir=desc`);
    const data = await res.json();
    const card = data.data[0];

    if (!card) {
      addMessage("bot", `❌ Could not find cards for set code "${setCode}".`);
      return;
    }

    const price = card.prices.usd || "Not available";
    const type = card.type_line || "Unknown";
    addMessage("bot", `🏆 Highest value card in "${card.set_name}":\n"${card.name}" (${type}) - $${price}`);
  } catch (err) {
    addMessage("bot", `⚠️ Error fetching set information.`);
  }
}

// Menu toggle
function toggleMenu() {
  const menu = document.getElementById("side-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  document.getElementById("theme-toggle").textContent = isLight
    ? "Switch to Dark Mode"
    : "Switch to Light Mode";
}