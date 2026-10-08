/*
READ LOGIN CONTROLLER COMMENTS BEFORE THIS IMPORTS ARE BASICALLY THE SAME AND THIS TAKES USERNAME AS AN INPUT ALSO
I THINK TOKEN MANAGEMENT IS QUITE BUGGY AND I HAVENT TESTED IT RIGHT NOW BUT NORMAL SIGNUP AND LOGIN SEEMS TO FUNCTION
*/

import argon2 from "argon2";
import pool from "../../config/auth_db.js";
import { createToken } from "../../tokenManager/createToken.js";

export const signup = async (req, res) => {
    console.log("Signup endpoint hit....")
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, password, and username are required." });
    }

    try {
        
        //checks if user with same email already exists
        const existingUser = await pool.query(
            `SELECT * FROM public."Users" WHERE email = $1`,
            [email]
        );
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ message: "User with this email already exists." });
        }
        
        //random ass test for password might remove later 
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }
        
        //hashes password
        const hashedPassword = await argon2.hash(password);
        
        //create token
        const token = createToken({ username: username, email : email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Insert the new user into the database
        const user = await pool.query(
            `INSERT INTO public."Users" (email, password, username, token) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [email, hashedPassword, username, token]
        );

        res.status(201).json({ message: "User created successfully.", user: user.rows[0] });
    } catch (error) {
        console.error("Error occurred while signing up:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}
