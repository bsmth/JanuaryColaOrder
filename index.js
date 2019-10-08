const express = require('express')
const bodyParser = require("body-parser");
const app = express()
const path = require('path')
const PORT = process.env.PORT || 5000


const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

console.log(process.env.DATABASE_URL)

var moment = require('moment');

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/ussd', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM ussd_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/ussd', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/ussd', async (req, res) => {
    console.log(req.headers)
    console.log(req.body)
    res.status(200).send({
      "ussd-continue": {
        "message": {
          "encoding": "default",
          "body": "looks good!"
        }
      }
    })
    try {
      var description = JSON.stringify(req.body)
      const client = await pool.connect()
      const result = await client.query('INSERT INTO ussd_table (timestamp, description) VALUES ($1, $2)', [moment().utcOffset(120).format('LLLL'), description], (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).send(`event added`)
        client.release();
      })
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/http', async (req, res) => {
    try {
      const client = await pool.connect()
      const result = await client.query('SELECT * FROM http_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/http', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post('/http', async (req, res) => {
    if (req.headers('Authorization') !== `Bearer ${process.env.APP_TOKEN}`) {
      let err = 'Invalid token provided\n'
      console.log(err)
      res.status(401).end(err)
      return
    }
    try {
      var description = JSON.stringify(req.body)
      const client = await pool.connect()
      const result = await client.query('INSERT INTO http_table (timestamp, description) VALUES ($1, $2)', [moment().utcOffset(120).format('LLLL'), description], (error, results) => {
        if (error) {
          throw error
        }
        res.status(201).send(`event added`)
        client.release();
      })
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
