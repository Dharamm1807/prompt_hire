import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Form from "./form.jsx";
import Login from "./login.jsx";
import "./index.css";
import Navbar from "./navbar.jsx";
import Home from "./home.jsx";
import Dashboard from "./dashboard.jsx";
import UserProfile from "./userprofile.jsx";

createRoot(document.getElementById("app")).render(
    <StrictMode>
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/signup" element={<Form />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/home" />} />   
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/userprofile" element={<UserProfile />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);

//local storage is being used to store the user rn. Will use backend in future. 
// ABHI BAS browser side se info aa rha hai. 
// You know how i told you console pe password dikh rha tha?
//  Vahi se information aa rhi hai. So, abhi ke liye, local storage me username aur email store ho rha hai.
//  Future me backend se data fetch karungi abhi this is for my understanding.