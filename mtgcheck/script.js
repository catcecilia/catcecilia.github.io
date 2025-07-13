// Handle user input from chat
async function handleUserInput() {
  const inputBox = document.getElementById("user-input");
  const message = inputBox.value.trim();
  if (!message) return;

  addMessage("user", message);
  inputBox.value = "";

  const lower = message.toLowerCase();

  if (lower.includes("price of")) {
    const cardName = lower.split("price of")[1].trim();
    if (!cardName) {
      addMessage("bot", "⚠️ Please provide a card name.");
      return;
    }
    fetchCardPrice(cardName);
  } else if (lower.includes("highest card in")) {
    const setCode = lower.split("highest card in")[1].trim();
    if (!setCode) {
      addMessage("bot", "⚠️ Please provide a set code.");
      return;
    }
    fetchHighestCardInSet(setCode);
  } else {
    addMessage("bot", "🧠 Try prompts like:\n• Price of Black Lotus\n• Highest card in MH2");
  }
}

// Add a message to the chat box
function addMessage(sender, text, imageUrl = null) {
  const chatBox = document.getElementById("chat-box");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const messageText = document.createElement("div");
  messageText.textContent = text;
  messageDiv.appendChild(messageText);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Card image";
    img.style.maxWidth = "100%";
    img.style.marginTop = "8px";
    img.style.borderRadius = "6px";
    messageDiv.appendChild(img);
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Fetch card price by name from Scryfall
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
    const imageUrl =
      card.image_uris?.normal ||
      card.card_faces?.[0]?.image_uris?.normal ||
      null;

    addMessage(
      "bot",
      `💳 "${card.name}" is a ${type} from ${card.set_name}.\nCurrent USD price: $${price}`,
      imageUrl
    );
  } catch (err) {
    console.error(err);
    addMessage("bot", `⚠️ Error fetching card price. Please try again.`);
  }
}

// Fetch the highest value card in a given set
async function fetchHighestCardInSet(setCode) {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/search?q=e%3A${setCode}&order=usd&dir=desc`);
    const data = await res.json();

    const card = data.data?.[0];
    if (!card) {
      addMessage("bot", `❌ Could not find any cards for set code "${setCode}".`);
      return;
    }

    const price = card.prices.usd || "Not available";
    const type = card.type_line || "Unknown";
    const imageUrl =
      card.image_uris?.normal ||
      card.card_faces?.[0]?.image_uris?.normal ||
      null;

    addMessage(
      "bot",
      `🏆 Highest value card in "${card.set_name}":\n"${card.name}" (${type}) - $${price}`,
      imageUrl
    );
  } catch (err) {
    console.error(err);
    addMessage("bot", `⚠️ Error fetching set data. Please try again.`);
  }
}

// Toggle hamburger menu
function toggleMenu() {
  const menu = document.getElementById("side-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// Toggle dark/light mode
function toggleTheme() {
  document.body.classList.toggle("light-mode");
  const isLight = document.body.classList.contains("light-mode");
  document.getElementById("theme-toggle").textContent = isLight
    ? "Switch to Dark Mode"
    : "Switch to Light Mode";
}