/*
CONNECTS TO MONGO DB SERVER
*/

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI;

export async function connectToMongoDB() {
    try {
        await mongoose.connect(MONGO_URI);

        console.log("Connected to MongoDB");
        console.log("MongoDB readyState:", mongoose.connection.readyState);

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}