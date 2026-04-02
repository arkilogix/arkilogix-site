console.log("APP START");

// GET CLIENT ID FROM URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// ❌ NO ID
if (!id) {
document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:50px;'>Missing Client ID</h2>";
throw new Error("No ID provided");
}

// 🔥 FETCH CLIENT DATA
fetch(`/clients/${id}.txt`)
.then(res => {
if (!res.ok) throw new Error("Client not found");
return res.text();
})
.then(text => {
const data = JSON.parse(text);

```
console.log("CLIENT DATA:", data);

// 🔥 HIDE LOADING
const loading = document.getElementById("loading");
if (loading) loading.style.display = "none";

// 🔥 HERO
const highlightImage = document.getElementById("highlightImage");
const highlightTitle = document.getElementById("highlightTitle");
const company = document.getElementById("company");

if (highlightImage) highlightImage.src = data.highlight || "";
if (highlightTitle) highlightTitle.textContent = data.highlightTitle || "";
if (company) company.textContent = data.company || "";

// 🔥 PROFILE
const profileImage = document.getElementById("profileImage");
const name = document.getElementById("name");
const position = document.getElementById("position");

if (profileImage) profileImage.src = data.profile || "";
if (name) name.textContent = data.name || "";
if (position) position.textContent = data.position || "";

// 🔥 ACTION BUTTONS
const phoneBtn = document.getElementById("phoneBtn");
const smsBtn = document.getElementById("smsBtn");
const emailBtn = document.getElementById("emailBtn");

if (phoneBtn) phoneBtn.href = "tel:" + (data.phone || "");
if (smsBtn) smsBtn.href = "sms:" + (data.phone || "");
if (emailBtn) emailBtn.href = "mailto:" + (data.email || "");

// 🔥 PORTFOLIO
const p1 = document.getElementById("project1");
const p2 = document.getElementById("project2");
const p3 = document.getElementById("project3");

if (p1) p1.src = data.portfolio1 || "";
if (p2) p2.src = data.portfolio2 || "";
if (p3) p3.src = data.portfolio3 || "";

// 🔥 SERVICES
const servicesList = document.getElementById("services");

if (servicesList) {
  servicesList.innerHTML = "";

  if (Array.isArray(data.services)) {
    data.services.forEach(service => {
      const li = document.createElement("li");
      li.textContent = service;
      servicesList.appendChild(li);
    });
  }
}
```

})
.catch(err => {
console.error(err);

```
document.body.innerHTML = `
  <h2 style="color:white;text-align:center;margin-top:50px;">
    ERROR: ${err.message}
  </h2>
`;
```

});
