import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "./api.js";

const Navbar = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem("token")));

    useEffect(() => {
        const syncAuth = () => setIsLoggedIn(Boolean(localStorage.getItem("token")));

        window.addEventListener("storage", syncAuth);
        window.addEventListener("auth-changed", syncAuth);

        return () => {
            window.removeEventListener("storage", syncAuth);
            window.removeEventListener("auth-changed", syncAuth);
        };
    }, []);

    const publicItems = [
        { name: "Home", path: "/home" },
        { name: "Signup", path: "/signup" },
        { name: "Login", path: "/login" }
    ];

    const authenticatedItems = [
        { name: "Dashboard", path: "/dashboard" },
        { name: "User Profile", path: "/userprofile" }
    ];

    const listItems = isLoggedIn ? authenticatedItems : publicItems;

    const handleLogout = async () => {
        const token = localStorage.getItem("token");

        if (token) {
            try {
                await fetch(`${API_URL}/api/auth/logout`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error("Logout request failed:", error);
            }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        window.dispatchEvent(new Event("auth-changed"));
        navigate("/login");
    };

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2
        rounded-full backdrop-blur-md bg-black/60
        text-white shadow-lg z-10 px-10 py-3">

            <ul className="flex gap-8 text-sm">

                {listItems.map((item) => (
                    <li
                        className="relative group cursor-pointer"
                        key={item.name}
                    >
                        <Link to={item.path}>
                            {item.name}
                        </Link>

                        <span className="absolute left-0
                        bottom-[-5px] w-0 h-1 rounded-xl
                        bg-gradient-to-r from-blue-500
                        to-green-500 transition-all duration-300
                        group-hover:w-full">
                        </span>

                    </li>
                ))}

                {isLoggedIn && (
                    <li className="relative group cursor-pointer">
                        <button type="button" onClick={handleLogout}>
                            Logout
                        </button>
                        <span className="absolute left-0
                        bottom-[-5px] w-0 h-1 rounded-xl
                        bg-gradient-to-r from-red-500
                        to-orange-500 transition-all duration-300
                        group-hover:w-full">
                        </span>
                    </li>
                )}

            </ul>
        </div>
    );
};

export default Navbar;
