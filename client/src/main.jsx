import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Form from "./form";

createRoot(document.getElementById("app")).render(
    <StrictMode>
        <Form />
    </StrictMode>
);