require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const massive = require('massive');

const app = express();

app.use(express.json());

let { SERVER_PORT, CONNECTION_STRING, SESSION_SECRET } = process.env;

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

massive(CONNECTION_STRING).then(db => {
  app.set('db', db);
});



app.post('/auth/signup', async (req, res) => {
  const db = req.app.get('db')
  const {email, password} = req.body
  const userFound = await db.check_user_exists(email)
  if(userFound[0]){
    return res.status(200).send('Email already in use.')
  }
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(password, salt)
  const user = await db.create_customer([email, hash])
  req.session.user = {id: user[0].id, email: user[0].email}
  res.status(200).send(req.session.user)
})

app.post('/auth/login', async(req, res) =>{
  const db = req.app.get('db')
  const {email, password} = req.body
  const userFound = await db.check_user_exists(email)
  if(!userFound[0]){
    return res.status(200).send('Email not found.')
  }
  const compare = bcrypt.compareSync(password, userFound[0].user_password)
  if(compare){
    req.sesssion.user = {id: userFound[0].id, email: userFound[0].email}
    res.status(200).send(req.session.user)
  }else{
    return res.status(401).send('Incorrect email or password.')
  }
  
})

app.listen(SERVER_PORT, () => {
  console.log(`Listening on port: ${SERVER_PORT}`);
});