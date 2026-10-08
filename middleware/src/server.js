/*
MAIN FILE,IF FRONTEND DOEST CONNECT PROBLEM MOSTLY LIES HERE WITH CORS POLICY
*/

import "./config/env.js";
import express from "express";
import cors from "cors";

import historyRoutes from "./routes/historyRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import { connectToDatabase } from "./config/auth_db.js";
import { connectToMongoDB } from "./config/mongo_db.js";

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

connectToMongoDB();
connectToDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/history", historyRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});