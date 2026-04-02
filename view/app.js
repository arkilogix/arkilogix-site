// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", loadClient);


// ==============================
// MAIN LOADER
// ==============================
async function loadClient() {
  const id = getClientId();

  console.log("[INIT] Client ID:", id);

  if (!id) {
    showError("Missing client ID");
    return;
  }

  const urls = [
    `https://cdn.jsdelivr.net/gh/arkilogix/arkilogix-site@main/clients/${id}.txt`,
    `https://raw.githubusercontent.com/arkilogix/arkilogix-site/main/clients/${id}.txt`
  ];

  let data = null;

  showLoading(true);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    try {
      console.log("[FETCH] Trying:", url);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        cache: "no-store",
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();

      if (!text || text.trim() === "") {
        throw new Error("Empty response");
      }

      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("[PARSE ERROR]", parseErr);
        throw new Error("Invalid JSON format");
      }

      console.log("[SUCCESS] Data loaded:", data);

      break;

    } catch (err) {
      console.warn(`[FETCH FAILED ${i + 1}]`, err);

      if (i === urls.length - 1) {
        showError("Unable to load profile");
        showLoading(false);
        return;
      }
    }
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
