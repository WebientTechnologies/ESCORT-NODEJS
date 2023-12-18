const mongoose = require("mongoose");

const plans = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        price: {
            type:Number,
            required:true,
            maxLength:255,
        },
        validity: {
            type:String,
            required:true,
            maxLength:255,
        },
        createdAt:{
            type:Date,
            required:true,
            default:Date.now(),
        },
        updatedAt:{
            type:Date,
            required:true,
            default:Date.now(),
        }
    }
);

module.exports = mongoose.model("Plan", plans);