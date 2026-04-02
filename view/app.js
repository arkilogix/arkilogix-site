console.log("APP.JS LOADED");

async function loadClient() {
  alert("loadClient running");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.body.innerHTML = "Missing ID";
    return;
  }

  const url = `https://cdn.jsdelivr.net/gh/arkilogix/arkilogix-site@main/clients/${id}.txt?v=${Date.now()}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Fetch failed");
    }

    const data = await res.json();

    console.log("DATA:", data);

    document.getElementById("name").innerText = data.name || "NO NAME";

  } catch (e) {
    console.error(e);
    document.body.innerHTML = "FAILED TO LOAD";
  }
}

loadClient();
