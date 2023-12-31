const Customer = require ('../models/customer');
const Escort = require('../models/escort');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
require("dotenv").config();

exports.signup = async(req,res) =>{
    try {
        const { name, email, mobile, password, username } = req.body;
    
        // Check if the email or mobile already exists in the database
        const existingCustomer = await Customer.findOne({
          $or: [{ email }, { mobile }, { username }],
        });
    
        if (existingCustomer) {
          return res.status(400).json({ message: 'Email or mobile or Username already exists' });
        }
    
        // Hash the password before saving it to the database
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
    
        // Create the new customer object with the hashed password
        const newCustomer = new Customer({
          name,
          email,
          mobile,
          password: hashedPassword,
          username,
          email_otp: null,
          mobile_otp: null,
          dob: null,
          age:null,
          latitude: null,
          longitude: null,
          mobile_verified_at: null,
          email_verified_at: null,
          file: null,
        });
    
        // Save the new customer to the database
        await newCustomer.save();
    
        return res.status(201).json({ message: 'Customer created successfully' });
      } catch (error) {
        console.error('Error during customer signup:', error);
        return res.status(500).json({ message: 'Something went wrong' });
      }
}

exports.login = async (req,res) => {
    try {

        //data fetch
        const {email, password} = req.body;
        //validation on email and password
        if(!email || !password) {
            return res.status(400).json({
                success:false,
                message:'PLease fill all the details carefully',
            });
        }

        //check for registered user
        let customer = await Customer.findOne({email});
        //if not a registered user
        if(!customer) {
            return res.status(401).json({
                success:false,
                message:'customer is not registered',
            });
        }
        console.log(customer._id)

        const payload = {
            email:customer.email,
            _id:customer._id,
        };
        //verify password & generate a JWT token
        if(await bcrypt.compare(password,customer.password) ) {
            //password match
            let token =  jwt.sign(payload, 
                                process.env.JWT_SECRET,
                                {
                                    expiresIn:"15d",
                                });

                                

            customer = customer.toObject();
            customer.token = token;
            customer.password = undefined;

            const options = {
                expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                httpOnly:true,
                sameSite: 'none',
                secure: true,
            }

            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                customer,
                message:'customer Logged in successfully',
            });
        }
        else {
            //passwsord do not match
            return res.status(403).json({
                success:false,
                message:"Password Incorrect",
            });
        }

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure',
        });

    }
}

exports.getMyProfile = async (req, res) => {
    try {
      const authenticatedUser = req.customer;
  
      const customerId = authenticatedUser._id;
  
      const customer = await Customer.findById(customerId).select('-password');
  
      if (!customer) {
        return res.status(404).json({ message: 'customer not found' });
      }

  
      return res.json({ customer });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Something went wrong' });
    }
};

exports.updateMyProfile = async(req, res) =>{
        const authenticatedUser = req.customer;
        
        const customerId = authenticatedUser._id;
    
        const { name, email, mobile, dob, username } = req.body;
        const updatedBy = req.customer.id;
    
        const file = req.s3FileUrl;
    
        try {
          const existingCustomer = await Customer.findById(customerId);
    
          if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
          }
    
          // Check if the provided email or mobile already exist for other customers
          const duplicateCustomer = await Customer.findOne({
            $and: [
              { _id: { $ne: existingCustomer._id } }, // Exclude the current customer
              { $or: [{ email }, { mobile }] }, // Check for matching email or mobile
            ],
          });
    
          if (duplicateCustomer) {
            return res.status(400).json({ error: 'Email or mobile already exists for another customer' });
          }

          // Calculate age based on dob and current date
          const birthDate = new Date(dob);
          const currentDate = new Date();
          let age = currentDate.getFullYear() - birthDate.getFullYear();

          // Check if the birthday has already occurred this year
          if (
            currentDate.getMonth() < birthDate.getMonth() ||
            (currentDate.getMonth() === birthDate.getMonth() &&
              currentDate.getDate() < birthDate.getDate())
          ) {
            age--;
          }
    
          const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            { name, email, mobile, dob, age, username, file, updatedBy, updatedAt: Date.now() },
            { new: true }
          );
    
          console.log(updatedCustomer); // Add this line for debug logging
          res.json(updatedCustomer);
        } catch (error) {
          console.error(error); // Add this line for debug logging
          return res.status(500).json({ error: 'Failed to update Customer' });
        }
      
};


exports.getAllCustomers = async (req, res)  => {
    try {
        const customers = await Customer.find().select('-password');
        
        res.json(customers);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch customers' });
    }
};
  
  
exports.getCustomerById = async (req, res) => {
  try {
      const customer = await Customer.findById(req.params.id).select('-password');
      if (!customer) {
      console.log(`customer with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'customer not found' });
      }

    

      res.json(customer);
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

exports.updateCustomer = async(req,res) =>{
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Error uploading image' });
    } else if (err) {
      return res.status(500).json({ error: 'Server error' });
    }

    const { name, email, mobile, dob, username } = req.body;
    const updatedBy = req.user.id;

    const file = req.s3FileUrl;

    try {
      const existingCustomer = await Customer.findById(req.params.id);

      if (!existingCustomer) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if the provided email or mobile already exist for other customers
      const duplicateCustomer = await Customer.findOne({
        $and: [
          { _id: { $ne: existingCustomer._id } }, // Exclude the current customer
          { $or: [{ email }, { mobile }] }, // Check for matching email or mobile
        ],
      });

      if (duplicateCustomer) {
        return res.status(400).json({ error: 'Email or mobile already exists for another customer' });
      }

      // Calculate age based on dob and current date
      const birthDate = new Date(dob);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - birthDate.getFullYear();

      // Check if the birthday has already occurred this year
      if (
        currentDate.getMonth() < birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() &&
          currentDate.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      const updatedCustomer = await Customer.findByIdAndUpdate(
        req.params.id,
        { name, email, mobile, dob, age, username, file, updatedBy, updatedAt: Date.now() },
        { new: true }
      );

      console.log(updatedCustomer); // Add this line for debug logging
      res.json(updatedCustomer);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update Customer' });
    }
  });
}

exports.getMyFavorite = async(req, res) =>{
  try {
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;

    const customer = await Customer.findById(customerId).select('-password').populate('favorites');

    if (!customer) {
      return res.status(404).json({ message: 'customer not found' });
    }

    const wishlistDetails = await Promise.all(customer.favorites.map(async (wishlistItem) => {
      console.log(wishlistItem._id);
      const escort = await Escort.findById(wishlistItem._id)
        .populate('serviceIds', 'name')
        .exec();
    
    if (!escort) {
      return null; // Handle the case where the product is not found
    }
    
      return escort;
  }));

    return res.json({ wishlistDetails });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

exports.addTofavorite = async (req, res) => {
  try {

    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const {escortId } = req.body; 

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (!customer.favorites.includes(escortId)) {
      customer.favorites.push(escortId);
      await customer.save();
    }

    return res.status(200).json({ message: 'Added As Favirate successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};

exports.removeFromFavorite = async (req, res) => {
  try {
    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const { escortId } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const productIndex = customer.favorites.indexOf(escortId);
    if (productIndex !== -1) {
      customer.favorites.splice(productIndex, 1); // Remove the product from the wishlist array
      await customer.save();
      return res.status(200).json({ message: 'Removed from favorites successfully' });
    } else {
      return res.status(404).json({ message: 'Not found in favorites' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'An error occurred' });
  }
};

exports.updateRecentlyViewedEscorts = async(req, res) => {
  try {

    const authenticatedUser = req.customer;

    const customerId = authenticatedUser._id;
    const escortId =req.params.id;
    // Find the customer by their ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Add the escort to the recently viewed list
    if (!customer.recentlyViewedEscorts.includes(escortId)) {
      customer.recentlyViewedEscorts.unshift(escortId);

      // Limit the recently viewed list to a certain number (e.g., 10)
      if (customer.recentlyViewedEscorts.length > 10) {
        customer.recentlyViewedEscorts.pop();
      }

      await customer.save();
      return res.status(200).json({ message: 'Done' });;
    }
  } catch (error) {
    console.error('Error updating recently viewed escorts:', error);
    throw error;
  }
};

exports.getMyRecentView =  async(req, res) =>{
  const authenticatedUser = req.customer;

  const customerId = authenticatedUser._id;

  try {
    // Find the customer by their ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get the IDs of recently viewed escorts
    const recentlyViewedEscortIds = customer.recentlyViewedEscorts;

    // Use the $in operator to fetch all escort documents by their IDs
    const recentlyViewedEscorts = await Escort.find({
      _id: { $in: recentlyViewedEscortIds },
    }).populate('serviceIds', 'name').exec();

    // Now you have an array of Escort documents with their details
    return res.json(recentlyViewedEscorts);
  } catch (error) {
    console.error('Error getting recently viewed escorts:', error);
    throw error;
  }
}
