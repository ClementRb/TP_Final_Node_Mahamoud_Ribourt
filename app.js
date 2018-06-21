// Dépendances native
const path = require('path')
const db = require('sqlite')

const methodOverride = require('method-override')

// Dépendances 3rd party
const express = require('express')
const bodyParser = require('body-parser')

// Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()

const session = require('express-session')


db.open('expressapi.db').then(() => {
    Promise.all([
        db.run('CREATE TABLE IF NOT EXISTS users (id, pseudo, password, email, firstname, lastname, createdAt, updatedAt)'),
        db.run('CREATE TABLE IF NOT EXISTS sessions (id, accessToken, createdAt, expiresAt)')
    ])
    .then(() => {
      console.log('> Database ready')
    }).catch((err) => { // Si on a eu des erreurs
      console.error('ERR> ', err)
    })
})


// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Override POST
app.use(methodOverride('_method'))


// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

// Middleware de sessions
app.set('trust proxy', 1)
app.use(session({
    secret: 'topkek',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true
    }
}))

// La liste des différents routeurs (dans l'ordre)
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))
app.use('/sessions', require('./routes/sessions'))


// Erreur 404
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Gestion des erreurs
// Notez les 4 arguments !!
app.use(function(err, req, res, next) {
  // Les données de l'erreur
  let data = {
    message: err.message,
    status: err.status || 500
  }

  // En mode développement, on peut afficher les détails de l'erreur
  if (app.get('env') === 'development') {
    data.error = err.stack
  }

  // On set le status de la réponse
  res.status(data.status)

  // Réponse multi-format
  res.format({
    html: () => { res.render('error', data) },
    json: () => { res.send(data) }
  })
})

app.listen(PORT, () => {
  console.log('Serveur démarré sur le port : ', PORT)
})