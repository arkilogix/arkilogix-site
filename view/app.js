// 🔥 DEBUG START
console.log("APP JS LOADED");

try {

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  console.log("Client ID:", id);

  if (!id) {
    document.body.innerHTML = "Missing ID";
    throw new Error("No ID");
  }

  fetch(`/arkilogix-site/clients/${id}.txt`)
    .then(res => {
      if (!res.ok) throw new Error("Client file not found");
      return res.text();
    })
    .then(text => {
      const data = JSON.parse(text);
      console.log("DATA:", data);

      // 🔥 HIDE LOADING
      document.getElementById("loading").style.display = "none";

      // 🔥 HERO
      document.getElementById("highlightImage").src = data.highlightImage || "";
      document.getElementById("highlightTitle").textContent = data.highlightTitle || "";
      document.getElementById("company").textContent = data.company || "";

      // 🔥 PROFILE
      document.getElementById("profileImage").src = data.profileImage || "";
      document.getElementById("name").textContent = data.name || "";
      document.getElementById("position").textContent = data.position || "";

      // 🔥 ACTION BUTTONS
      document.getElementById("phoneBtn").href = "tel:" + (data.phone || "");
      document.getElementById("smsBtn").href = "sms:" + (data.phone || "");
      document.getElementById("emailBtn").href = "mailto:" + (data.email || "");

      // 🔥 PROJECTS
      document.getElementById("project1").src = data.project1 || "";
      document.getElementById("project2").src = data.project2 || "";
      document.getElementById("project3").src = data.project3 || "";

      // 🔥 SERVICES
      const servicesList = document.getElementById("services");
      servicesList.innerHTML = "";

      if (data.services && Array.isArray(data.services)) {
        data.services.forEach(service => {
          const li = document.createElement("li");
          li.textContent = service;
          servicesList.appendChild(li);
        });
      }

    })
    .catch(err => {
      console.error(err);
      document.body.innerHTML = "<h2 style='color:white;text-align:center;padding:20px;'>ERROR: " + err.message + "</h2>";
    });

} catch (err) {
  document.body.innerHTML = "<pre style='color:white'>" + err + "</pre>";
}
