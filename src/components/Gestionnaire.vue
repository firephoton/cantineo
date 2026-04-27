<template>
  <div class="w-full min-h-full overflow-y-auto flex flex-col items-center p-4 box-border">
    <router-link to="/parametre" class="text-slate-400 mb-4 self-start">← Retour aux paramètres</router-link>
    <div class="w-full max-w-md flex flex-col gap-4">
      <form @submit.prevent="ajouter" class="flex flex-col gap-4 mb-4">
        <label class="text-white font-bold">Identifiant</label>
        <input v-model="login" type="text" placeholder="Identifiant" required class="bg-blue-100 border-blue-400 border-2 rounded-lg w-full p-4 text-slate-900 text-lg font-bold">
        <label class="text-white font-bold">Mot de passe</label>
        <input v-model="motDePasse" type="password" placeholder="Mot de passe" required class="bg-blue-100 border-blue-400 border-2 rounded-lg w-full p-4 text-slate-900 text-lg font-bold">
        <button type="submit" class="bg-blue-400 text-slate-900 w-full p-4 rounded-lg text-2xl font-bold">Ajouter un gestionnaire</button>
      </form>
      <div class="w-full max-w-md mt-2">
        <h2 class="text-xl font-bold text-white mb-2">Gestionnaires ({{ listeGestionnaires.length }})</h2>
        <ul class="bg-slate-800 rounded-lg divide-y divide-slate-600">
          <div v-for="gestionnaire in listeGestionnaires" :key="gestionnaire.id_gest" class="p-4 text-white flex justify-evenly">
            <p class="flex justify-start w-1/3">{{ gestionnaire.login }}</p>
            <div class="flex justify-evenly w-2/3">
              <button type="button" @click="ouvrirModif(gestionnaire)" class="bg-blue-500 w-2/5 text-white rounded-lg text-sm font-bold">Modifier</button>
              <button type="button" @click="supprimer(gestionnaire.id_gest)" class="bg-red-500 w-2/5 text-white rounded-lg text-sm font-bold">Supprimer</button>
            </div>
          </div>
        </ul>
      </div>
    </div>
    <div v-if="popupModif" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="fermerPopup">
      <div class="bg-slate-800 rounded-xl p-4 w-full max-w-md mx-4 shadow-xl">
        <h3 class="text-white font-bold mb-3">Modifier le gestionnaire</h3>
        <form @submit.prevent="validerModif" class="flex flex-col gap-3">
          <label class="text-white font-bold">Identifiant</label>
          <input v-model="modifLogin" type="text" placeholder="Identifiant" required class="bg-slate-700 text-white border border-slate-600 rounded-lg p-3">
          <label class="text-white font-bold">Nouveau mot de passe (vide = ne pas changer)</label>
          <input v-model="modifMotDePasse" type="password" placeholder="Nouveau mot de passe" class="bg-slate-700 text-white border border-slate-600 rounded-lg p-3">
          <div class="flex gap-2">
            <button type="button" @click="fermerPopup" class="flex-1 py-2 rounded-lg bg-slate-600 text-white font-medium">Annuler</button>
            <button type="submit" class="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
// --- Imports ---
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDatabase } from './sqlite.js'
import { useAuth } from '../auth.js'

// --- Router, base de données et auth ---
var router = useRouter()
var model = useDatabase()
var auth = useAuth()

// --- Données (formulaire et liste) ---
var login = ref('')
var motDePasse = ref('')
var liste = ref([])
var popupModif = ref(null)
var modifLogin = ref('')
var modifMotDePasse = ref('')

// --- Liste affichée ---
var listeGestionnaires = computed(function () {
  var r = liste.value
  if (r && r.length >= 0) return r
  return []
})

// --- Initialisation et chargement ---
function init() {
  model.ouvrirBase().then(function () {
    model.creerTables().then(function () {
      charger()
    })
  })
}

function charger() {
  model.listerGestionnaires().then(function (resultat) {
    if (resultat && resultat.length >= 0) liste.value = resultat
    else liste.value = []
  })
}

// --- Actions ---
function ajouter() {
  auth.hasherMotDePasse(motDePasse.value).then(function (hash) {
    model.ajouterGestionnaire(login.value, hash).then(function () {
      login.value = ''
      motDePasse.value = ''
      charger()
    })
  })
}

function ouvrirModif(gestionnaire) {
  popupModif.value = gestionnaire.id_gest
  modifLogin.value = gestionnaire.login
  modifMotDePasse.value = ''
}

function fermerPopup() {
  popupModif.value = null
}

function validerModif() {
  if (popupModif.value == null) return
  if (modifMotDePasse.value != null && modifMotDePasse.value !== '') {
    auth.hasherMotDePasse(modifMotDePasse.value).then(function (hash) {
      model.modifierGestionnaire(popupModif.value, modifLogin.value, hash).then(function () {
        popupModif.value = null
        charger()
      })
    })
  } else {
    model.modifierGestionnaire(popupModif.value, modifLogin.value, '').then(function () {
      popupModif.value = null
      charger()
    })
  }
}

function supprimer(idGest) {
  model.supprimerGestionnaire(idGest).then(function () {
    charger()
  })
}

// --- Lifecycle ---
onMounted(function () {
  init()
})
</script>
