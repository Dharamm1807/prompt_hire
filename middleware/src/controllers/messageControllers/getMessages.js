/*
GET MESSAGES CONTROLLER
WILL HANDLE FETCHING MESSAGES FROM THE DATABASE
NEEDS HISTORY ID TO FETCH MESSAGES FOR A PARTICULAR USER
*/

import {getIdFromToken} from "../../tokenManager/getIdfromToken.js";
import message from "../../models/messageModels.js";

export const getMessages = async (req, res) => {
    try {
        console.log("Get messages endpoint hit");
        const { history_id } = req.body;



        //extract the token from the request headers
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing." });
        }

        //get the user details from the token
        const user = await getIdFromToken(token);
        const userId = user.rows[0].user_id;

        // Fetch messages from the database for the authenticated user
        const messagesResult = await message.find({  history_id: history_id }).sort({ created_at: -1 });
        
        if (!messagesResult) {
            return res.status(404).json({ message: "No messages found for the user." });
        }

        res.status(200).json({ messages: messagesResult });
    } catch (error) {
        console.error("Error occurred while fetching messages:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

