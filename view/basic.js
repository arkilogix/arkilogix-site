function getClientId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const clientId = getClientId();

console.log("Client ID:", clientId);
