const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fj5vaxe.mongodb.net/?appName=Cluster0`;

// Create MongoClient
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

        //===================== reviews APIs =====================//

        // Add new recipe
        app.post('/reviews', async (req, res) => {
            const newRecipe = req.body;
            newRecipe.rating = parseFloat(newRecipe.rating) || 0;
            newRecipe.likes = parseInt(newRecipe.likes) || 0;
            newRecipe.createdAt = new Date();
            const result = await reviewsCollection.insertOne(newRecipe);
            res.send(result);
        });

        // Get all reviews (latest first)
        app.get('/all-reviews', async (req, res) => {
            try {
                const result = await reviewsCollection
                    .find({})
                    .sort({ createdAt: -1 })
                    .toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching reviews:", error);
                res.status(500).send({ message: "Failed to fetch reviews" });
            }
        });

        // Get top 6 reviews by likes
        app.get('/all-reviews/like', async (req, res) => {
            try {
                const result = await reviewsCollection
                    .find({})
                    .sort({ likes: -1, createdAt: -1 })
                    .limit(6)
                    .toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching top liked reviews:", error);
                res.status(500).send({ message: "Failed to fetch reviews" });
            }
        });

        // Get single recipe by ID
        app.get('/reviews/:id', async (req, res) => {
            try {
                const recipeId = req.params.id;
                const query = { _id: new ObjectId(recipeId) };
                const result = await reviewsCollection.findOne(query);

                if (!result) {
                    return res.status(404).send({ message: "Recipe not found" });
                }

                res.send(result);
            } catch (error) {
                console.error("Error fetching recipe:", error);
                res.status(500).send({ message: "Failed to fetch recipe" });
            }
        });

        // Get reviews by reviewer email
        app.get('/reviews/email/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { reviewer_email: email };
                const result = await reviewsCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching reviews by email:", error);
                res.status(500).send({ message: "Failed to fetch reviews by email" });
            }
        });

        // Only Like
        app.patch('/reviews-likes/:id', async (req, res) => {
            try {
                const recipeId = req.params.id;
                const { userEmail } = req.body;

                if (!userEmail) {
                    return res.status(400).send({ error: "userEmail is required" });
                }

                const query = { _id: new ObjectId(recipeId) };
                const recipe = await reviewsCollection.findOne(query);

                if (!recipe) {
                    return res.status(404).send({ error: "Recipe not found" });
                }
                const alreadyLiked = recipe.likedBy?.includes(userEmail);

                if (alreadyLiked) {
                    return res.send(recipe);
                }
                const updatedLikes = (recipe.likes || 0) + 1;
                const updatedLikedBy = [...(recipe.likedBy || []), userEmail];

                const updateDoc = {
                    $set: {
                        likes: updatedLikes,
                        likedBy: updatedLikedBy
                    }
                };

                await reviewsCollection.updateOne(query, updateDoc);
                const updatedRecipe = await reviewsCollection.findOne(query);

                res.send(updatedRecipe);
            } catch (error) {
                console.error("Error in like:", error);
                res.status(500).send({ error: 'Failed to like' });
            }
        });

        // Update full recipe
        app.patch('/reviews/:id', async (req, res) => {
            try {
                const recipeId = req.params.id;
                const updated = req.body;
                const query = { _id: new ObjectId(recipeId) };
                const updateDoc = { $set: updated };
                const result = await reviewsCollection.updateOne(query, updateDoc);

                if (result.modifiedCount === 0) {
                    return res.status(404).send({ message: "Recipe not found or no changes made" });
                }

                res.send(result);
            } catch (error) {
                console.error("Error updating recipe:", error);
                res.status(500).send({ message: "Failed to update recipe" });
            }
        });

        // Delete recipe
        app.delete('/reviews/:id', async (req, res) => {
            try {
                const recipeId = req.params.id;
                const query = { _id: new ObjectId(recipeId) };
                const result = await reviewsCollection.deleteOne(query);

                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: "Recipe not found" });
                }

                res.send(result);
            } catch (error) {
                console.error("Error deleting recipe:", error);
                res.status(500).send({ message: "Failed to delete recipe" });
            }
        });

        // MongoDB Ping Test
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

run().catch(console.dir);

// Start Server
app.listen(port, () => {
    console.log(`Local Food Lover Network Server is running on port ${port}`);
});