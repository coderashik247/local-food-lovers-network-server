const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// Mongo DB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fj5vaxe.mongodb.net/?appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('Checking Local Food Lovers Network Server');
});

async function run() {
    try {
        await client.connect();

        const db = client.db('localFoodDB');
        const reviewsCollection = db.collection('reviews');
        const favoritesCollection = db.collection('favorites');

        // Get all reviews (Public) or filter by email
        app.get('/reviews', async(req, res) =>{
            const email = req.query.email;
            const query ={}
            if(email) {
                query.reviewer_email = email;
            }
            const cursor = reviewsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //Get one review by ID
        app.get('/reviews/:id', async(req, res)  =>{
            const reviewId = req.params.id;
            const query = {_id: new ObjectId(reviewId)};
            const result = await reviewsCollection.findOne(query);
            res.send(result);
        })

        // Add new review (Protected korte hobe)
        app.post('/reviews', async(req, res) =>{
            const newReviews = req.body;
            const result = await reviewsCollection.insertOne(newReviews);
            res.send(result);
        })

        // Update review
        app.patch('/reviews/:id', async(req, res) =>{
            const reviewId = req.params.id;
            const updated = req.body;
            const query = {_id: new ObjectId(id)}
            const update = {
                $set:updated
            }
            res.send(result);
        })

        // Delete review (Protected korte hobe)
        app.delete('/reviews/:id', async(req, res) =>{
            const reviewId = req.params.id;
            const query = {_id: new ObjectId(reviewId)};
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        })

        // Favorites (Protected korte hobe)
        app.post('/favorites', async(req, res) =>{
            const favorites = req.body;
            const result = await favoritesCollection.insertOne(favorites);
            res.send(result);
        });

        // Favorites get
        app.get('/favorites', async(req, res) =>{
            const email = req.query.email;
            const query = {};
            if(email){
                query.user_email = email;
            }
            const cursor = favoritesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Favorites delete
        app.delete('/favorites/:id', async(req, res) =>{
            const favoritesId = req.params.id;
            const query = {_id: new ObjectId(favoritesId)}
            const result = await favoritesCollection.deleteOne(query);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    }
    finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Local Food Lover Network Server app is listening on port ${port}`);
})