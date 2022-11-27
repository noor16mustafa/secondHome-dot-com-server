const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        });

        //------seller for admin routes----
        app.get('/sellers', async (req, res) => {
            const query = { role: 'Seller' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        //verify seller
        app.put('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    status: 'verified'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        //delete seller
        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await doctorsCollection.deleteOne(filter);
            res.send(result);
        });

        //------Buyer for admin routes----
        app.get('/buyers', async (req, res) => {
            const query = { role: 'Buyer' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.delete('/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await doctorsCollection.deleteOne(filter);
            res.send(result);
        });

        //-----get admin----
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
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