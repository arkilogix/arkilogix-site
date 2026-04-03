import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("clientsContainer");

async function loadClients() {
  const snapshot = await getDocs(collection(db, "clients"));

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const link = `/view/${data.plan}.html?id=${id}`;

    container.innerHTML += `
      <div class="card">
        <h3>${data.name}</h3>
        <p>${data.position || ""}</p>
        <p><b>${data.plan.toUpperCase()}</b></p>

        <p>Views: ${data.views || 0}</p>
        <p>Last: ${data.lastViewed || "-"}</p>

        <a href="${link}" target="_blank">Open</a>

        <button onclick="editClient('${id}')">Edit</button>
        <button onclick="deleteClient('${id}')">Delete</button>
      </div>
    `;
  });
}

loadClients();
