const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const res = require('express/lib/response');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());


// Token verification:
async function verifyToken(req, res, next) {
    const headerAuthor = req.headers.authorization;
    if (!headerAuthor) {
        return res.status(401).send({ message: 'Access Unauthorized' });
    }

    const token = headerAuthor.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            return res.status(403).send({ message: 'Access forbidden' })
        }
        req.decoded = decoded;
        next();
    })
}



// MongoDB Config:
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.118yr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {
        await client.connect();

        const userCollection = client.db('agri-tools').collection('users');
        const reviewCollection = client.db('agri-tools').collection('reviews');
        const productCollection = client.db('agri-tools').collection('products');
        const orderCollection = client.db('agri-tools').collection('orders');

        // Admin verification:

        const verifyAdmin = async (req, res, next) => {
            const requestor = req.decoded.email;
            const requestorAccount = await userCollection.findOne({ email: requestor });

            if (requestor.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'Access forbidden' })
            }
        }

        //     Create admin API
        app.put('/user/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }

            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        // Create API for products
        app.get('/products', async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })

        // Create API for get product with id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        });



        // Creating users api
        app.get('/users', verifyToken, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        })

        // Create single user API:

        app.get('/user', verifyToken, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email === decodedEmail) {
                const query = { email: email }
                const userData = await userCollection.find(query).toArray();
                return res.send(userData)
            }
            else {
                return res.status(403).send({ message: 'Access forbidden' })
            }
        })

        // adding users to database:
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };

            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email },
                process.env.ACCESS_TOKEN, { expiresIn: '30d' })
            res.send({ result, token });
        });

        // Adding review api 
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        })

        //Creating Reviews Api 
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        })

        //  Adding Order API

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // get ALL orders API
        app.get('/orders', verifyToken, async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        })

        // Get order list for specifict buyer:
        app.get('/order', verifyToken, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email === decodedEmail) {
                const query = { email: email }
                const orders = await orderCollection.find(query).toArray();
                return res.send(orders)
            }
            else {
                return res.status(403).send({ message: 'Access forbidden' })
            }
        })

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        })




    }

    finally {

    }

}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running the Agri-Tools server')
})

app.listen(port, () => {
    console.log(' listening to Agri-Tools server on port ${port}')
})