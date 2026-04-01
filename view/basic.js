function getClientId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchClientData(id) {
  try {
    const response = await fetch(`/arkilogix-site/clients/${id}.json`);

    if (!response.ok) {
      throw new Error("File not found");
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("ERROR:", error);
    return null;
  }
}

async function init() {
  const id = getClientId();
  console.log("Client ID:", id);

  const data = await fetchClientData(id);
  console.log("Client Data:", data);
}

init();
