/*
ADD MESSAGE CONTROLLER
WILL HANDLE ADDING A NEW MESSAGE TO THE DATABASE
REQUEST BODY WILL CONTAIN THE MESSAGE CONTENT AND HISTORY ID AS WELL AS ROLE OF THE USER    
TOKEN IN THE REQUEST HEADER WILL BE USED TO AUTHENTICATE THE USER AND GET THE USER ID
*/

import {getIdFromToken} from "../../tokenManager/getIdfromToken.js";
import message from "../../models/messageModels.js";

export const addMessage = async (req, res) => {
    try {
        console.log("Add message endpoint hit");
        const { content } = req.body;
        const { history_id } = req.body;
        const { role } = req.body;

        //extract the token from the request headers
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing." });
        }

        //get the user details from the token
        const user = await getIdFromToken(token);
        const userId = user.rows[0].user_id;

        // Create a new message object with the user ID and message content
        const newMessage = new message({
            message_id: new Date().getTime().toString(),  
            content: content,
            content_type: "text", 
            history_id: history_id,
            role : role,
            created_at: new Date()
        });

        // Save the new message to the database
        const savedMessage = await newMessage.save();

        res.status(201).json({ message: "Message added successfully.", data: savedMessage });
    }
    catch (error) {
        console.error("Error occurred while adding message:", error);
        res.status(500).json({ message: "Internal server error." });
    }  
};
