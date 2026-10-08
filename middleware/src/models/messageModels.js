/*
MESSAGE MODEL FOR MONGODB DATABASE
*/

import mongoose from 'mongoose';

const message = new mongoose.Schema({
    history_id:{
        type: String,
        required: true
    },
    message_id:{
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    content_type: {
        type: String,
        required: true
    },
    content: {
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
    }
}
)


message.index({ history_id: 1 });

export default mongoose.model('message', message);