const db = require('sqlite')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const router = require('express').Router()
const bcrypt = require('bcrypt')
const hat = require('hat')
const session = require('express-session')

router.get('/', (req, res, next) => {
    res.format({
        html: () => {
            res.render('users/sessions', {
                title: 'Formulaire',
                user: {},
                action: '/sessions'
            })
        } ,
        json: () => {
            next(new Error('Bad request'))
        }
    })
    
})
    
router.post('/', (req, res, next) => {
    console.log('///////////////////////////////////////////')
    console.log(req.body)
    if(!req.body.pseudo || !req.body.password ) {
       return next(new Error('All fileds must be given.'))
    }
    db.get('SELECT * FROM users WHERE pseudo = ?', req.body.pseudo).then((user) => {
        if(!user) {
            next(res.redirect('/users'))
        }
        bcrypt.compare(req.body.password, user.password).then((match) => {
            if(!match) {
             return  
            }
            var accessToken = hat()
            expiresAt = new Date()
            db.run("INSERT INTO sessions VALUES (?, ?, ?, ?)", user.id, accessToken, new Date(), expiresAt.setHours(expiresAt.getHours() + 1))
            .then(() => {
                console.log(req.session)
                res.format({
                  html: () => { req.session.accessToken = accessToken
                               res.redirect('/users') 
                              },
                  json: () => {res.send({accessToken: accessToken})}
                })
            })
        })
    })
})

router.delete('/:userId', (req, res, next) => {
    db.run('DELETE FROM sessions WHERE ROWID = ?', req.params.userId)
    .then(() => {
        res.format({
            html: () => { req.session.accessToken = null,
                        res.redirect('/users') },
            json: () => { res.status(201).send({message: 'succes'}) }
        })
    })
})

module.exports = router