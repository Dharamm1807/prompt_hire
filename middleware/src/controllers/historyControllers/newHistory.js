/*
THIS FILE GENERATES NEW CHAT AFTER USER PROVIDES TITLE AND PDF FILE AND STORES IT IN MONGODB DATABASE
NEED TO CREATE HISTORY ID FOR EACH USER AND STORE IT IN MONGODB DATABASE
*/

import history from "../../models/historyModels.js";
import mongoose from "mongoose";
import { getIdFromToken } from "../../tokenManager/getIdfromToken.js";
import { uploadDoc } from "../documentControllers/uploadDoc.js";
import { readDoc } from "../documentControllers/readDoc.js";

export const newHistory = async (req, res) => {
    try {
        console.log("New history endpoint hit");

        // Extract title and PDF
        const title = req.body.title;
        const document = req.file;

        console.log("Title received:", title);
        console.log("Document received:", document?.originalname);

        // Get token from request headers
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authorization token is missing."
            });
        }

        // Authenticate user
        const user = await getIdFromToken(token);

        const userId = user.rows[0]?.user_id;

        if (!userId) {
            return res.status(401).json({
                message: "User not authenticated."
            });
        }

        console.log("Authenticated user:", userId);

        // Upload PDF to Supabase
        let pdfPath = null;

        if (document) {
            pdfPath = await uploadDoc(document);
        }

        // Extract PDF text
        let documentText = null;

        if (document) {
            documentText = await readDoc(document);
        }

        // Create history document
        const newHistory = new history({
            user_id: userId,
            history_id: 1,

            pdf: {
                name: document ? document.originalname : null,
                url: pdfPath
            },

            document_text: documentText,
            title: title
        });

        // Save to MongoDB
        console.log("Saving history to MongoDB...");
        console.log("MongoDB readyState:", mongoose.connection.readyState);

        const savedHistory = await newHistory.save();

        console.log("New history saved:", savedHistory);

        res.status(201).json({
            message: "New history created successfully.",
            history: savedHistory
        });

    } catch (error) {
        console.error(
            "Error occurred while creating new history:",
            error
        );

        res.status(500).json({
            message: "Internal server error."
        });
    }
};