import { Link } from "react-router-dom";

const listItems = [
    { name: "Home", path: "/home" },
    { name: "Signup", path: "/signup" },
    { name: "Login", path: "/login" },
    { name: "Dashboard", path: "/dashboard"},
    { name: "User Profile", path: "/userprofile" }
];

const Navbar = () => {
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

            </ul>
        </div>
    );
};

export default Navbar;
