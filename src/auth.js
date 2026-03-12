import { ref } from 'vue'
var isLoggedIn = ref(false)

function convertirEnHex(donneesBrutes) {
  var vue = new DataView(donneesBrutes)
  var resultat = ''

  for (var i = 0; i < vue.byteLength; i++) {
    var valeur = vue.getUint8(i)

    if (valeur < 16) {
      resultat += '0'
    }
    resultat += valeur.toString(16)
  }

  return resultat
}

function hasherMotDePasse(motDePasse) {
  var encoder = new TextEncoder()
  var octets = encoder.encode(motDePasse)

  return window.crypto.subtle.digest('SHA-256', octets).then(function (donneesHash) {
    return convertirEnHex(donneesHash)
  })
}

function connecterUtilisateur(model, loginValue, motDePasse) {
  return model.ouvrirBase()
    .then(function () {
      return model.creerTables()
    })
    .then(function () {
      return model.getGestionnaireParLogin(loginValue)
    })
    .then(function (gestionnaire) {
      if (!gestionnaire) {
        return Promise.resolve(false)
      }

      return hasherMotDePasse(motDePasse).then(function (hash) {
        if (hash !== gestionnaire.mot_de_passe_hache) {
          return false
        }
        isLoggedIn.value = true
        return true
      })
    })
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
