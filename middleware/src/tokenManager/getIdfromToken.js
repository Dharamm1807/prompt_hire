/*
THIS WILL TAKE TOKEN AS AN INPUT AND RETURN USER DETAILS
FROM THE DATABASE IF TOKEN IS VALID
*/

import jwt from "jsonwebtoken";
import pool from "../config/auth_db.js";

export const getIdFromToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const username = decoded.username;
        const email = decoded.email;

        if (!username || !email) {
            throw new Error("Invalid token payload");
        }

        const user = await pool.query(
            `SELECT * FROM public."Users" WHERE username = $1 AND email = $2`,
            [username, email]
        );

        if (user.rows.length === 0) {
            throw new Error("User not found");
        }

        return user;

    } catch (error) {
        console.error("Token verification error:", error);
        throw new Error("Invalid token");
    }
};