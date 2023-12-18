const Subscription = require('../models/subscription');
const Plan = require('../models/plans');
const User = require('../models/user');
const paypal = require('paypal-rest-sdk');

paypal.configure({
    mode: 'sandbox', 
    client_id: 'AYyaoWUbw3Cp51aC-IdE8CNDvOydDQsEm_OvB-6VRh0aWK1GdJG0KODRBdXP9HJULzY0hLECuu0rmx-d',
    client_secret: 'EHypYhU22c-isZa6l_999h0-jsH5ArfuRMuZIpT85p0WeDpihSoYRS6aqFGNBJ0bPjD08hHwRtS9UpCC',
});

exports.createPayment = async(req, res) =>{
    try {
        const { userId, planId} = req.body;

        const plan = await Plan.findById(planId);
        const price = plan.price;
        // Create a payment
        const createPaymentJson = {
          intent: 'sale',
          payer: {
            payment_method: 'paypal',
          },
          transactions: [
            {
              amount: {
                currency: 'USD',
                total: price.toString(),
              },
            },
          ],
          redirect_urls: {
            return_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
          },
        };
      
        paypal.payment.create(createPaymentJson, async (error, payment) => {
          if (error) {
            console.error(error.response);
            throw error;
          } else {
            // Save subscription details
            const subscription = new Subscription({
              userId,
              planId,
              paymentId: payment.id,
              token: payment.token,
            });
           const savedSubscription =  await subscription.save();
      
            // Redirect user to PayPal for approval
            const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
            return res.status(200).json({savedSubscription, approvalUrl});
          }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Something Went Wrong!"});
        
    }
};

exports.successPayment = async(req, res) =>{
    try {
        const { paymentId, PayerID } = req.query;

        const executePaymentJson = {
          payer_id: PayerID,
        };
      
        paypal.payment.execute(paymentId, executePaymentJson, async (error, payment) => {
          if (error) {
            console.error(error.response);
            throw error;
          } else {
            // Update subscription status
            await Subscription.findOneAndUpdate({ paymentId }, { $set: { isActive: true } });
      
            return res.status(200).json({message:"Payment Done Successfully"});
          }
        });
    } catch (error) {
        
    }
}