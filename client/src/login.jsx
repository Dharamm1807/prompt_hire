//making login page
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "./api.js";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        // Send the login data to the backend for processing
        fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Login failed");
            }
            return response.json();
        })
        .then((data) => {
            console.log("Success:", data);
            localStorage.setItem("token", data.token); // This will save the token in local storage for later use (like accessing protected routes)
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("email", data.user.email);
            // Redirect to the dashboard page after successful login
            navigate("/dashboard");
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0C67A0] font-[Arial,sans-serif]">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-[10px] bg-white p-5 shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
            >
                <h2 aria-label="Login" className="mb-5 text-2xl font-bold">
                    Login
                </h2>

                <label className="mb-1 block">Email:</label>
                <input
                    type="email"
                    required    
                    placeholder="abc@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-[10px] w-full rounded-[5px] border border-[#ddd] p-[10px]"
                />

                <label className="mb-1 block">Password:</label>
                <input
                    type={isPasswordVisible ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mb-[10px] w-full rounded-[5px] border border-[#ddd] p-[10px]"
                />

                    <button
                    type="button"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="mb-3 mt-2 cursor-pointer text-sm text-[#007bff]"
                >
                    {isPasswordVisible ? "Hide Password" : "Show Password"}
                </button>


                <button
                    type="submit"
                    className="w-full rounded-[5px] bg-[#0C67A0] py-[10px] text-white hover:bg-[#0A5C8A]"
                >
                    Login
                </button>
            </form>
        </div>
    );
}

export default Login;