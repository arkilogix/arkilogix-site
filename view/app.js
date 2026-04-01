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
  if (!id) return;

  try {
    const res = await fetch(`/clients/${id}.json`);
    if (!res.ok) throw new Error("Not found");

    const data = await res.json();

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
}

loadClient();
