import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#dfe7ef] px-6 text-center font-[Arial,sans-serif]">
            <h1 className="text-5xl font-bold text-gray-800">Prompt Hire</h1>
            <p className="mt-4 max-w-md text-lg leading-7 text-gray-600">
                Prepare for your next interview with practice tailored to your skills and experience.
            </p>
            <Link
                to="/login"
                className="mt-7 rounded-lg bg-[#0C67A0] px-7 py-3 font-semibold text-white transition hover:bg-[#0A5C8A]"
            >
                Start now
            </Link>
        </div>
    );
}

export default Home;
