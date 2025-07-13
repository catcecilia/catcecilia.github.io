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
    // Make message lowercase for checking intent
    const lowerMessage = message.toLowerCase();

    // Strip out "price of" if it exists
    let cleaned = lowerMessage.startsWith("price of")
      ? message.slice(8).trim()
      : message.trim();

    if (!cleaned) {
      addMessage("bot", "⚠️ Please include a card name.");
      return;
    }

    // Attempt to detect "in [set]" structure
    let cardName = cleaned;
    let setInput = null;

    if (cleaned.includes(" in ")) {
      const parts = cleaned.split(" in ");
      cardName = parts[0].trim();
      setInput = parts[1].trim();
    }

    // Build Scryfall query
    let query = `!"${cardName}"`;
    if (setInput) {
      if (/^[a-z0-9]{2,5}$/i.test(setInput)) {
        // Looks like a set code (e.g. mh2, bro, neo)
        query += ` set:${setInput.toLowerCase()}`;
      } else {
        // Treat as fuzzy set name (e.g. Commander Masters)
        query += ` "${setInput}"`;
      }
    }

    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=usd`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.data || data.data.length === 0) {
      addMessage("bot", `❌ No results for "${cardName}"${setInput ? ` in "${setInput}"` : ""}.`);
      return;
    }

    const cards = data.data.slice(0, 6); // Show top 6 printings

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
    const query = `e:${setCode.toLowerCase()}`;
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=usd&dir=desc&unique=prints`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.data || data.data.length === 0) {
      addMessage("bot", `❌ Could not find cards in set "${setCode}". Make sure it's a valid set code.`);
      return;
    }

    const topCard = data.data.find(card =>
      card.prices.usd || card.prices.usd_foil || card.prices.usd_etched
    );

    if (!topCard) {
      addMessage("bot", `⚠️ No card with a known USD price found in set "${setCode}".`);
      return;
    }

    const imageUrl =
      topCard.image_uris?.normal ||
      topCard.card_faces?.[0]?.image_uris?.normal ||
      null;

    const finishes = topCard.finishes?.join(", ") || "normal";
    const prices = [];
    if (topCard.prices.usd) prices.push(`💵 USD: $${topCard.prices.usd}`);
    if (topCard.prices.usd_foil) prices.push(`✨ Foil: $${topCard.prices.usd_foil}`);
    if (topCard.prices.usd_etched) prices.push(`🪞 Etched: $${topCard.prices.usd_etched}`);

    const type = topCard.type_line || "Unknown";
    const label = topCard.promo ? "Promo" :
      topCard.full_art ? "Full Art" :
      topCard.border_color === "borderless" ? "Borderless" :
      "Standard";

    const msg = `🏆 Highest value card in "${topCard.set_name}"\n"${topCard.name}" (${type}, ${label})\nFinish: ${finishes}\n${prices.join("\n")}`;
    addMessage("bot", msg, imageUrl);

  } catch (err) {
    console.error(err);
    addMessage("bot", `⚠️ Error fetching highest value card. Try again later.`);
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