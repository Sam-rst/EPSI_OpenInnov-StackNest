const logo = document.getElementById("logo");
const logoFallback = document.getElementById("logoFallback");

const deployForm = document.getElementById("deployForm");
const templateEl = document.getElementById("template");
const vmCountEl = document.getElementById("vmCount");

const deployBtn = document.getElementById("deployBtn");
const deployBtnLabel = deployBtn.querySelector(".btn-label");
const errorBtn = document.getElementById("errorBtn");
const copyBtn = document.getElementById("copyBtn");

const statusBadge = document.getElementById("statusBadge");
const resultJson = document.getElementById("resultJson");

let currentResultText = "";

logo.addEventListener("error", () => {
  logo.hidden = true;
  logoFallback.hidden = false;
});

function setStatus(type, label) {
  statusBadge.className = `status status-${type}`;
  statusBadge.textContent = label;
}

function setLoading(isLoading) {
  deployBtn.disabled = isLoading;
  errorBtn.disabled = isLoading;
  vmCountEl.disabled = isLoading;
  templateEl.disabled = isLoading;

  deployBtn.classList.toggle("is-loading", isLoading);
  deployBtnLabel.textContent = isLoading ? "Déploiement..." : "Déployer";
}

function showJson(obj) {
  currentResultText = JSON.stringify(obj, null, 2);
  resultJson.textContent = currentResultText;
  copyBtn.disabled = false;
}

function parseCount() {
  const count = Number.parseInt(vmCountEl.value, 10);
  if (Number.isNaN(count) || count < 1) {
    return 1;
  }
  return count;
}

deployForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const template = templateEl.value;
  const count = parseCount();
  vmCountEl.value = String(count);

  setLoading(true);
  setStatus("loading", "Chargement");
  resultJson.textContent = "Appel API en cours...";
  copyBtn.disabled = true;

  try {
    const response = await fetch("/api/deploy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ template, count })
    });

    const responseBody = await response.json().catch(() => ({
      error: "invalid_json",
      message: "La réponse API n'est pas un JSON valide."
    }));

    if (!response.ok) {
      showJson(responseBody);
      setStatus("error", "Erreur");
      return;
    }

    showJson(responseBody);
    setStatus("success", "Succès");
  } catch {
    showJson({
      error: "network_error",
      message: "Impossible de joindre l'API locale /api/deploy."
    });
    setStatus("error", "Erreur");
  } finally {
    setLoading(false);
  }
});

errorBtn.addEventListener("click", () => {
  const errorPayload = {
    status: "error",
    code: "MOCK_DEPLOYMENT_FAILURE",
    message: "Échec simulé: impossible de déclencher le workflow. Réessayez dans quelques instants."
  };

  showJson(errorPayload);
  setStatus("error", "Erreur");
});

copyBtn.addEventListener("click", async () => {
  if (!currentResultText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentResultText);
    copyBtn.textContent = "Résultat copié";
  } catch {
    copyBtn.textContent = "Copie impossible";
  }

  window.setTimeout(() => {
    copyBtn.textContent = "Copier le résultat";
  }, 1200);
});
