let token = null;

function showRegister() {
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("registerCard").classList.remove("hidden");
}

function showLogin() {
  document.getElementById("registerCard").classList.add("hidden");
  document.getElementById("loginCard").classList.remove("hidden");
}

async function register() {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

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
    alert(data.error);
  }
}

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

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
  } else {
    alert(data.error);
  }
}

async function generate() {
  const payload = {
    name: document.getElementById("name").value,
    company: document.getElementById("company").value,
    painPoint: document.getElementById("painPoint").value,
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
  } else {
    document.getElementById("result").textContent = data.error || "Erreur";
  }
}