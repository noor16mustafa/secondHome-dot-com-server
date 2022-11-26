const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();
//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.erpq6o3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('secondHome').collection('categories');
        const productCollection = client.db('secondHome').collection('allproduct');
        const usersCollection = client.db('secondHome').collection('users');
        const bookingCollection = client.db('secondHome').collection('booking');


        app.get('/categories', async (req, res) => {
            const query = {};
            const category = await categoriesCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { p_id: id };
            const product = await productCollection.find(query).toArray();
            res.send(product);
        });

        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.send(result);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(err => console.error(err));



app.get('/', async (req, res) => {
    res.send('second home dot com is running');
});

app.listen(port, () => {
    console.log(`second home is now running in port ${port}`)
});