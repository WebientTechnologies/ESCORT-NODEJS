const User = require("../models/user");
const Rating = require('../models/rating');
const Booking = require('../models/booking');
const Services = require('../models/service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
const nodemailer = require('nodemailer');
require("dotenv").config();
const admin = require('firebase-admin'); 
const serviceAccount = require('../escort-firebase.json');
const { Service } = require("aws-sdk");
const { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword} = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyBCWHyFbekCei5ypdXxX4xf-aDA2gs0JKY",
  authDomain: "escort-df1c6.firebaseapp.com",
  projectId: "escort-df1c6",
  storageBucket: "escort-df1c6.appspot.com",
  messagingSenderId: "957337834561",
  appId: "1:957337834561:web:c814f61179358348cfe2c0",
  measurementId: "G-CT1EHSJC1C"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

exports.signUp = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if the email or mobile already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }

    // Hash the password before saving it to the database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new customer object with the hashed password
    const newUser = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      email_otp: null,
      mobile_otp: null,
      dob: null,
      age: null,
      latitude: null,
      longitude: null,
      mobile_verified_at: null,
      email_verified_at: null,
      file: null,
      city: null,
      pincode: null,
      address: null,
    });

    // Save the new customer to the database
    await newUser.save();

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log('User UID:', user.uid);

        const newFirestoreUser = {
          uid: user.uid,
          email: user.email,
          name: newUser.name,
          image: '',
          isOnline: true,
          lastActive: new Date(),
          chatParticipants: [],
        };

        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, newFirestoreUser);

        console.log('Document successfully written to Firestore');
      })
      .catch((error) => {
        console.error('Error during Firebase user creation:', error);
        return res.status(500).json({ message: 'Error during Firebase user creation' });
      });

    return res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during customer signup:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};
  


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
        let user = await User.findOne({email});
        //if not a registered user
        if(!user) {
            return res.status(401).json({
                success:false,
                message:'User is not registered',
            });
        }
        if(user.role != "Admin"){
          return res.status(401).json({
            success:false,
            message:'You Are Not Admin',
        });
        }
        console.log(user._id)

        const payload = {
            email:user.email,
            _id:user._id,
            role:user.role,
        };
        //verify password & generate a JWT token
        if(await bcrypt.compare(password,user.password) ) {
            //password match
            let token =  jwt.sign(payload, 
                                process.env.JWT_SECRET,
                                {
                                    expiresIn:"15d",
                                });

                                
            // const deviceId = await admin.auth().createCustomToken(user._id.toString()); // Assuming _id is the user's unique identifier

            // // Store the device token in the user's record
            // user.deviceId = deviceId;

            // Save the updated user record
            await user.save();
            user = user.toObject();
            user.token = token;
            user.password = undefined;

            const options = {
                expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                httpOnly:true,
                sameSite: 'none',
                secure: true,
            }

            

            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:'User Logged in successfully',
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

exports.loginEscort = async (req,res) => {
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
      let user = await User.findOne({email});
      //if not a registered user
      if(!user) {
          return res.status(401).json({
              success:false,
              message:'User is not registered',
          });
      }
      if(user.role != "Escort"){
        return res.status(401).json({
          success:false,
          message:'You Are Not Escort',
      });
      }
      console.log(user._id)

      const payload = {
          email:user.email,
          _id:user._id,
          role:user.role,
      };
      signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        const userfire = userCredential.user;
          let token =  jwt.sign(payload, 
                              process.env.JWT_SECRET,
                              {
                                  expiresIn:"15d",
                              });
        
          user = user.toObject();
          user.token = token;
          user.password = undefined;

          const options = {
              expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
              httpOnly:true,
              sameSite: 'none',
              secure: true,
          }  

          res.cookie("token", token, options).status(200).json({
              success:true,
              token,
              user,
              message:'User Logged in successfully',
          });

        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
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
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const user = await User.findById(userId)
    .select('-password')
    .populate('serviceIds')
    .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const filters = {};
    filters.role = 'Escort';
    filters.status = 'active';
    if (req.query.city) {
      filters.city = { $regex:req.query.city, $options: 'i' };
    }

    if (req.query.state) {
      filters.state = { $regex:req.query.state, $options: 'i' };
    }

    if (req.query.age) {
      filters.age = req.query.age;
    }

    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: 'i' }; // Case-insensitive name search
    }

    if (req.query.serviceId) {
      filters.serviceIds = { $in: [req.query.serviceId] }; 
    }

    const users = await User.find(filters)
      .select('-password')
      .populate('serviceIds')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    if (!users) {
      return res.status(404).json({ message: 'User not found' });
    }

    const usersWithRatings = await Promise.all(users.map(async (user) => {
      const ratings = await Rating.find({ userId: user._id });
      const bookings = await Booking.find({userId:user._id, bookingStatus:"accepted"})
      return { ...user, ratings, bookings };
    }));

    return res.json({ users: usersWithRatings });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getUserForAdmin = async (req, res) => {
  try {
    
    const users = await User.find()
      .where('role')
      .ne('Admin')
      .select('-password')
      .populate('serviceIds', 'name')
      .lean();

    if (!users) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    const usersWithRatings = await Promise.all(users.map(async (user) => {
      const ratings = await Rating.find({ userId: user._id });
      const bookings = await Booking.find({userId:user._id, bookingStatus:"accepted"})
      return { ...user, ratings, bookings };
    }));

    return res.json({ users: usersWithRatings });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getUserById = async (req, res) => {
  try {

    const user = await User.findById(req.params.id)
    .populate('serviceIds', 'name').exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const ratings = await Rating.find({userId:user._id}).populate('customerId', 'name');
  
    return res.json({ user,ratings});
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updateUser = async(req,res) =>{
 
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;
    const { name, email, mobile, dob, city, state, pincode,address, bio, price, serviceIds, removeFiles} = req.body;
    const updatedBy = userId;

    const files = req.s3FileUrls;
    console.log(files);
    try {
      const existingUser = await User.findById(req.params.id);

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      
      const duplicateUser = await User.findOne({
        $and: [
          { _id: { $ne: existingUser._id } }, 
          { $or: [{ email }, { mobile }] }, 
        ],
      });

      if (duplicateUser) {
        return res.status(400).json({ error: 'Email or mobile already exists for another user' });
      }
      // Calculate age based on dob and current date
      let age = undefined;
      if(dob !== null && dob !== undefined && dob !== ''){
      const birthDate = new Date(dob);
      const currentDate = new Date();
       age = currentDate.getFullYear() - birthDate.getFullYear();

      // Check if the birthday has already occurred this year
      if (
        currentDate.getMonth() < birthDate.getMonth() ||
        (currentDate.getMonth() === birthDate.getMonth() &&
          currentDate.getDate() < birthDate.getDate())
      ) {
        age--;
      }
    }
      const user = await User.findById(req.params.id);
       user.name = name;
       user.email = email;
       user.mobile = mobile;
       user.dob = dob;
       user.age = age;
       user.bio = bio;
       user.price = price;
       user.serviceIds = serviceIds;
       user.city = city;
       user.state =state;
       user.pincode =pincode;
       user.address = address;
       user.updatedBy = updatedBy;
       user.updatedAt = Date.now()
       // Remove files with the specified IDs
      if (removeFiles && removeFiles.length > 0) {
        user.files = user.files.filter(file => !removeFiles.includes(file._id.toString()));
      }

      // Add newly uploaded files
      if (files && files.length > 0) {
        user.files.push(...files);
      }

      const updatedUser = await user.save();
      console.log(updatedUser); // Add this line for debug logging
      res.json(updatedUser);
    } catch (error) {
      console.error(error); // Add this line for debug logging
      return res.status(500).json({ error: 'Failed to update User' });
    }
};

exports.updateMyProfile = async(req,res) =>{
 
  const authenticatedUser = req.user;

  const userId = authenticatedUser._id;
  const { name, email, mobile, dob, city, state, pincode,address, bio, price} = req.body;
  const updatedBy = userId;

//   const files = req.s3FileUrls;
// console.log(files);
  try {
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const duplicateUser = await User.findOne({
      $and: [
        { _id: { $ne: existingUser._id } }, 
        { $or: [{ email }, { mobile }] }, 
      ],
    });

    if (duplicateUser) {
      return res.status(400).json({ error: 'Email or mobile already exists for another user' });
    }
    // Calculate age based on dob and current date
    let age = undefined;
    if(dob !== null && dob !== undefined && dob !== ''){
    const birthDate = new Date(dob);
    const currentDate = new Date();
     age = currentDate.getFullYear() - birthDate.getFullYear();

    // Check if the birthday has already occurred this year
    if (
      currentDate.getMonth() < birthDate.getMonth() ||
      (currentDate.getMonth() === birthDate.getMonth() &&
        currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }
  }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, mobile, age, dob, bio, price, city, state, pincode,address, updatedBy, updatedAt: Date.now() },
      { new: true }
    );

    console.log(updatedUser); // Add this line for debug logging
    res.json({user:updatedUser});
  } catch (error) {
    console.error(error); // Add this line for debug logging
    return res.status(500).json({ error: 'Failed to update User' });
  }
};

exports.updateMyGallery = async (req, res) => {
  const authenticatedUser = req.user;
  const userId = authenticatedUser._id;
  const { removeFiles } = req.body; // IDs of files to be removed
  const files = req.s3FileUrls; // Newly uploaded files

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove files with the specified IDs
    if (removeFiles && removeFiles.length > 0) {
      user.files = user.files.filter(file => !removeFiles.includes(file._id.toString()));
    }

    // Add newly uploaded files
    if (files && files.length > 0) {
      user.files.push(...files);
    }

    const updatedUser = await user.save();

    return res.json({user:updatedUser});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update files for the user' });
  }
};

exports.updateUserServices = async (req, res) => {
  const authenticatedUser = req.user;
  const userId = authenticatedUser._id;
  const { addServiceIds, removeServiceIds } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add new service IDs if they don't already exist
    if (addServiceIds && addServiceIds.length > 0) {
      addServiceIds.forEach(serviceId => {
        if (!user.serviceIds.includes(serviceId)) {
          user.serviceIds.push(serviceId);
        }
      });
    }

    // Remove service IDs
    if (removeServiceIds && removeServiceIds.length > 0) {
      user.serviceIds = user.serviceIds.filter(serviceId => !removeServiceIds.includes(serviceId.toString()));
    }

    const updatedUser = await user.save();

    return res.json({user:updatedUser});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update serviceIds for the user' });
  }
};


exports.getPopular = async (req, res) =>{
  try {
    const role = "Escort";
    const users = await User.find({role:role})
      .select('-password')
      .populate('serviceIds')
      .sort({ bookedCount: -1 }) // Sort by bookedCount in descending order
      .limit(5); // Limit the result to 10 users

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}



exports.deleteUser = async (req, res) => {
  try {
    const deleteUser = await User.findByIdAndDelete(req.params.id);
    if (!deleteUser) {
      console.log(`User with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete User' });
  }
};

exports.updateUserStatus =async(req, res) =>{
  try {
    const updateStatus =await User.findOneAndUpdate(
      {_id:req.body.userId},
      {status: req.body.status},
      {new:true}
    );
    if (!updateStatus) {
      console.log(`User with ID ${req.body.UserId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User Status Updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to Update Status' });
  }
};



exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP to the user model
    user.otp = otp;
    await user.save();

    // Send OTP to the user's email
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error during OTP generation and sending:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const sendOtpEmail = async (email, otp) => {
  // Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      auth: {
          user: "webienttechenv@gmail.com",
          pass: "ljxugdpijagtxeda",
      },
  });

  // Email content
  const mailOptions = {
    from: 'webienttechenv@gmail.com',  // Replace with your email
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}`
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email, otp });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New Password and Confirm Password mismatch' });
    }

    // Hash the new password and save it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;

    // const userDocRef = doc(firestore, 'users', email);
    // await setDoc(userDocRef, {
    //   password: hashedPassword,
    //   lastPasswordUpdate: serverTimestamp()
    // }, { merge: true });
    user.otp = null; 
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const authenticatedUser = req.user;

  const userId = authenticatedUser._id; // Assuming you have user information in req.user
  const email = authenticatedUser.email;
  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Validate the new password and confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the user document
    user.password = hashedPassword;
    await user.save();
    // const userDocRef = doc(firestore, 'users', email);
    // await setDoc(userDocRef, {
    //   password: hashedPassword,
    //   lastPasswordUpdate: serverTimestamp()
    // }, { merge: true });
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error during password update:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.getUserByService = async (req, res) => {
  try {
    const serviceId = req.params.serviceId;
    const { city, age, name } = req.query;

    const baseQuery = { serviceIds: { $in: [serviceId] } };

    baseQuery.status = 'active';
    baseQuery.role = 'Escort';
    // Adding case-insensitive regex for city if provided
    if (city) {
      baseQuery.city = { $regex: new RegExp(city, 'i') };
    }

    // Adding age to the query if provided
    if (age) {
      baseQuery.age = { $gte: parseInt(age) };
    }

    // Adding case-insensitive regex for name if provided
    if (name) {
      baseQuery.name = { $regex: new RegExp(name, 'i') };
    }

    const users = await User.find(baseQuery).select('-password').populate('serviceIds').exec();
    res.json({users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

