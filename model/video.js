const mongoose = require("mongoose");


const video = new mongoose.Schema({
    value:{
        type: String,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("Video", video);