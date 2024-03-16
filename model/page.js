const mongoose = require('mongoose');
const pageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug:{
        type: String,
        required: true,


    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    banners: [
        {
            type: String,
          },
    
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });


module.exports = mongoose.model('Page', pageSchema);