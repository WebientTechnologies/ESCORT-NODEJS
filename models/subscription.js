const mongoose = require("mongoose");

const subscriptions = new mongoose.Schema(
    {
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required:false,
        },
        planId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Plan',
            required:false,
        },
        isExpired: {
            type:Boolean,
            default:false
        },
        isActive: {
            type:Boolean,
            default:false
        },
        paymentId: {
            type:String,
            required:false,
        },
        payerId : {
            type:String,
            required:false,
        },
        token: {
            type:String,
            required:false,
        },
    },
    {timestamps:true}
);

module.exports = mongoose.model("Subscription", subscriptions);