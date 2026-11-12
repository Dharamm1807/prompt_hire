/*
THIS FILE GENERATES NEW CHAT AFTER USER PROVIDES TITLE AND PDF FILE AND STORES IT IN MONGODB DATABASE
NEED TO CREATE HISTORY ID FOR EACH USER AND STORE IT IN MONGODB DATABASE
*/

import history from "../../models/historyModels.js";
import mongoose from "mongoose";
import { getIdFromToken } from "../../tokenManager/getIdfromToken.js";
import { uploadDoc } from "../documentControllers/uploadDoc.js";
import { readDoc } from "../documentControllers/readDoc.js";
import initialResponse from "../aiControllers/initialResponse.js";
import message from "../../models/messageModels.js";

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
            history_id: new Date().getTime().toString(),

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

        let content = "";
        if(documentText) {
            // Generate initial questions using LLM
            const questions = await initialResponse(documentText);
            content = JSON.stringify(questions);

            //save questions to message collection
            const newMessage = new message({
                message_id: new Date().getTime().toString(),
                content: JSON.stringify(questions),
                content_type: "json",
                history_id: savedHistory.history_id,
                role: "bot",
                created_at: new Date()
            });

            const savedMessage = await newMessage.save();
        }

        res.status(201).json({
            message: "New history created successfully.",
            newMessage : content,
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