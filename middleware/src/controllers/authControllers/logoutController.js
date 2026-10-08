/*
DOESNT WORK RIGHT NOW IGNORE THIS FILE FOR NOW
*/

async function logout(req, res) {
    try {
        // Perform any necessary cleanup, such as invalidating tokens or clearing session data
        // For example, if you're using JWT, you might want to blacklist the token
        // If you're using sessions, you can destroy the session
        // Here, we'll just send a success response
        res.status(200).json({ message: "Logout successful." });
    }
    catch (error) { 

        console.error("Error occurred while logging out:", error);
        res.status(500).json({ message: "Internal server error." });
    }  
}