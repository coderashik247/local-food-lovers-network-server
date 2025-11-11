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

        //===================== Recipes APIs =====================//

        app.post('/recipes', async (req, res) => {
            const newRecipe = req.body;
            newRecipe.rating = parseFloat(newRecipe.rating) || 0;
            newRecipe.likes = parseInt(newRecipe.likes) || 0;
            newRecipe.createdAt = new Date();
            const result = await recipesCollection.insertOne(newRecipe);
            res.send(result);
        })

        // get all recipes
        app.get('/all-recipes', async (req, res) => {
            try {
                const result = await recipesCollection
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();

                res.send(result);
            } catch (error) {
                console.error("Error fetching recipes:", error);
                res.status(500).send({ message: "Failed to fetch recipes" });
            }
        });

        //sort by likes

        app.get('/all-recipes/like', async (req, res) => {
            try {
                const result = await recipesCollection
                    .find({})
                    .sort({ likes: -1, createdAt: -1 })
                    .limit(6)
                    .toArray();

                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch recipes" });
            }
        });

        // get single recipe
        app.get('/recipes/:id', async (req, res) => {
            const recipeId = req.params.id;
            const query = { _id: new ObjectId(recipeId) };
            const result = await recipesCollection.findOne(query);
            res.send(result);
        })

        // get recipes by reviewer email
        app.get('/recipes/email/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { reviewer_email: email };
                const result = await recipesCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching recipes by email:", error);
                res.status(500).send({ message: "Failed to fetch recipes by email" });
            }
        });


        // update only likes                   
        app.patch('/recipes-likes/:id', async (req, res) => {
            try {
                const recipeId = req.params.id;
                const { likes } = req.body;

                if (typeof likes !== 'number' || likes < 0) {
                    return res.status(400).send({ error: "Invalid 'likes' value" });
                }

                const query = { _id: new ObjectId(recipeId) };
                const updateDoc = { $set: { likes } };
                const result = await recipesCollection.updateOne(query, updateDoc);

                if (result.modifiedCount === 0) {
                    return res.status(404).send({ error: "Recipe not found or not updated" });
                }

                const updatedRecipe = await recipesCollection.findOne(query);
                res.send(updatedRecipe);
            } catch (error) {
                console.error("Error updating like count:", error);
                res.status(500).send({ error: 'Failed to update like count' });
            }
        });

        // update recipe
        app.patch('/recipes/:id', async (req, res) => {
            const recipeId = req.params.id;
            const updated = req.body;
            const query = { _id: new ObjectId(recipeId) };
            const updateDoc = { $set: updated };
            const result = await recipesCollection.updateOne(query, updateDoc);
            res.send(result);
        })
        
        // delete recipe
        app.delete('/recipes/:id', async (req, res) => {
            const recipeId = req.params.id;
            const query = { _id: new ObjectId(recipeId) };
            const result = await recipesCollection.deleteOne(query);
            res.send(result);
        })


        //===================== Reviews APIs =====================//

        // Create a new review
        app.post('/reviews', async (req, res) => {
            try {
                const { email, name, photo, rating, review_text, recipe_id } = req.body;

                if (!email || !name || !rating || !review_text || !recipe_id) {
                    return res.status(400).send({ message: "All fields are required!" });
                }

                const review = {
                    email,
                    name,
                    photo,
                    rating,
                    review_text,
                    recipe_id,
                    createdAt: new Date()
                };

                const result = await reviewsCollection.insertOne(review);
                res.status(201).send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to create review", error });
            }
        });

        // Get reviews (optionally filtered by recipe)
        app.get('/reviews', async (req, res) => {
            try {
                const recipeId = req.query.recipeId;
                const query = {};
                if (recipeId) query.recipe_id = recipeId;

                const reviews = await reviewsCollection.find(query).sort({ createdAt: -1 }).toArray();
                res.send(reviews);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch reviews", error });
            }
        });

        // Update a review by ID
        app.patch('/reviews/:id', async (req, res) => {
            try {
                const reviewId = req.params.id;
                const updatedFields = req.body;
                const query = { _id: new ObjectId(reviewId) };
                const updateDoc = { $set: updatedFields };

                const result = await reviewsCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to update review", error });
            }
        });

        // Delete a review by ID
        app.delete('/reviews/:id', async (req, res) => {
            try {
                const reviewId = req.params.id;
                const query = { _id: new ObjectId(reviewId) };
                const result = await reviewsCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to delete review", error });
            }
        });



        //===================== Favorites APIs =====================//


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
                query.email = email;
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