/*
THIS CONTROLLER WILL TAKE TOKEN AS AN INPUT AND RETURN HISTORY OF THE USER
FROM THE DATABASE IF TOKEN IS VALID

*/

import {getIdFromToken} from "../../tokenManager/getIdfromToken.js";
import history from "../../models/historyModels.js";

export const getHistory = async (req, res) => {
    try {
        console.log("Get history endpoint hit");

        // Get token from request headers
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing." });
        }

        //get the user details from the token
        const user = await getIdFromToken(token);
        const userId = user.rows[0].user_id; 

        // Fetch history from the database for the authenticated user
        const historyResult = await history.find({ user_id: userId }).sort({ created_at: -1 });

        if (!historyResult){
            return res.status(404).json({ message: "No history found for the user." });
        }

        res.status(200).json({ history: historyResult });
    } catch (error) {
        console.error("Error occurred while fetching history:", error);
        res.status(500).json({ message: "Internal server error." });
    }

};
