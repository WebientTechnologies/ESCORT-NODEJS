const Plan = require('../models/plans');

exports.createPlan = async(req, res) =>{
    try {
        const {name, price, validity} = req.body;

        const existingPlan = await Plan.findOne({name:name});
        if(existingPlan){
            return res.status(409).json({message:"The Plan Name Entered By You Is Already Exist!"});
        }

        const newPlan = new Plan({
            name,
            price,
            validity
        });

        const savedPlan = await newPlan.save();

        return res.status(200).json({message:"Plan Created Successfully", data:savedPlan});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Something Went Wrong!"});
    }
};

exports.getPlans = async(req, res) =>{
    try {
        const plans = await Plan.find();
        return res.status(200).json({plans});
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Something Went Wrong!"});
    }
}