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
        const recipesCollection = db.collection('recipes');
        const reviewsCollection = db.collection('reviews');
        const favoritesCollection = db.collection('favorites');

        app.get('/recipes', async (req, res) => {
            const email = req.query.email;
            const featured = req.query.featured === "true";
            const query = {};
            if (email) {
                query.reviewer_email = email;
            }
            let cursor;
            if (featured) {
                cursor = recipesCollection
                    .find({})
                    .sort({ rating: -1 })
                    .limit(6);
            } else {
                cursor = recipesCollection.find(query);
            }
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/recipes/:id', async (req, res) => {
            const recipeId = req.params.id;
            const query = { _id: new ObjectId(recipeId) };
            const result = await recipesCollection.findOne(query);
            res.send(result);
        })

        app.post('/recipes', async (req, res) => {
            const newRecipe = req.body;
            newRecipe.rating = parseFloat(newRecipe.rating) || 0;
            newRecipe.createdAt = new Date();
            const result = await recipesCollection.insertOne(newRecipe);
            res.send(result);
        })

        app.patch('/recipes/:id', async (req, res) => {
            const recipeId = req.params.id;
            const updated = req.body;
            const query = { _id: new ObjectId(recipeId) };
            const updateDoc = { $set: updated };
            const result = await recipesCollection.updateOne(query, updateDoc);
            res.send(result);
        })

        app.delete('/recipes/:id', async (req, res) => {
            const recipeId = req.params.id;
            const query = { _id: new ObjectId(recipeId) };
            const result = await recipesCollection.deleteOne(query);
            res.send(result);
        })


        // Favorites (Protected korte hobe)
        app.post('/favorites', async (req, res) => {
            const favorites = req.body;
            const result = await favoritesCollection.insertOne(favorites);
            res.send(result);
        });

        // Favorites get
        app.get('/favorites', async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.user_email = email;
            }
            const cursor = favoritesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Favorites delete
        app.delete('/favorites/:id', async (req, res) => {
            const favoritesId = req.params.id;
            const query = { _id: new ObjectId(favoritesId) }
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