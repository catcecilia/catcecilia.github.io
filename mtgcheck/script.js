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
function addLoadingMessage(id = "loading") {
  const chatBox = document.getElementById("chat-box");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message bot loading";
  loadingDiv.id = id;

  const loadingText = document.createElement("div");
  loadingText.textContent = "Fetching data...";
  loadingDiv.appendChild(loadingText);

  const spinner = document.createElement("div");
  spinner.className = "spinner";
  loadingDiv.appendChild(spinner);

  chatBox.appendChild(loadingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoadingMessage(id = "loading") {
  const loadingDiv = document.getElementById(id);
  if (loadingDiv) loadingDiv.remove();
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
  addLoadingMessage(); // 👈 show spinner
  try {
    const query = `e:${setCode.toLowerCase()}`;
    const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`;
    let res = await fetch(url);
    let data = await res.json();

    if (!data || !data.data || data.data.length === 0) {
      removeLoadingMessage();
      addMessage("bot", `❌ Could not find cards in set "${setCode}".`);
      return;
    }

    let cards = data.data;
    let nextPage = data.has_more ? data.next_page : null;

    while (nextPage) {
      const moreRes = await fetch(nextPage);
      const moreData = await moreRes.json();
      cards = cards.concat(moreData.data);
      nextPage = moreData.has_more ? moreData.next_page : null;
    }

    let highestCard = null;
    let highestPrice = 0;

    for (const card of cards) {
      const prices = [card.prices.usd, card.prices.usd_foil, card.prices.usd_etched]
        .map(p => parseFloat(p))
        .filter(p => !isNaN(p));

      const maxCardPrice = Math.max(...prices, 0);
      if (maxCardPrice > highestPrice) {
        highestPrice = maxCardPrice;
        highestCard = card;
      }
    }

    removeLoadingMessage(); // 👈 hide spinner

    if (!highestCard) {
      addMessage("bot", `⚠️ No cards with valid prices in "${setCode}".`);
      return;
    }

    const imageUrl =
      highestCard.image_uris?.normal ||
      highestCard.card_faces?.[0]?.image_uris?.normal ||
      null;

    const finishes = highestCard.finishes?.join(", ") || "normal";

    const prices = [];
    if (highestCard.prices.usd) prices.push(`💵 USD: $${highestCard.prices.usd}`);
    if (highestCard.prices.usd_foil) prices.push(`✨ Foil: $${highestCard.prices.usd_foil}`);
    if (highestCard.prices.usd_etched) prices.push(`🪞 Etched: $${highestCard.prices.usd_etched}`);

    const msg = `🏆 Highest-value print in "${highestCard.set_name}":\n"${highestCard.name}"\nFinish: ${finishes}\n${prices.join("\n")}`;
    addMessage("bot", msg, imageUrl);

  } catch (err) {
    removeLoadingMessage(); // 👈 hide spinner on error
    console.error(err);
    addMessage("bot", `⚠️ Error fetching highest card. Try again later.`);
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