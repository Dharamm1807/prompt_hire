/*
UPLOADS THE PDF DOCUMENT TO SUPABASE STORAGE AND RETURNS THE PATH OF THE DOCUMENT
*/

import supabase from "../../config/supabase.js";

export async function uploadDoc(file){
    try {
        const filename = `${Date.now()}-${file.originalname}`;

        const { data, error } = await supabase.storage
            .from('documents')
            .upload(filename, file.buffer, {
                contentType: "application/pdf",
                upsert: false
            });

            if(error){
                console.error("Error occurred while uploading document:", error);
                throw new Error("Document upload failed.");
            }

        return data.path;

    }catch(error){
        console.error("Error occurred while uploading document:", error);
        throw new Error("Document upload failed.");
    }
}