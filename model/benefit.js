const mongoose = require("mongoose");




const benefit = new mongoose.Schema({
    value:{
        type: Number,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model("Benefit", benefit);