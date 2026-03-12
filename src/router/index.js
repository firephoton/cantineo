import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../auth.js'
import Employe from '../components/Employe.vue'
import GestionnaireView from '../components/Gestionnaire.vue'
import Login from '../components/Login.vue'
import ParametreView from '../components/Parametre.vue'
import RepasView from '../components/Repas.vue'
import SoldeView from '../components/Solde.vue'

var LOGIN_PATH = '/login'

var routes = [
  { path: LOGIN_PATH, name: 'login', component: Login, meta: { title: 'Connexion' } },
  { path: '/', name: 'home', component: Employe, meta: { title: 'Accueil' } },
  { path: '/add', name: 'add', component: Employe, meta: { title: 'Add' } },
  { path: '/solde', name: 'solde', component: SoldeView, meta: { title: 'Solde' } },
  { path: '/repas', name: 'repas', component: RepasView, meta: { title: 'Repas' } },
  { path: '/parametre', name: 'parametre', component: ParametreView, meta: { title: 'Paramètre' } },
  { path: '/gestionnaires', name: 'gestionnaires', component: GestionnaireView, meta: { title: 'Gestionnaires' } }
]

var router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(function (to, from, next) {
  var auth = useAuth()
  var pageLogin = to.path === LOGIN_PATH
  var connecte = auth.isLoggedIn.value
  if (pageLogin || connecte) {
    next()
  } else {
    next(LOGIN_PATH)
  }
})

export default router
