
import { useState, useRef } from "react";

function Profile() {

    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be smaller than 5 MB.");
            return;
        }

        setError("");
        setSelectedFile(file);

        const reader = new FileReader();

        reader.onloadend = () => {
            setPreview(reader.result);
        };

        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-[#dfe7ef] flex justify-center pt-20">

            <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow text-center">

                <div className="w-24 h-24 mx-auto rounded-full bg-[#0C67A0] flex items-center justify-center text-white text-3xl font-bold overflow-hidden">

                    {preview ? (
                        <img
                            src={preview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        username ? username.charAt(0).toUpperCase() : "?"
                    )}

                </div>

                <h1 className="mt-5 text-2xl font-bold text-gray-800">
                    @{username}
                </h1>

                <p className="mt-2 text-gray-500">
                    {email}
                </p>

                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                />

                
                <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="mt-6 rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                >
                    Choose profile picture
                </button>

                {error && (
                    <p className="mt-3 text-sm text-red-500">
                        {error}
                    </p>
                )}

                {selectedFile && (
                    <p className="mt-3 text-sm text-gray-500">
                        Selected: {selectedFile.name}
                    </p>
                )}

            </div>

        </div>
    );
}

export default Profile;

//local storage is being used to store the user rn. Will use backend in future. 
// ABHI BAS browser side se info aa rha hai. 
// You know how i told you console pe password dikh rha tha?
//  Vahi se information aa rhi hai. So, abhi ke liye, local storage me username aur email store ho rha hai.
//  Future me backend se data fetch karungi abhi this is for my understanding.