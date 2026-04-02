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

  container.innerHTML = "";

  list.forEach(service => {
    const li = document.createElement("li");
    li.innerText = service;
    container.appendChild(li);
  });
}

async function loadClient() {
  const id = getClientId();

  if (!id) {
    console.error("No ID found in URL");
    return;
  }

  let data = null;

  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/arkilogix/arkilogix-site/main/clients/" + id + ".txt"
    );

    data = await res.json();

  } catch (err) {
    console.error("LOAD ERROR:", err);
    return;
  }

  if (!data) {
    console.error("No data found");
    return;
  }

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

  // IMAGES
  setImage("profileImage", data.profile);
  setImage("highlightImage", data.highlight);
  setText("highlightTitle", data.highlightTitle);

  setImage("project1", data.portfolio1);
  setImage("project2", data.portfolio2);
  setImage("project3", data.portfolio3);

  // CONTACT
  setLink("phoneBtn", data.phone, "tel:");
  setLink("smsBtn", data.phone, "sms:");
  setLink("emailBtn", data.email, "mailto:");

  // SOCIALS
  setLink("facebook", data.facebook);
  setLink("instagram", data.instagram);
  setLink("portfolio", data.portfolio);
  setLink("companyProfile", data.companyProfile);

  // SERVICES
  renderServices(data.services);
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

window.addEventListener("DOMContentLoaded", () => {
  loadClient();
});
