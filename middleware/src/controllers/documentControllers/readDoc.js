/*
PARSES RAW PDF FILE AND EXTRACTS DATA AND RETURNS 
*/

import { PDFParse } from "pdf-parse";

export const readDoc = async (file) => {
    try {
        const parser = new PDFParse({
            data: file.buffer
        });

        const result = await parser.getText();

        await parser.destroy();

        console.log("PDF text extracted successfully!");

        return result.text;

    } catch (error) {
        console.error("Error occurred while reading document:", error);
        throw new Error("Document reading failed.");
    }
};