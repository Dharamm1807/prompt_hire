/*
BUM
*/

import { signup } from "../controllers/authControllers/signupController.js";
import { login } from "../controllers/authControllers/loginController.js";
import { logout } from "../controllers/authControllers/logoutController.js";
import express from "express";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);   
router.post("/logout", logout);


export default router;