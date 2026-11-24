import pool from "../../config/auth_db.js";
import { getIdFromToken } from "../../tokenManager/getIdfromToken.js";

export const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Authorization token is missing." });
        }

        const user = await getIdFromToken(token);
        const userId = user.rows[0]?.user_id;

        if (!userId) {
            return res.status(401).json({ message: "User not authenticated." });
        }

        await pool.query(
            `UPDATE public."Users" SET token = NULL WHERE user_id = $1`,
            [userId]
        );

        return res.status(200).json({ message: "Logout successful." });
    } catch (error) {
        console.error("Error occurred while logging out:", error);

        if (error.message === "Invalid token") {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        return res.status(500).json({ message: "Internal server error." });
    }
};

export default logout;