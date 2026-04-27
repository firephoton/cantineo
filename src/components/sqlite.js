export function useDatabase() {
  let db = null

  async function ouvrirBase() {
    if (db) return db

    if (window.sqlitePlugin && window.sqlitePlugin.openDatabase) {
      db = window.sqlitePlugin.openDatabase({ name: 'cantineo.db', location: 'default' })
      return db
    }
    throw new Error('Aucun moteur SQLite disponible')
  }

  async function executerRequete(sql, params = []) {
    await ouvrirBase()

    return new Promise(function (resolve, reject) {
      function succesSql(_tx, resultat) {
        resolve(resultat)
      }

      function erreurSql(_tx, erreur) {
        reject(erreur || new Error('Erreur SQL'))
        return true
      }

      function lancerRequete(tx) {
        tx.executeSql(sql, params, succesSql, erreurSql)
      }

      function erreurTransaction(erreur) {
        reject(erreur || new Error('Erreur transaction'))
      }

      db.transaction(lancerRequete, erreurTransaction)
    })
  }

  async function creerTables() {
    const requetes = [
      'CREATE TABLE IF NOT EXISTS GESTIONNAIRE (id_gest INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT NOT NULL UNIQUE, mot_de_passe_hache TEXT NOT NULL)',
      'CREATE TABLE IF NOT EXISTS PASSAGE_REPAS (id_passage_repas INTEGER PRIMARY KEY AUTOINCREMENT, libelle TEXT NOT NULL, valeur TEXT)',

      'CREATE TABLE IF NOT EXISTS EMPLOYE (id_employe INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, prenom TEXT NOT NULL, compteur_fidelite INTEGER DEFAULT 0, est_actif INTEGER DEFAULT 1)',

      'CREATE TABLE IF NOT EXISTS PAIEMENT (id_paiement INTEGER PRIMARY KEY AUTOINCREMENT, date_paiement TEXT NOT NULL, montant REAL NOT NULL, id_employe INTEGER NOT NULL, FOREIGN KEY (id_employe) REFERENCES EMPLOYE(id_employe))',
      
      'CREATE TABLE IF NOT EXISTS REPAS (id_repas INTEGER PRIMARY KEY AUTOINCREMENT, date_repas TEXT NOT NULL, prix_applique REAL NOT NULL, est_gratuit INTEGER DEFAULT 0, id_employe INTEGER NOT NULL, FOREIGN KEY (id_employe) REFERENCES EMPLOYE(id_employe))'
    ]
    for (const sql of requetes) await executerRequete(sql)
  }

  function ajouterEmploye(nom, prenom, estActif) {
    return executerRequete('INSERT INTO EMPLOYE (nom, prenom, est_actif) VALUES (?, ?, ?)', [
      nom,
      prenom,
      estActif == null ? 1 : estActif
    ])
  }

  function modifierEmploye(idEmploye, nom, prenom, estActif) {
    return executerRequete('UPDATE EMPLOYE SET nom = ?, prenom = ?, est_actif = ? WHERE id_employe = ?', [
      nom,
      prenom,
      estActif == null ? 1 : estActif,
      idEmploye
    ])
  }

  function supprimerEmploye(idEmploye) {
    return executerRequete('DELETE FROM EMPLOYE WHERE id_employe = ?', [idEmploye])
  }

  async function listerEmployes() {
    const resultat = await executerRequete('SELECT * FROM EMPLOYE ORDER BY id_employe')
    const liste = []
    for (let i = 0; i < resultat.rows.length; i++) liste.push(resultat.rows.item(i))
    return liste
  }

  async function getSolde(idEmploye) {
    try {
      const resultat = await executerRequete(
        'SELECT (SELECT COALESCE(SUM(montant),0) FROM PAIEMENT WHERE id_employe = ?) - (SELECT COALESCE(SUM(prix_applique),0) FROM REPAS WHERE id_employe = ?) AS solde',
        [idEmploye, idEmploye]
      )
      return Number(resultat.rows.item(0).solde || 0)
    } catch {
      return 0
    }
  }

  function ajouterAjustementSolde(idEmploye, montant) {
    return ajouterPaiement(new Date().toISOString().slice(0, 10), Number(montant), idEmploye)
  }

  async function listerEmployesAvecSolde() {
    try {
      const resultat = await executerRequete(`
        SELECT
          e.id_employe,
          e.nom,
          e.prenom,
          e.est_actif,
          e.compteur_fidelite,
          (SELECT COALESCE(SUM(p.montant), 0) FROM PAIEMENT p WHERE p.id_employe = e.id_employe) -
          (SELECT COALESCE(SUM(r.prix_applique), 0) FROM REPAS r WHERE r.id_employe = e.id_employe) AS solde,
          (SELECT COUNT(*) FROM REPAS r2 WHERE r2.id_employe = e.id_employe) AS nb_repas,
          (SELECT COUNT(*) FROM REPAS r3 WHERE r3.id_employe = e.id_employe AND (r3.est_gratuit = 1 OR r3.prix_applique = 0)) AS nb_repas_offerts
        FROM EMPLOYE e
      `)
      const list = []
      for (let i = 0; i < resultat.rows.length; i++) list.push(resultat.rows.item(i))

      for (const item of list) {
        item.solde = Number(item.solde || 0)
        item.nb_repas = Number(item.nb_repas || 0)
        item.compteur_fidelite = Number(item.compteur_fidelite || 0)
        item.nb_repas_offerts = Number(item.nb_repas_offerts || 0)
      }
      return list
    } catch {
      return []
    }
  }

  function ajouterPaiement(datePaiement, montant, idEmploye) {
    return executerRequete('INSERT INTO PAIEMENT (date_paiement, montant, id_employe) VALUES (?, ?, ?)', [
      datePaiement,
      montant,
      idEmploye
    ])
  }

  async function ajouterRepas(dateRepas, prixApplique, idEmploye) {
    const resultat = await executerRequete('SELECT compteur_fidelite FROM EMPLOYE WHERE id_employe = ? LIMIT 1', [idEmploye])
    const compteurActuel = resultat.rows.length ? Number(resultat.rows.item(0).compteur_fidelite || 0) : 0
    const repasGratuit = compteurActuel >= 10
    let prixFinal = Number(prixApplique)
    if (repasGratuit) prixFinal = 0

    await executerRequete('INSERT INTO REPAS (date_repas, prix_applique, est_gratuit, id_employe) VALUES (?, ?, ?, ?)', [
      dateRepas,
      prixFinal,
      repasGratuit ? 1 : 0,
      idEmploye
    ])
    await executerRequete('UPDATE EMPLOYE SET compteur_fidelite = ? WHERE id_employe = ?', [
      repasGratuit ? 0 : compteurActuel + 1,
      idEmploye
    ])
  }

  async function listerRepasPourDate(dateRepas) {
    try {
      const resultat = await executerRequete(
        'SELECT id_repas, date_repas, prix_applique, id_employe FROM REPAS WHERE date_repas = ? ORDER BY id_employe',
        [dateRepas]
      )
      const list = []
      for (let i = 0; i < resultat.rows.length; i++) list.push(resultat.rows.item(i))
      return list
    } catch {
      return []
    }
  }

  async function supprimerRepas(idRepas) {
    const resultat = await executerRequete('SELECT id_employe FROM REPAS WHERE id_repas = ? LIMIT 1', [idRepas])
    if (!resultat.rows.length) return null
    const idEmploye = resultat.rows.item(0).id_employe

    await executerRequete('DELETE FROM REPAS WHERE id_repas = ?', [idRepas])
    await executerRequete(
      'UPDATE EMPLOYE SET compteur_fidelite = (SELECT COUNT(*) FROM REPAS r WHERE r.id_employe = ? AND r.prix_applique > 0 AND r.id_repas > COALESCE((SELECT MAX(r2.id_repas) FROM REPAS r2 WHERE r2.id_employe = ? AND (r2.est_gratuit = 1 OR r2.prix_applique = 0)), 0)) WHERE id_employe = ?',
      [idEmploye, idEmploye, idEmploye]
    )
    return null
  }

  function ajouterGestionnaire(login, motDePasseHache) {
    return executerRequete('INSERT INTO GESTIONNAIRE (login, mot_de_passe_hache) VALUES (?, ?)', [
      login,
      motDePasseHache
    ])
  }

  async function getGestionnaireParLogin(loginValue) {
    const resultat = await executerRequete('SELECT id_gest, login, mot_de_passe_hache FROM GESTIONNAIRE WHERE login = ? LIMIT 1', [
      loginValue
    ])
    if (!resultat.rows.length) return null
    return resultat.rows.item(0)
  }

  async function listerGestionnaires() {
    try {
      const resultat = await executerRequete('SELECT id_gest, login, mot_de_passe_hache FROM GESTIONNAIRE ORDER BY id_gest')
      const list = []
      for (let i = 0; i < resultat.rows.length; i++) list.push(resultat.rows.item(i))
      return list
    } catch {
      return []
    }
  }

  function modifierGestionnaire(idGest, login, motDePasseHache) {
    if (motDePasseHache == null || motDePasseHache === '') {
      return executerRequete('UPDATE GESTIONNAIRE SET login = ? WHERE id_gest = ?', [login, idGest])
    }
    return executerRequete('UPDATE GESTIONNAIRE SET login = ?, mot_de_passe_hache = ? WHERE id_gest = ?', [
      login,
      motDePasseHache,
      idGest
    ])
  }

  function supprimerGestionnaire(idGest) {
    return executerRequete('DELETE FROM GESTIONNAIRE WHERE id_gest = ?', [idGest])
  }

  function definirPassageRepas(libelle, valeur) {
    return executerRequete('INSERT INTO PASSAGE_REPAS (libelle, valeur) VALUES (?, ?)', [libelle, valeur])
  }

  async function getPrixRepas() {
    try {
      const resultat = await executerRequete(
        'SELECT valeur FROM PASSAGE_REPAS WHERE libelle = ? ORDER BY id_passage_repas DESC LIMIT 1',
        ['prix_repas']
      )
      const valeur = resultat.rows.length ? resultat.rows.item(0).valeur : 5
      const prix = Number(valeur || 5)
      return Number.isNaN(prix) ? 5 : prix
    } catch {
      return 5
    }
  }

  async function definirPrixRepas(prix) {
    let prixNombre = Number(prix)
    await executerRequete('DELETE FROM PASSAGE_REPAS WHERE libelle = ?', ['prix_repas'])
    return executerRequete('INSERT INTO PASSAGE_REPAS (libelle, valeur) VALUES (?, ?)', ['prix_repas', String(prixNombre)])
  }

  return {
    ouvrirBase,
    creerTables,
    executerRequete,
    ajouterEmploye,
    modifierEmploye,
    supprimerEmploye,
    listerEmployes,
    getSolde,
    ajouterAjustementSolde,
    listerEmployesAvecSolde,
    ajouterPaiement,
    ajouterRepas,
    listerRepasPourDate,
    supprimerRepas,
    ajouterGestionnaire,
    getGestionnaireParLogin,
    listerGestionnaires,
    modifierGestionnaire,
    supprimerGestionnaire,
    definirPassageRepas,
    getPrixRepas,
    definirPrixRepas
  }
}
  