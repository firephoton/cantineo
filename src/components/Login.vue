<template>
  <div class="w-full min-h-screen flex flex-col items-center justify-center p-4 box-border bg-slate-900">
    <div class="w-full max-w-md flex flex-col gap-4">
      <h1 class="text-2xl font-bold text-white mb-2">{{ creationPremier ? 'Créer le premier compte' : 'Connexion' }}</h1>
      <form v-if="creationPremier" @submit.prevent="creerPremier" class="flex flex-col gap-4">
        <label class="text-white font-bold">Identifiant</label>
        <input v-model="login" type="text" placeholder="identifiant" required class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg">
        <label class="text-white font-bold">Mot de passe</label>
        <input v-model="motDePasse" type="password" placeholder="Mot de passe" required class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg">
        <button type="submit" class="bg-blue-400 text-slate-900 w-full p-4 rounded-lg text-xl font-bold">Créer le compte</button>
      </form>
      <form v-else @submit.prevent="connexion" class="flex flex-col gap-4">
        <label class="text-white font-bold">Identifiant</label>
        <input v-model="login" type="text" placeholder="identifiant" required class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg">
        <label class="text-white font-bold">Mot de passe</label>
        <input v-model="motDePasse" type="password" placeholder="Mot de passe" required class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg">
        <button type="submit" class="bg-blue-400 text-slate-900 w-full p-4 rounded-lg text-xl font-bold">Se connecter</button>
      </form>
      <p v-if="erreurConnexion" class="text-red-300 text-sm">{{ erreurConnexion }}</p>
    </div>
  </div>
</template>

<script setup>
// --- Imports ---
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDatabase } from './sqlite.js'
import { useAuth } from '../auth.js'

// --- Router, base de données et auth ---
var router = useRouter()
var model = useDatabase()
var auth = useAuth()

// --- Données (formulaire) ---
var login = ref('')
var motDePasse = ref('')
var creationPremier = ref(false)
var erreurConnexion = ref('')

// --- Initialisation ---
function verifierPremierCompte() {
  model.ouvrirBase().then(function () {
    return model.creerTables()
  }).then(function () {
    return model.listerGestionnaires()
  }).then(function (liste) {
    if (liste && liste.length === 0) creationPremier.value = true
  }).catch(function () {
    erreurConnexion.value = 'Impossible d\'ouvrir la base locale. Vérifie la plateforme de lancement.'
  })
}

// --- Actions ---
function connexion() {
  erreurConnexion.value = ''
  auth.connecterUtilisateur(model, login.value, motDePasse.value).then(function (ok) {
    if (ok) router.push('/')
    else erreurConnexion.value = 'Connexion impossible. Vérifie tes identifiants ou la base locale.'
  })
}

function creerPremier() {
  erreurConnexion.value = ''
  auth.hasherMotDePasse(motDePasse.value).then(function (hash) {
    model.ajouterGestionnaire(login.value, hash).then(function () {
      auth.connecterUtilisateur(model, login.value, motDePasse.value).then(function (ok) {
        if (ok) router.push('/')
        else erreurConnexion.value = 'Le compte est créé mais la connexion a échoué.'
      })
    })
  }).catch(function () {
    erreurConnexion.value = 'Impossible de créer le compte (base locale indisponible).'
  })
}

// --- Lifecycle ---
onMounted(function () {
  verifierPremierCompte()
})
</script>
