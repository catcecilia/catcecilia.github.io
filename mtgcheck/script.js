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

// Fetch multiple printings + price variants of a card
async function fetchCardPrice(message) {
  try {
    const match = message.match(/price of (.+?)(?: in (.+))?$/i);
    if (!match) {
      addMessage("bot", "⚠️ Please format as 'Price of CARD' or 'Price of CARD in SET'.");
      return;
    }

    const cardName = match[1].trim();
    const setInput = match[2]?.trim();

    let query = `!"${cardName}"`;
    if (setInput) {
      // Try using set code as-is (e.g. mh2, bro)
      if (setInput.length <= 5 && /^[a-z0-9]+$/i.test(setInput)) {
        query += ` set:${setInput}`;
      } else {
        // Fall back to fuzzy set name filtering using `set_name` (not perfect, but helpful)
        query += ` "${setInput}"`;
      }
    }

    const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=usd`);
    const data = await res.json();

    if (!data || !data.data || data.data.length === 0) {
      addMessage("bot", `❌ No results for "${cardName}"${setInput ? ` in "${setInput}"` : ""}.`);
      return;
    }

    const cards = data.data.slice(0, 6);

    for (const card of cards) {
      const imageUrl =
        card.image_uris?.normal ||
        card.card_faces?.[0]?.image_uris?.normal ||
        null;

      const finishes = card.finishes?.join(", ") || "normal";
      const prices = [];
      if (card.prices.usd) prices.push(`💵 USD: $${card.prices.usd}`);
      if (card.prices.usd_foil) prices.push(`✨ Foil: $${card.prices.usd_foil}`);
      if (card.prices.usd_etched) prices.push(`🪞 Etched: $${card.prices.usd_etched}`);

      const type = card.type_line || "Unknown Type";
      const variationLabel = card.promo ? "Promo" :
        card.full_art ? "Full Art" :
        card.border_color === "borderless" ? "Borderless" :
        "Standard";

      const msg = `🃏 "${card.name}" from ${card.set_name} (${variationLabel})\n${type}\nFinish: ${finishes}\n${prices.join("\n")}`;
      addMessage("bot", msg, imageUrl);
    }

    if (cards.length === 6) {
      addMessage("bot", "⚠️ Showing top 6 results. Try narrowing your query.");
    }

  } catch (err) {
    console.error(err);
    addMessage("bot", `⚠️ Error fetching card data.`);
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

    const finishes = card.finishes?.join(", ") || "normal";
    const priceLines = [];
    if (card.prices.usd) priceLines.push(`💵 USD: $${card.prices.usd}`);
    if (card.prices.usd_foil) priceLines.push(`✨ Foil: $${card.prices.usd_foil}`);
    if (card.prices.usd_etched) priceLines.push(`🪞 Etched: $${card.prices.usd_etched}`);

    const message = `🏆 Highest value card in "${card.set_name}":\n"${card.name}" (${type})\nFinish: ${finishes}\n${priceLines.join("\n")}`;
    addMessage("bot", message, imageUrl);

  } catch (err) {
    console.error(err);
    addMessage("bot", `⚠️ Error fetching set data. Please try again.`);
  }
}

// Toggle the side menu
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