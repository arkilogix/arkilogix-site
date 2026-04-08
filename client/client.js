import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* STATE */
let currentData = {};

/* AUTH */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  loadDashboard(user);
});

/* LOAD DASHBOARD */
async function loadDashboard(user){

  const q = query(
    collection(db, "clients"),
    where("uid", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  if(snapshot.empty){
    console.warn("No client linked");
    return;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  currentData = data;

  // HEADER
  document.getElementById("userName").textContent = data.name || "User";
  document.getElementById("planBadge").textContent = (data.plan || "basic").toUpperCase();

  // PROFILE
  const img = data.profile || "/logo.png";
  document.getElementById("headerProfile").src = img;
  document.getElementById("heroProfile").src = img;

  // CARD
  document.getElementById("cardName").textContent = data.name || "Name";
  document.getElementById("cardPosition").textContent = data.position || "Position";

  const servicesEl = document.getElementById("cardServices");
  servicesEl.innerHTML = "";

  (data.services || []).forEach(s=>{
    const span = document.createElement("span");
    span.textContent = s;
    servicesEl.appendChild(span);
  });

  // STATUS
  const status = data.status || "processing";
  const statusText = status === "completed" ? "Live" : "Processing";
  document.getElementById("statusText").textContent = "Status: " + statusText;

}

/* VIEW CARD (FIXED PLAN ROUTING) */
window.viewCard = function(){

  const plan = currentData.plan || "basic";

  let page = "basic.html";

  if(plan === "pro") page = "pro.html";
  if(plan === "elite") page = "elite.html";

  const q = new URLSearchParams(window.location.search);
  const id = q.get("id") || "";

  window.open(`/view/${page}?id=${id}`, "_blank");
};

/* LOGOUT */
document.querySelector(".logout").onclick = ()=>{
  signOut(auth).then(()=>{
    window.location.href = "/auth/login.html";
  });
};
