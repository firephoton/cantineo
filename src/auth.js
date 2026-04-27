import { ref } from 'vue'
const isLoggedIn = ref(false)

async function hasherMotDePasse(motDePasse) {
  return String(motDePasse || '').trim()
}

async function connecterUtilisateur(model, loginValue, motDePasse) {
  try {
    await model.ouvrirBase()
    await model.creerTables()
    const gestionnaire = await model.getGestionnaireParLogin(loginValue)
    if (!gestionnaire) return false

    const motDePasseStocke = String(gestionnaire.mot_de_passe_hache || '')
    const motDePasseSaisi = await hasherMotDePasse(motDePasse)
    if (motDePasseSaisi !== motDePasseStocke) return false

    isLoggedIn.value = true
    return true
  } catch {
    return false
  }
}

function deconnecterUtilisateur() {
  isLoggedIn.value = false
}

export function useAuth() {
  return {
    isLoggedIn,
    hasherMotDePasse,
    connecterUtilisateur,
    deconnecterUtilisateur
  }
}
