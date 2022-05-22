const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.118yr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    await client.connect();

    
}

app.get('/', (req, res) => {
    res.send('Running the Agri-Tools server')
})

app.listen(port, () => {
    console.log(' listening to Agri-Tools server on port ${port}')
})