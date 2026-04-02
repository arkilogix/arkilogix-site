console.log("APP START");

// GET ID
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  document.body.innerHTML = "Missing ID";
  throw new Error("No ID");
}

// FETCH DATA
fetch(`/arkilogix-site/clients/${id}.txt`)
  .then(res => {
    if (!res.ok) throw new Error("Client not found");
    return res.text();
  })
  .then(text => {
    const data = JSON.parse(text);

    console.log("DATA:", data);

    // HIDE LOADING
    document.getElementById("loading").style.display = "none";

    // HERO
    document.getElementById("highlightImage").src = data.highlight || "";
    document.getElementById("highlightTitle").textContent = data.highlightTitle || "";
    document.getElementById("company").textContent = data.company || "";

    // PROFILE
    document.getElementById("profileImage").src = data.profile || "";
    document.getElementById("name").textContent = data.name || "";
    document.getElementById("position").textContent = data.position || "";

    // ACTIONS
    document.getElementById("phoneBtn").href = "tel:" + (data.phone || "");
    document.getElementById("smsBtn").href = "sms:" + (data.phone || "");
    document.getElementById("emailBtn").href = "mailto:" + (data.email || "");

    // PORTFOLIO
    document.getElementById("project1").src = data.portfolio1 || "";
    document.getElementById("project2").src = data.portfolio2 || "";
    document.getElementById("project3").src = data.portfolio3 || "";

    // SERVICES
    const list = document.getElementById("services");
    list.innerHTML = "";

    if (Array.isArray(data.services)) {
      data.services.forEach(s => {
        const li = document.createElement("li");
        li.textContent = s;
        list.appendChild(li);
      });
    }
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML =
      "<h2 style='color:white;text-align:center;padding:20px;'>ERROR: " + err.message + "</h2>";
  });
