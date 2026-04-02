// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", loadClient);


// ==============================
// MAIN LOADER
// ==============================
async function loadClient() {
  const id = getClientId();
  if (!id) return showError("Missing ID");

  const url = `https://cdn.jsdelivr.net/gh/arkilogix/arkilogix-site@main/clients/${id}.txt`;

  showLoading(true);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error("Fetch failed");

    const data = await res.json();

    renderClient(data);

  } catch (e) {
    console.error(e);
    showError("Failed to load");
  }

  showLoading(false);
}

  // ==============================
  // RENDER
  // ==============================
  try {
    setText("name", data.name);
    setText("position", data.position || data.profession);
    setText("company", data.company);

    setImage("profileImage", data.profile);
    setImage("highlightImage", data.highlight);
    setText("highlightTitle", data.highlightTitle);

    setImage("project1", data.portfolio1);
    setImage("project2", data.portfolio2);
    setImage("project3", data.portfolio3);

    setLink("phoneBtn", data.phone, "tel:");
    setLink("smsBtn", data.phone, "sms:");
    setLink("emailBtn", data.email, "mailto:");

    renderServices(Array.isArray(data.services) ? data.services : []);

    setupVCard(data);

  } catch (renderErr) {
    console.error("[RENDER ERROR]", renderErr);
    showError("Error displaying profile");
  }

  showLoading(false);
}


// ==============================
// HELPERS
// ==============================

function getClientId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerText = value || "";
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (!el) return;

  if (src) {
    el.src = src;
    el.style.display = "block";
  } else {
    el.style.display = "none";
  }
}

function setLink(id, value, prefix = "") {
  const el = document.getElementById(id);
  if (!el) return;

  if (value) {
    el.href = prefix + value;
    el.style.display = "inline-block";
  } else {
    el.style.display = "none";
  }
}


// ==============================
// SERVICES RENDER
// ==============================
function renderServices(services) {
  const container = document.getElementById("services");

  if (!container) return;

  container.innerHTML = "";

  if (!services.length) {
    container.style.display = "none";
    return;
  }

  container.style.display = "block";

  services.forEach(service => {
    const div = document.createElement("div");
    div.className = "service-item";
    div.innerText = service;
    container.appendChild(div);
  });
}


// ==============================
// LOADING + ERROR UI
// ==============================
function showLoading(state) {
  const el = document.getElementById("loading");
  if (el) el.style.display = state ? "block" : "none";
}

function showError(message) {
  console.error("[UI ERROR]", message);

  const app = document.getElementById("app");

  if (app) {
    app.innerHTML = `
      <div style="padding:20px;text-align:center;">
        <h2>⚠️ Error</h2>
        <p>${message}</p>
      </div>
    `;
  }
}


// ==============================
// VCARD
// ==============================
function setupVCard(data) {
  const saveBtn = document.getElementById("saveContact");

  if (!saveBtn) return;

  saveBtn.onclick = function () {
    try {
      const vcard = generateVCard(data);

      const blob = new Blob([vcard], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = (data.name || "contact") + ".vcf";
      a.click();

      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("[VCARD ERROR]", err);
      alert("Failed to generate contact");
    }
  };
}

function generateVCard(data) {
  return `
BEGIN:VCARD
VERSION:3.0
FN:${data.name || ""}
ORG:${data.company || ""}
TITLE:${data.position || data.profession || ""}
TEL:${data.phone || ""}
EMAIL:${data.email || ""}
END:VCARD
`.trim();
}
