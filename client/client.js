import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients",
  storageBucket: "arkilogix-clients.firebasestorage.app",
  messagingSenderId: "1074947351840",
  appId: "1:1074947351840:web:b077eb79963fff59316345"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ELEMENTS */
const userName = document.getElementById("userName");
const planBadge = document.getElementById("planBadge");

const cardName = document.getElementById("cardName");
const cardPosition = document.getElementById("cardPosition");
const cardServices = document.getElementById("cardServices");
const profileImage = document.getElementById("profileImage");

/* AUTH CHECK */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  loadDashboard(user);

});

/* LOAD DATA */
async function loadDashboard(user){

  const ref = doc(db, "clients", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    window.location.href = "/onboarding/index.html";
    return;
  }

  const data = snap.data();

  /* HEADER */
  userName.textContent = data.name || "User";
  planBadge.textContent = (data.plan || "basic").toUpperCase();

  /* CARD */
  cardName.textContent = data.name || "Your Name";
  cardPosition.textContent = data.position || "Your Position";

  profileImage.src = data.profileImage || "/logo.png";

  cardServices.innerHTML = "";
  (data.services || []).forEach(s => {
    const div = document.createElement("div");
    div.textContent = s;
    cardServices.appendChild(div);
  });

}

/* LOGOUT */
document.querySelector(".logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/auth/login.html";
  });
});
