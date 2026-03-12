// --- Base de données : toutes les requêtes utilisent des paramètres (?) pour éviter les injections SQL ---

export function useDatabase() {
    let db = null

    // --- Ouvrir la connexion à la base ---
    function ouvrirBase() {
      return new Promise(function (resoudre) {
        var instanceDb = window.sqlitePlugin.openDatabase({
          name: 'cantineo.db',
          location: 'default'
        }, function (dbOuvert) {
          if (dbOuvert != null) db = dbOuvert
          else if (instanceDb != null) db = instanceDb
          resoudre(db)
        })
        if (instanceDb != null) db = instanceDb
      })
    }

    // --- Créer les tables si elles n'existent pas ---
    function creerTables() {
      return new Promise(function (resoudre) {
        var scriptsCreation = [
          'CREATE TABLE IF NOT EXISTS GESTIONNAIRE (id_gest INTEGER PRIMARY KEY AUTOINCREMENT, login TEXT NOT NULL UNIQUE, mot_de_passe_hache TEXT NOT NULL)',
          'CREATE TABLE IF NOT EXISTS PASSAGE_REPAS (id_passage_repas INTEGER PRIMARY KEY AUTOINCREMENT, libelle TEXT NOT NULL, valeur TEXT)',
          'CREATE TABLE IF NOT EXISTS EMPLOYE (id_employe INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, prenom TEXT NOT NULL, est_actif INTEGER DEFAULT 1)',
          'CREATE TABLE IF NOT EXISTS PAIEMENT (id_paiement INTEGER PRIMARY KEY AUTOINCREMENT, date_paiement TEXT NOT NULL, montant REAL NOT NULL, id_employe INTEGER NOT NULL, FOREIGN KEY (id_employe) REFERENCES EMPLOYE(id_employe))',
          'CREATE TABLE IF NOT EXISTS REPAS (id_repas INTEGER PRIMARY KEY AUTOINCREMENT, date_repas TEXT NOT NULL, prix_applique REAL NOT NULL, id_employe INTEGER NOT NULL, FOREIGN KEY (id_employe) REFERENCES EMPLOYE(id_employe))'
        ]

        db.transaction(function (execSql) {
          var totalRequetes = scriptsCreation.length
          var requetesTerminees = 0

          function uneTableCreee() {
            requetesTerminees++
            if (requetesTerminees === totalRequetes) resoudre()
          }

          for (var i = 0; i < totalRequetes; i++) {
            execSql.executeSql(scriptsCreation[i], [], uneTableCreee, function () {})
          }
        })
      })
    }

    // --- Exécuter une requête SQL avec des paramètres (requêtes préparées) ---
    function executerRequete(sql, params) {
      if (params === undefined) params = []
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function transmettreResultat(transaction, resultat) {
            resoudre(resultat)
          }
          execSql.executeSql(sql, params, transmettreResultat, function () {})
        })
      })
    }
  
    function ajouterEmploye(nom, prenom, estActif) {
      if (estActif === undefined) estActif = 1
      var sql = 'INSERT INTO EMPLOYE (nom, prenom, est_actif) VALUES (?, ?, ?)'
      return executerRequete(sql, [nom, prenom, estActif])
    }
    function modifierEmploye(idEmploye, nom, prenom, estActif) {
      if (estActif === undefined) estActif = 1
      var sql = 'UPDATE EMPLOYE SET nom = ?, prenom = ?, est_actif = ? WHERE id_employe = ?'
      return executerRequete(sql, [nom, prenom, estActif, idEmploye])
    }
    function supprimerEmploye(idEmploye) {
      var sql = 'DELETE FROM EMPLOYE WHERE id_employe = ?'
      return executerRequete(sql, [idEmploye])
    }
  
    function listerEmployes() {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireLignesEmployes(transaction, resultat) {
            var rows = resultat && resultat.rows
            var listeEmployes = []
            if (rows && typeof rows.length === 'number') {
              for (var i = 0; i < rows.length; i++) {
                var ligne = rows.item ? rows.item(i) : (rows._array && rows._array[i])
                if (ligne) listeEmployes.push(ligne)
              }
            } else if (rows && rows._array) {
              listeEmployes = rows._array
            }
            resoudre(listeEmployes)
          }
          execSql.executeSql('SELECT * FROM EMPLOYE', [], lireLignesEmployes, function () {})
        })
      })
    }

    function getSolde(idEmploye) {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireSoldeDepuisResultat(transaction, resultat) {
            var rows = resultat && resultat.rows
            var solde = 0
            if (rows && rows.length > 0) {
              var ligne = rows.item ? rows.item(0) : (rows._array && rows._array[0])
              if (ligne && ligne.solde != null) solde = Number(ligne.solde)
            }
            resoudre(solde)
          }
          var sql = 'SELECT (SELECT COALESCE(SUM(montant),0) FROM PAIEMENT WHERE id_employe = ?) - (SELECT COALESCE(SUM(prix_applique),0) FROM REPAS WHERE id_employe = ?) AS solde'
          execSql.executeSql(sql, [idEmploye, idEmploye], lireSoldeDepuisResultat, function () { resoudre(0) }) // En cas d'échec on renvoie 0
        })
      })
    }

    function ajouterAjustementSolde(idEmploye, montant) {
      var aujourdhui = new Date().toISOString().slice(0, 10)
      return ajouterPaiement(aujourdhui, Number(montant), idEmploye)
    }

    function listerEmployesAvecSolde() {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireLignesEmployesAvecSolde(transaction, resultat) {
            var rows = resultat && resultat.rows
            var liste = []
            if (rows && typeof rows.length === 'number') {
              for (var i = 0; i < rows.length; i++) {
                var ligne = rows.item ? rows.item(i) : (rows._array && rows._array[i])
                if (ligne) {
                  ligne.solde = ligne.solde != null ? Number(ligne.solde) : 0
                  ligne.nb_repas = ligne.nb_repas != null ? Number(ligne.nb_repas) : 0
                  liste.push(ligne)
                }
              }
            } else if (rows && rows._array) {
              liste = rows._array
            }
            resoudre(liste)
          }
          var sql = 'SELECT e.id_employe, e.nom, e.prenom, e.est_actif, (SELECT COALESCE(SUM(p.montant),0) FROM PAIEMENT p WHERE p.id_employe = e.id_employe) - (SELECT COALESCE(SUM(r.prix_applique),0) FROM REPAS r WHERE r.id_employe = e.id_employe) AS solde, (SELECT COUNT(*) FROM REPAS r2 WHERE r2.id_employe = e.id_employe) AS nb_repas FROM EMPLOYE e'
          execSql.executeSql(sql, [], lireLignesEmployesAvecSolde, function () { resoudre([]) })
        })
      })
    }
  
    function ajouterPaiement(datePaiement, montant, idEmploye) {
      var sql = 'INSERT INTO PAIEMENT (date_paiement, montant, id_employe) VALUES (?, ?, ?)'
      return executerRequete(sql, [datePaiement, montant, idEmploye])
    }

    function ajouterRepas(dateRepas, prixApplique, idEmploye) {
      var sql = 'INSERT INTO REPAS (date_repas, prix_applique, id_employe) VALUES (?, ?, ?)'
      return executerRequete(sql, [dateRepas, prixApplique, idEmploye])
    }

    function listerRepasPourDate(dateRepas) {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireLignesRepas(transaction, resultat) {
            var rows = resultat && resultat.rows
            var liste = []
            if (rows && typeof rows.length === 'number') {
              for (var i = 0; i < rows.length; i++) {
                var ligne = rows.item ? rows.item(i) : (rows._array && rows._array[i])
                if (ligne) liste.push(ligne)
              }
            } else if (rows && rows._array) {
              liste = rows._array
            }
            resoudre(liste)
          }
          var sql = 'SELECT id_repas, date_repas, prix_applique, id_employe FROM REPAS WHERE date_repas = ? ORDER BY id_employe'
          execSql.executeSql(sql, [dateRepas], lireLignesRepas, function () { resoudre([]) })
        })
      })
    }

    function supprimerRepas(idRepas) {
      var sql = 'DELETE FROM REPAS WHERE id_repas = ?'
      return executerRequete(sql, [idRepas])
    }

    function ajouterGestionnaire(login, motDePasseHache) {
      var sql = 'INSERT INTO GESTIONNAIRE (login, mot_de_passe_hache) VALUES (?, ?)'
      return executerRequete(sql, [login, motDePasseHache])
    }

    function getGestionnaireParLogin(loginValue) {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireLigne(transaction, resultat) {
            var rows = resultat && resultat.rows
            var ligne = null
            if (rows && rows.length > 0) {
              ligne = rows.item ? rows.item(0) : (rows._array && rows._array[0])
            }
            resoudre(ligne)
          }
          var sql = 'SELECT id_gest, login, mot_de_passe_hache FROM GESTIONNAIRE WHERE login = ? LIMIT 1'
          execSql.executeSql(sql, [loginValue], lireLigne, function () { resoudre(null) })
        })
      })
    }

    function listerGestionnaires() {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireLignes(transaction, resultat) {
            var rows = resultat && resultat.rows
            var liste = []
            if (rows && typeof rows.length === 'number') {
              for (var i = 0; i < rows.length; i++) {
                var ligne = rows.item ? rows.item(i) : (rows._array && rows._array[i])
                if (ligne) liste.push(ligne)
              }
            } else if (rows && rows._array) {
              liste = rows._array
            }
            resoudre(liste)
          }
          var sql = 'SELECT id_gest, login, mot_de_passe_hache FROM GESTIONNAIRE ORDER BY id_gest'
          execSql.executeSql(sql, [], lireLignes, function () { resoudre([]) })
        })
      })
    }

    function modifierGestionnaire(idGest, login, motDePasseHache) {
      if (motDePasseHache == null || motDePasseHache === '') {
        var sql = 'UPDATE GESTIONNAIRE SET login = ? WHERE id_gest = ?'
        return executerRequete(sql, [login, idGest])
      }
      var sql2 = 'UPDATE GESTIONNAIRE SET login = ?, mot_de_passe_hache = ? WHERE id_gest = ?'
      return executerRequete(sql2, [login, motDePasseHache, idGest])
    }

    function supprimerGestionnaire(idGest) {
      var sql = 'DELETE FROM GESTIONNAIRE WHERE id_gest = ?'
      return executerRequete(sql, [idGest])
    }

    function definirPassageRepas(libelle, valeur) {
      var sql = 'INSERT INTO PASSAGE_REPAS (libelle, valeur) VALUES (?, ?)'
      return executerRequete(sql, [libelle, valeur])
    }

    function getPrixRepas() {
      return new Promise(function (resoudre) {
        db.transaction(function (execSql) {
          function lireValeur(transaction, resultat) {
            var rows = resultat && resultat.rows
            var prix = 5
            if (rows && rows.length > 0) {
              var ligne = rows.item ? rows.item(0) : (rows._array && rows._array[0])
              if (ligne && ligne.valeur != null) {
                var n = Number(ligne.valeur)
                if (!isNaN(n)) prix = n
              }
            }
            resoudre(prix)
          }
          var sql = 'SELECT valeur FROM PASSAGE_REPAS WHERE libelle = ? ORDER BY id_passage_repas DESC LIMIT 1'
          execSql.executeSql(sql, ['prix_repas'], lireValeur, function () { resoudre(5) })
        })
      })
    }

    function definirPrixRepas(prix) {
      var p = Number(prix)
      if (isNaN(p)) p = 5
      return executerRequete('DELETE FROM PASSAGE_REPAS WHERE libelle = ?', ['prix_repas']).then(function () {
        return executerRequete('INSERT INTO PASSAGE_REPAS (libelle, valeur) VALUES (?, ?)', ['prix_repas', String(p)])
      })
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

  