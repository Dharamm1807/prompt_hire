/*
MAIN FILE,IF FRONTEND DOEST CONNECT PROBLEM MOSTLY LIES HERE WITH CORS POLICY
*/

import "./config/env.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { connectToDatabase } from "./config/auth_db.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

connectToDatabase();

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});