const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
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
        const advertiseCollection = client.db('secondHome').collection('advertise');
        const paymentsCollection = client.db('secondHome').collection('payments');

        //-----make payment api
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        //add payment info
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })


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
        //make bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });
        //get from booking data for payment
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const bookings = await bookingCollection.findOne(query);
            res.send(bookings);
        })

        // add to advertise
        app.post('/advertise', async (req, res) => {
            const advertising = req.body;
            const result = await advertiseCollection.insertOne(advertising);
            res.send(result);
        });
        //get advertise product
        app.get('/advertise', async (req, res) => {
            const query = {};
            const product = await advertiseCollection.find(query).toArray();
            res.send(product);
        })

        //------get all seller ----
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
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        //------Buyer for admin routes----
        app.get('/buyers', async (req, res) => {
            const query = { role: 'Buyer' };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        //delete buyer
        app.delete('/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        });

        //-----get admin----
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        });
        //------get verified seller 
        app.get('/seller/verify/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isVerified: user?.status === 'verified' });
        });
        //-----get  seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'Seller' });
        });

        //-----add product---
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            product['time'] = new Date();
            const result = await productCollection.insertOne(product);
            res.send(result);
        });
        //-----seller get his/her product ---
        app.get('/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const products = await productCollection.find(query).toArray();
            res.send(products);
        });
        //buyer get his booking collection
        app.get('/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const orders = await bookingCollection.find(query).toArray();
            res.send(orders);
        });
        //----delete product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        });
        //delete after paid
        app.delete('/paid/:id', async (req, res) => {
            const id = req.params.id;

            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            const query = { uid: id }
            const adDelete = await advertiseCollection.deleteOne(query);
            res.send(result);
        });

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