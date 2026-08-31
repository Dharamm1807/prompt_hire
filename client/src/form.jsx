// This is a sample signup for now, will make a navigation bar later 
// The form may or may not be in use later

import {useState} from "react";

function Form() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

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
        .then((response) => response.json())
        .then((data) => {
            console.log("Success:", data);
        })
        .catch((error) => {
            console.error("Error:", error);
        });

//Commented out code that c hecked if the username, email, and password were being captured correctly from the form inputs from the frontend.


/*      console.log("Username:", username);
        console.log("Email:", email);
        console.log("Password:", password); */
    }

    return (

        <form onSubmit={handleSubmit}>
            <h2> Signup </h2>
            <label>Username:</label>
            <input type= "text" placeholder="dippy" value={username} onChange={(e) => setUsername(e.target.value)} />
            <label>Email:</label>
            <input type= "text" placeholder="deepikathapliyal32@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Password:</label>
            <input type= "password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

            <br></br>
            <button type="submit">submit</button>

        </form>
    );
}

export default Form;