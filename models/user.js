const mongoose = require("mongoose");

const users = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        email: {
            type:String,
            required:true,
            maxLength:255,
        },
        password: {
            type:String,
            required:true,
            maxLength:255,
        },
        email_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        mobile: {
            type:String,
            required:true,
            maxLength:50,
        },
        mobile_otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        dob: {
            type:Date,
            required:false,
        }, 
        age: {
            type:Number,
            required:false,
        },
        bio: {
            type:String,
            required:false,
            maxLength:500,
        },
        prices: [{
           bookingHrs:{
                type:String,
                required:false,
                maxLength:50,
           },
           price:{
                type:String,
                required:false,
                maxLength:50,
           },
        }],
        ethnicity: {
            type:String,
            required:false,
            maxLength:255,
        },
        bodyType: {
            type:String,
            required:false,
            enum:[ "curvy", "busty", "athletic", "slim", "BBW"],
            default:"curvy"
        },
        languages: {
            type:String,
            required:false,
            enum:[ "english", "chinese"],
            default:"english"
        },
        height: {
            type:String,
            required:false,
            maxLength:255,
        },
        weight: {
            type:String,
            required:false,
            maxLength:255,
        },
        breastSize: {
            type:String,
            required:false,
            enum:[ "A", "B", "C", "D", "DD", "E", "F"],
            default:"A"
        },
        hairColor: {
            type:String,
            required:false,
            enum:[ "brunette", "blond", "red", "black", "other"],
            default:"brunette"
        },
        meetingWith: [{
            type:String,
            required:false,
            enum:[ "men", "women", "transgender"],
            default:"men"
        }],
        incalls: {
            type:Boolean,
            defaault:false,       
        },
        outcalls: {
            type:Boolean,
            defaault:false,       
        },
        otp: {
            type:String,
            required:false,
            maxLength:50,
        },
        location: {
            type: {
              type: String,
              enum: ["Point"], // Specify that it's a GeoJSON Point
              required: false,
            },
            coordinates: {
              type: [Number],
              required: false,
              validate: {
                validator: function (value) {
                  // Ensure coordinates are valid [longitude, latitude] pairs
                  return Array.isArray(value) && value.length === 2 && isFinite(value[0]) && isFinite(value[1]);
                },
                message: "Invalid coordinates",
              },
            },
        },
        mobile_verified_at: {
            type:Date,
            required:false,
        },
        email_verified_at: {
            type:Date,
            required:false,
        },
        status: {
            type:String,
            enum:["inactive", "active", "rejected"],
            default:"inactive"
        },
        files:[{
            Bucket:{
                type:String,
                required:false,
                maxLength:255,
            },
            Key:{
                type:String,
                required:false,
                maxLength:255,
            },
            Url:{
                type:String,
                required:false,
                maxLength:255,
            }
        }],
        role:{
            type:String,
            enum:["Admin", "Escort"],
            default:"Escort"
        },
        nationality:{
            type:String,
            required:false,
            maxLength:255,
        },
        city:{
            type:String,
            required:false,
            maxLength:255,
        },
        state:{
            type:String,
            required:false,
            maxLength:255,
        },
        pincode:{
            type:String,
            required:false,
            maxLength:50,
        },
        address:{
            type:String,
            required:false,
            maxLength:255,
        },
        serviceIds:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            required:false,
        }],
        deviceId:{
            type:String,
            required:false,
            maxLength:800,
        },
        fb:{
            type:String,
            required:false,
            maxLength:800,
        },
        insta:{
            type:String,
            required:false,
            maxLength:800,
        },
        of:{
            type:String,
            required:false,
            maxLength:800,
        },
        bookedCount: {
            type:Number,
            required:false,
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
users.index({ location: "2dsphere" });
module.exports = mongoose.model("User", users);