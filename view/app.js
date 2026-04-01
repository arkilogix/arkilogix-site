function getClientId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function setLink(id, value, prefix = "") {
  const el = document.getElementById(id);
  if (!el) return;

  if (value) {
    el.href = prefix + value;
  } else {
    el.style.display = "none";
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  if (value) {
    el.innerText = value;
  } else {
    el.style.display = "none";
  }
}

function setImage(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  if (value) {
    el.src = value;

    // safe fallback if image fails
    el.onerror = () => {
      el.style.display = "none";
    };

  } else {
    el.style.display = "none";
  }
}

function renderServices(list) {
  const container = document.getElementById("services");
  if (!container || !list) return;

  list.forEach(service => {
    const div = document.createElement("div");
    div.className = "service";
    div.innerText = service;
    container.appendChild(div);
  });
}

async function loadClient() {
  const id = getClientId();

  // ❌ no id → stop loader
  if (!id) {
    console.error("No ID found in URL");

    const loader = document.getElementById("loader");
    if (loader) loader.style.display = "none";
    return;
  }

  try {
    const res = await fetch(`/clients/${id}.json`);
    if (!res.ok) throw new Error("Not found");

    const data = await res.json();
const saveBtn = document.getElementById("saveContact");

if (saveBtn) {
  saveBtn.onclick = function () {
    const vcard = generateVCard(data);

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = (data.name || "contact") + ".vcf";
    a.click();

    URL.revokeObjectURL(url);
  };
}
    // TEXT
    setText("name", data.name);
    setText("position", data.position || data.profession);
    setText("company", data.company);

    // IMAGE
    setImage("profile", data.profile);

    // CONTACT
    setLink("phoneLink", data.phone, "tel:");
    setLink("smsLink", data.phone, "sms:");
    setLink("emailLink", data.email, "mailto:");

    // SOCIALS
    setLink("facebook", data.facebook);
    setLink("instagram", data.instagram);
    setLink("portfolio", data.portfolio);
    setLink("companyProfile", data.companyProfile);

    // SERVICES
    renderServices(data.services);

  } catch (err) {
    console.error("ERROR:", err);
  }

  // ✅ ALWAYS HIDE LOADER
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";

  // ✅ FORCE SHOW CARD (no animation bug)
  const card = document.querySelector(".card");
  if (card) {
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }
}
function generateVCard(data) {
  return `BEGIN:VCARD
VERSION:3.0
FN:${data.name || ""}
ORG:${data.company || ""}
TITLE:${data.position || data.profession || ""}
TEL:${data.phone || ""}
EMAIL:${data.email || ""}
END:VCARD`;
}

// ✅ RUN AFTER PAGE LOAD (IMPORTANT)
window.addEventListener("DOMContentLoaded", () => {
  loadClient();
});
