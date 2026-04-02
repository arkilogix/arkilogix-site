async function loadClient() {
  const id = getClientId();

  if (!id) {
    console.error("No ID");
    return;
  }

  let data;

  try {
    const url = "https://raw.githubusercontent.com/arkilogix/arkilogix-site/main/clients/" + id + ".txt";

    console.log("Fetching:", url);

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error("File not found: " + url);
    }

    const text = await res.text();

    if (!text) {
      throw new Error("Empty response");
    }

    data = JSON.parse(text);

    console.log("DATA LOADED:", data);

  } catch (err) {
    console.error("LOAD FAILED:", err);
    return;
  }

  // ===== RENDER =====
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

  renderServices(data.services);

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
}
