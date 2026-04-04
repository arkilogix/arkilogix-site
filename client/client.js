// (same imports — unchanged)

/* STATE */
let currentData = {};
let profileImageUrl = "";

/* FIREBASE INIT */
// (same config — unchanged)

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ELEMENTS */
const userName = document.getElementById("userName");
const planBadge = document.getElementById("planBadge");

const cardName = document.getElementById("cardName");
const cardPosition = document.getElementById("cardPosition");
const cardServices = document.getElementById("cardServices");

const viewsEl = document.getElementById("views");
const tapsEl = document.getElementById("taps");
const clicksEl = document.getElementById("clicks");

const upgradeBtn = document.getElementById("upgradeBtn");

/* AUTH */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "/auth/login.html";
      }
    }, 300);
    return;
  }

  loadDashboard(user);
});

/* LOAD DASHBOARD */
async function loadDashboard(user){

  const docSnap = await getDoc(doc(db, "clients", user.uid));

  if (!docSnap.exists()) {
    window.location.href = "/onboarding/index.html";
    return;
  }

  const data = docSnap.data();

  currentData = data;
  profileImageUrl = data.profileImage || "";

  /* UI */
  userName.textContent = data.name || "User";
  planBadge.textContent = (data.plan || "basic").toUpperCase();

  cardName.textContent = data.name;
  cardPosition.textContent = data.position;

  /* SERVICES */
  cardServices.innerHTML = "";
  (data.services || []).forEach(s => {
    const div = document.createElement("div");
    div.textContent = s;
    cardServices.appendChild(div);
  });

  /* LINKS */
  renderLinks();

  document.getElementById("modalImage").src = profileImageUrl || "/logo.png";

  /* STATS */
  const stats = data.stats || {};

  const views = stats.views || 0;
  const taps = stats.taps || 0;
  const clicks = stats.clicks || 0;

  viewsEl.textContent = views;
  tapsEl.textContent = taps;
  clicksEl.textContent = clicks;

  const max = Math.max(views, taps, clicks, 1);

  document.getElementById("viewsBar").style.width = (views / max * 100) + "%";
  document.getElementById("tapsBar").style.width = (taps / max * 100) + "%";
  document.getElementById("clicksBar").style.width = (clicks / max * 100) + "%";

  applyPlan(data.plan || "basic");
}

/* PLAN */
// (unchanged)

/* MODAL */
// (unchanged)

/* SERVICES EDIT */
// (unchanged)

/* CLOUDINARY */
// (unchanged)

/* VIEW CARD */
// (unchanged)

/* STRENGTH */
// (unchanged)

/* SAVE PROFILE */
// (unchanged)

/* ========================= */
/* 🔥 LINKS SYSTEM (FIXED) */
/* ========================= */

const LINK_TYPES = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" }
];

function renderLinks(){
  const container = document.getElementById("linksContainer");
  if(!container) return;

  container.innerHTML = "";

  (currentData.links || []).forEach(l => addLink(l));
}

function addLink(data = {}){
  const container = document.getElementById("linksContainer");

  if((currentData.plan || "basic") === "basic"){
    alert("Upgrade to Pro to use links");
    return;
  }

  if(container.children.length >= 5 && currentData.plan === "pro"){
    alert("Pro plan max 5 links");
    return;
  }

  const div = document.createElement("div");
  div.className = "link-row";

  div.innerHTML = `
    <select>
      ${LINK_TYPES.map(t =>
        `<option value="${t.value}" ${data.type === t.value ? "selected" : ""}>${t.label}</option>`
      ).join("")}
    </select>

    <input placeholder="Enter URL" value="${data.url || ""}">

    <button onclick="this.parentElement.remove()">x</button>
  `;

  container.appendChild(div);
}

async function saveLinks(){

  const rows = document.querySelectorAll(".link-row");

  const links = [...rows].map(r => {
    const type = r.querySelector("select").value;
    const url = r.querySelector("input").value;

    return { type, url };
  }).filter(l => l.url);

  await updateDoc(doc(db, "clients", auth.currentUser.uid), {
    links
  });

  currentData.links = links;

  alert("Links saved");
}

window.addLink = addLink;
window.saveLinks = saveLinks;

/* LOGOUT */
document.querySelector(".logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/auth/login.html";
  });
});
