let token = null;

/* ---------- UI SWITCH ---------- */

function showRegister() {
  const loginCard = document.getElementById("loginCard");
  const registerCard = document.getElementById("registerCard");

  if (loginCard) loginCard.classList.add("hidden");
  if (registerCard) registerCard.classList.remove("hidden");
}

function showLogin() {
  const registerCard = document.getElementById("registerCard");
  const loginCard = document.getElementById("loginCard");

  if (registerCard) registerCard.classList.add("hidden");
  if (loginCard) loginCard.classList.remove("hidden");
}

/* ---------- REGISTER ---------- */

async function register() {
  try {
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    if (!email || !password) {
      alert("Email et mot de passe requis");
      return;
    }

    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      alert("Compte créé !");
      showLogin();
    } else {
      alert(data.error || "Erreur inscription");
    }

  } catch (err) {
    alert("Erreur réseau");
  }
}

/* ---------- LOGIN ---------- */

async function login() {
  try {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      alert("Email et mot de passe requis");
      return;
    }

    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
      token = data.token;

      document.getElementById("loginCard").classList.add("hidden");
      document.getElementById("appCard").classList.remove("hidden");

      // Initialisation affichage crédits
      const creditDisplay = document.getElementById("creditsDisplay");
      if (creditDisplay) creditDisplay.textContent = "...";

    } else {
      alert(data.error || "Erreur connexion");
    }

  } catch (err) {
    alert("Erreur réseau");
  }
}

/* ---------- GENERATE ---------- */

async function generate() {
  try {
    if (!token) {
      alert("Veuillez vous connecter.");
      return;
    }

    const leverInputs = document.querySelectorAll(".lever-input");
    const levers = Array.from(leverInputs)
      .map(input => input.value.trim())
      .filter(value => value !== "");

    const payload = {
      name: document.getElementById("name").value,
      company: document.getElementById("company").value,
      painPoint: document.getElementById("painPoint").value,
      levers: levers,
      senderName: document.getElementById("senderName").value,
      senderCompany: document.getElementById("senderCompany").value,
      senderPhone: document.getElementById("senderPhone").value
    };

    document.getElementById("result").textContent = "Génération en cours...";

    const res = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.email) {
      document.getElementById("result").textContent = data.email;

      if (typeof data.credits_remaining !== "undefined") {
        const creditDisplay = document.getElementById("creditsDisplay");
        if (creditDisplay) {
          creditDisplay.textContent = data.credits_remaining;
        }
      }

    } else {
      document.getElementById("result").textContent =
        data.error || "Erreur génération";
    }

  } catch (err) {
    document.getElementById("result").textContent = "Erreur réseau";
  }
}

/* ---------- ADD LEVER ---------- */

function addLever() {
  const container = document.getElementById("levers-container");
  if (!container) return;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Levier potentiel supplémentaire";
  input.className = "lever-input";

  container.appendChild(input);
}