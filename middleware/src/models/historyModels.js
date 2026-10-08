/*
HISTORY FORMAT IN MONGODB DATABASE
{
    user_id: "user_id",
    history_id: "history_id",
    pdf: {
        name: "pdf_name",
        url: "pdf_url"
    },
    document_text: "document_text", 
    title: "title",
    created_at: "created_at",
    updated_at: "updated_at"
}
*/

import mongoose from 'mongoose';

const history = new mongoose.Schema({
    user_id:{
        type: String,
        required: true
    },
    history_id:{
        type: String,
        required: true
    },
    pdf:{
        name:{
            type: String,
            required: false
        },
        url:{
            type: String,
            required: false
        }
    },
    document_text:{
        type: String,
        required: false
    },
    title: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },

})

export default mongoose.model("history", history);