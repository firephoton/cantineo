# Cours complet : utiliser `sqlitePlugin` depuis zéro

Ce cours t'apprend a utiliser `sqlitePlugin` dans une application mobile hybride (Cordova / contexte proche Capacitor), en partant de zero.

Objectifs :
- Comprendre ce qu'est SQLite et `sqlitePlugin`
- Installer correctement le plugin
- Creer et ouvrir une base
- Faire les operations CRUD (Create, Read, Update, Delete)
- Gérer les transactions et les erreurs
- Structurer proprement ton code

---

## 1) C'est quoi `sqlitePlugin` ?

`sqlitePlugin` permet d'utiliser une base SQLite locale sur mobile (Android / iOS) depuis JavaScript.

Pourquoi l'utiliser :
- Les donnees restent sur l'appareil (hors-ligne possible)
- C'est rapide pour du stockage local structure
- Tu peux faire des requetes SQL classiques (`SELECT`, `INSERT`, etc.)

Quand l'utiliser :
- Historique local
- Cache de donnees API
- Donnees metier de l'app (utilisateurs, commandes, etc.)

---

## 2) Prerequis

- Node.js installe
- Projet Cordova (ou environnement qui expose `window.sqlitePlugin`)
- Connaissances basiques en JavaScript

Important :
- Le plugin fonctionne sur vrai device / emulateur mobile
- Dans un navigateur desktop classique, `window.sqlitePlugin` n'existe souvent pas

---

## 2.1) Notions fondamentales (definition avant pratique)

Cette section est la base pour comprendre les exemples qui arrivent ensuite.

### `window`

Definition :
- Objet global JavaScript du navigateur/WebView
- Il contient les APIs globales et les objets exposes par l'environnement

A quoi ca sert ici :
- Tester si Cordova est present (`window.cordova`)
- Utiliser le plugin SQLite (`window.sqlitePlugin`)

Extrait :

```js
if (window.cordova) {
  console.log('Cordova present');
}
```

### `document`

Definition :
- Objet qui represente la page HTML (DOM)
- Sert a ecouter des evenements et manipuler la page

A quoi ca sert ici :
- Ecouter `deviceready`, l'evenement cle pour demarrer proprement en mobile

Extrait :

```js
document.addEventListener('deviceready', onDeviceReady, false);
```

### `deviceready`

Definition :
- Evenement Cordova declenche quand l'environnement natif et les plugins sont prets

A quoi ca sert ici :
- Eviter les erreurs de type `sqlitePlugin is undefined`
- Lancer l'app seulement quand les plugins sont utilisables

Extrait :

```js
function onDeviceReady() {
  // Ici, window.sqlitePlugin est normalement disponible
}
```

### `cordova` et `sqlitePlugin` (difference importante)

Definition :
- `cordova` = la plateforme/runtime
- `sqlitePlugin` = un plugin ajoute a Cordova

A quoi ca sert ici :
- `window.cordova` indique que tu es dans un contexte Cordova
- `window.sqlitePlugin` donne l'acces SQLite

Important :
- Tous les plugins ne sont pas forcement sous `window.cordova.*`
- Beaucoup exposent directement `window.nomDuPlugin`

Extrait :

```js
if (window.cordova && window.sqlitePlugin) {
  console.log('Environnement mobile + plugin SQLite OK');
}
```

### `mountApp` et `mount`

Definition :
- `mountApp` = fonction de demarrage (nom libre choisi par toi)
- `mount('#app')` = methode Vue qui attache l'application au DOM

A quoi ca sert ici :
- Controler le moment exact ou Vue demarre
- Attendre `deviceready` en mobile, demarrer direct en navigateur

Extrait :

```js
const mountApp = () => {
  createApp(App).use(router).mount('#app');
};
```

### `db`, `transaction`, `tx`, `executeSql`

Definition :
- `db` = connexion a la base SQLite
- `transaction(...)` = bloc de travail SQL atomique
- `tx` = objet transaction fourni dans le callback
- `tx.executeSql(...)` = execution d'une requete SQL

A quoi ca sert ici :
- Envoyer des requetes a SQLite de facon structuree
- Recuperer resultats et erreurs proprement

Extrait :

```js
db.transaction((tx) => {
  tx.executeSql('SELECT * FROM users');
});
```

### `result.rows`, `insertId`, `rowsAffected`

Definition :
- `result.rows` = lignes retournees par un `SELECT`
- `result.rows.item(i)` = acces a une ligne
- `result.insertId` = id cree apres un `INSERT`
- `result.rowsAffected` = nb de lignes impactees

A quoi ca sert ici :
- Lire les donnees d'une requete
- Verifier le succes d'un `INSERT/UPDATE/DELETE`

Extrait :

```js
tx.executeSql('SELECT * FROM users', [], (txObj, result) => {
  console.log('Nb lignes:', result.rows.length);
});
```

### `?` (requete parametree)

Definition :
- Placeholder SQL remplace par des valeurs dans le tableau de params

A quoi ca sert ici :
- Eviter les injections SQL
- Eviter les bugs de concatenation de chaines

Extrait :

```js
tx.executeSql(
  'INSERT INTO users (name, email) VALUES (?, ?)',
  ['Theo', 'theo@email.com']
);
```

---

## 3) Installation du plugin

Exemple Cordova classique :

```bash
cordova plugin add cordova-sqlite-storage
```

Puis rebuild de la plateforme :

```bash
cordova platform add android
cordova prepare
cordova run android
```

---

## 4) Initialiser au bon moment (`deviceready`)

Tu dois attendre que l'environnement natif soit pret.

```js
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  console.log('Device ready');
}
```

---

## 5) Ouvrir la base de donnees

```js
let db = null;

function openDatabase() {
  db = window.sqlitePlugin.openDatabase({
    name: 'app.db',
    location: 'default'
  });
}
```

Notes :
- `name` : nom du fichier SQLite
- `location: 'default'` : emplacement standard recommande

---

## 6) Creer des tables

Exemple : table `users`

```js
function createTables() {
  db.transaction((tx) => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TEXT
      )
    `);
  }, onError, () => {
    console.log('Table users creee/verifiee');
  });
}
```

---

## 7) CRUD complet

### Inserer (Create)

```js
function addUser(name, email) {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO users (name, email, created_at) VALUES (?, ?, ?)`,
      [name, email, new Date().toISOString()]
    );
  }, onError, () => {
    console.log('Utilisateur ajoute');
  });
}
```

### Lire (Read)

```js
function getUsers(callback) {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT id, name, email, created_at FROM users ORDER BY id DESC`,
      [],
      (txObj, result) => {
        const users = [];
        for (let i = 0; i < result.rows.length; i++) {
          users.push(result.rows.item(i));
        }
        callback(users);
      }
    );
  }, onError);
}
```

### Mettre a jour (Update)

```js
function updateUser(id, name, email) {
  db.transaction((tx) => {
    tx.executeSql(
      `UPDATE users SET name = ?, email = ? WHERE id = ?`,
      [name, email, id]
    );
  }, onError, () => {
    console.log('Utilisateur mis a jour');
  });
}
```

### Supprimer (Delete)

```js
function deleteUser(id) {
  db.transaction((tx) => {
    tx.executeSql(`DELETE FROM users WHERE id = ?`, [id]);
  }, onError, () => {
    console.log('Utilisateur supprime');
  });
}
```

---

## 8) Gestion des erreurs

Toujours centraliser les erreurs :

```js
function onError(error) {
  console.error('Erreur SQLite:', error.message || error);
}
```

Bonnes pratiques :
- Afficher les erreurs en dev
- Retourner un message utilisateur clair dans l'UI
- Logger les erreurs critiques

---

## 9) Versionner la base (migrations)

Quand ton schema evolue, evite de modifier "a la main" sans controle.

Idee simple :
- Table `meta` avec version schema
- Si version actuelle < version cible, lancer les scripts SQL de migration

Exemple de principe :

```js
// pseudo-code
// 1) lire version
// 2) appliquer migration 1->2, 2->3, etc.
// 3) mettre a jour la version
```

---

## 10) Ecrire du code propre : mini service SQLite

Tu peux encapsuler dans un module pour ne pas dupliquer la logique.

```js
const SQLiteService = {
  db: null,

  init() {
    this.db = window.sqlitePlugin.openDatabase({
      name: 'app.db',
      location: 'default'
    });
    return this.createSchema();
  },

  createSchema() {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE
          )
        `);
      }, reject, resolve);
    });
  },

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.transaction((tx) => {
        tx.executeSql(
          sql,
          params,
          (txObj, result) => resolve(result),
          (txObj, error) => {
            reject(error);
            return true;
          }
        );
      });
    });
  }
};
```

Ensuite :

```js
await SQLiteService.init();
await SQLiteService.query(
  `INSERT INTO users (name, email) VALUES (?, ?)`,
  ['Theo', 'theo@email.com']
);
```

---

## 11) Erreurs courantes (et solution)

1. **`sqlitePlugin is undefined`**
   - Cause : test en navigateur desktop, ou `deviceready` pas encore declenche
   - Fix : attendre `deviceready` et tester sur device/emulateur

2. **Table introuvable**
   - Cause : `CREATE TABLE` pas executee
   - Fix : lancer schema au demarrage avant les requetes metier

3. **Requete SQL invalide**
   - Cause : faute de syntaxe
   - Fix : logger la requete + parametres

4. **Doublon sur colonne unique**
   - Cause : `email` deja existant
   - Fix : gerer l'erreur et afficher un message propre

---

## 12) Check-list de mise en production

- Initialisation unique de la base
- Creation schema / migrations automatisees
- Requetes parametrees (`?`) pour eviter les injections
- Gestion d'erreurs centralisee
- Tests sur Android + iOS
- Sauvegarde/export si les donnees sont critiques

---

## 13) Exercice pratique

Fais une mini app "Notes" :
- Table `notes(id, title, content, created_at)`
- Ecran liste des notes
- Formulaire ajout/modification
- Bouton suppression

Bonus :
- Recherche (`WHERE title LIKE ?`)
- Tri par date
- Pagination simple (`LIMIT` / `OFFSET`)

---

## 14) Resume

Tu dois retenir surtout :
- Initialiser apres `deviceready`
- Ouvrir une seule connexion proprement
- Toujours utiliser des requetes parametrees
- Encapsuler SQLite dans un service
- Prepararer les migrations des le debut

Si tu veux, je peux te faire une **version 2 de ce cours** avec :
- une structure `Vue` complete (service + store + composant),
- des fonctions pretes a coller,
- et un mini projet "Notes" pas a pas.
