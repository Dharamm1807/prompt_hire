// This is a sample signup for now, will make a navigation bar later 
// The form may or may not be in use later

import {useState} from "react";
import { useNavigate } from "react-router-dom";

function Form() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();
    


    const handleSubmit = (e) => {
        e.preventDefault();

        // Send the form data to the backend for processing
        fetch("http://localhost:3000/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password }) 
        })
        .then(async (response) => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Signup failed");
            }
            return response.json();
        })
        .then((data) => {
            console.log("Success:", data);
            // Redirect to the login page after successful signup
            navigate("/login");
        })
        .catch((error) => {
            console.error("Error:", error);
        }); 

//Commented out code that checked if the username, email, and password were being captured correctly from the form inputs from the frontend.


/*      console.log("Username:", username);
        console.log("Email:", email);
        console.log("Password:", password); */
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#dfe7ef] font-[Arial,sans-serif]">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-[10px] bg-white p-5 shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
            >
                <h2 aria-label="Signup" className="mb-5 text-2xl font-bold">
                    Signup
                </h2>

                <label className="mb-1 block">Username:</label>
                <input
                    type="text"
                    placeholder="dippy"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mb-[10px] w-full rounded-[5px] border border-[#ddd] p-[10px]"
                />

                <label className="mb-1 block">Email:</label>
                <input
                    type="email"
                    placeholder="deepikathapliyal32@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-[10px] w-full rounded-[5px] border border-[#ddd] p-[10px]"
                />

                <label className="mb-1 block">Password:</label>
                <input
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[5px] border border-[#ddd] p-[10px]"
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
                    className="w-full cursor-pointer rounded-[5px] border-none bg-[#033452] p-[10px] text-white hover:bg-[#04466d]">
                    Sign Up
                </button>
            </form>
        </div>
    );
}

export default Form;