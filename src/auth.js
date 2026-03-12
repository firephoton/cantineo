import { ref } from 'vue'

var isLoggedIn = ref(false)

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(function (b) { return b.toString(16).padStart(2, '0') })
    .join('')
}

function hashPassword(password) {
  var bytes = new TextEncoder().encode(password)
  return window.crypto.subtle.digest('SHA-256', bytes).then(bufferToHex)
}

function login(model, loginValue, password) {
  return model.ouvrirBase()
    .then(function () { return model.creerTables() })
    .then(function () { return model.getGestionnaireParLogin(loginValue) })
    .then(function (gestionnaire) {
      if (!gestionnaire) return false
      return hashPassword(password).then(function (hash) {
        if (hash !== gestionnaire.mot_de_passe_hache) return false
        isLoggedIn.value = true
        return true
      })
    })
}

function logout() {
  isLoggedIn.value = false
}

export function useAuth() {
  return { isLoggedIn, hashPassword, login, logout }
}
