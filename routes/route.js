const express  = require("express");
const router = express.Router();

const userController = require('../controllers/userController');
const customerController = require('../controllers/customerController');
const advertisementController = require('../controllers/advertisementController');
const serviceController = require('../controllers/serviceController');
const ratingController = require('../controllers/ratingController');
const commissionController = require('../controllers/commissionController');
const bookingController = require('../controllers/bookingController');
const escortDashboardController =require('../controllers/escortDashboardController');
const dashboardController = require('../controllers/dashboardController');




const {auth, isAdmin, isEscort}  = require('../middlewares/Auth');

const {customerAuth} = require('../middlewares/CustomerAuth');
const { imageSingleUpload , imageMultiUpload} = require("../middlewares/multer");
// Home 
router.get("/", (req, res) =>{
    res.send("Welcome to UB Factory Backend");
});
//Admin Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.post("/login-escort", userController.loginEscort);
router.get("/my-profile", auth, userController.getMyProfile);//auth
router.put("/update-user/:id",imageMultiUpload, auth, userController.updateUser);
router.put("/update-my-profile", auth, userController.updateMyProfile);
router.put("/update-my-gallery",imageMultiUpload, auth, userController.updateMyGallery);
router.put("/update-my-services", auth, userController.updateUserServices);
router.put("/update-user-status", auth, isAdmin, userController.updateUserStatus);
router.get("/get-all-users", userController.getUser);
router.get("/get-all-users-for-admin", auth, isAdmin, userController.getUserForAdmin);
router.get("/get-user-by-id/:id",  userController.getUserById);
router.delete("/delete-user/:id", auth, isAdmin, userController.deleteUser);
router.post("/forget-password",  userController.forgotPassword);
router.post("/reset-password",  userController.resetPassword);
router.post("/change-password", auth, userController.updatePassword);
router.get("/get-user-by-service/:serviceId", userController.getUserByService);
router.get("/get-popular", userController.getPopular);


//Customer Route//
router.post("/register-customer", customerController.signup);
router.post("/login-customer", customerController.login);
router.get("/get-my-profile", customerAuth, customerController.getMyProfile);
router.put("/update-cust-profile",imageSingleUpload, customerAuth, customerController.updateMyProfile);
router.get("/get-customer",  auth, isAdmin, customerController.getAllCustomers);
router.get('/get-customer-by-id/:id', auth, isAdmin, customerController.getCustomerById);
router.get("/get-my-favorite",  customerAuth, customerController.getMyFavorite);
router.post("/add-to-favorite",  customerAuth, customerController.addTofavorite);
router.post("/remove-from-favorite",  customerAuth, customerController.removeFromFavorite);
router.put('/update-customer/:id', imageSingleUpload,auth, isAdmin, customerController.updateCustomer);
router.put('/update-recent-view/:id', customerAuth, customerController.updateRecentlyViewedEscorts);
router.get('/get-recent-view', customerAuth, customerController.getMyRecentView);
router.post("/forget-customer-password",  customerController.forgotCustomerPassword);
router.post("/reset-customer-password",  customerController.resetCustomerPassword);
router.post("/change-customer-password", customerAuth, customerController.updateCustomerPassword);
router.delete("/delete-customer/:id",  auth, isAdmin, customerController.deleteCustomer);

//Booking Routes//
router.post("/book-escort", customerAuth,bookingController.bookEscort);
router.get("/get-all-booking", auth, isAdmin, bookingController.getAllBooking);
router.get("/get-booking-by-id/:id",  bookingController.getBookingById);
router.get("/get-booking-by-escort", auth, isEscort, bookingController.getEscortBooking);
router.get("/get-booking-by-customer", customerAuth, bookingController.getBookingByCustomer);
router.put("/update-booking-status/:id", auth, isEscort, bookingController.updateBookingStatus);



//Advertisement  Route//
router.post("/create-advertisement",imageSingleUpload, auth, isAdmin,advertisementController.createAdvertisement);
router.put("/update-advertisement/:id",imageSingleUpload, auth, isAdmin, advertisementController.updateAdvertisement);
router.put("/update-advertisement-status/:id", auth, isAdmin, advertisementController.changeStatus);
router.get("/get-advertisement",  advertisementController.getAllAdvertisement);
router.get("/get-advertisement-for-admin", auth, isAdmin,  advertisementController.getAllAdvertisementForAdmin);
router.get("/get-advertisement-by-id/:id",  advertisementController.getAdvertisementById);
router.delete('/delete-advertisement/:id', auth, isAdmin, advertisementController.deleteAdvertisement);


//Service Route//
router.post("/create-service", imageSingleUpload, auth, isAdmin, serviceController.createService);
router.put('/update-service/:id', imageSingleUpload, auth,isAdmin, serviceController.updateService);
router.get("/get-service",  serviceController.getAllService);
router.get('/get-service-by-id/:id', serviceController.getServiceById);
router.delete('/delete-service/:id', auth, isAdmin, serviceController.deleteService);

//Rating Route//
router.post("/create-rating", customerAuth, ratingController.creatRating);
router.put('/update-rating/:id', customerAuth,  ratingController.updateRating);
router.get("/get-rating/:id",  ratingController.getEscortRating);

//Commission Route//
router.post("/set-commission", auth, isAdmin, commissionController.setCommission);
router.get('/get-all-commission', auth, isAdmin, commissionController.getAllCommission);
router.get("/get-commission-by-escort/:id", auth, isAdmin,  commissionController.getCommissionByEscort);

//Escort Dashboard Route//
router.get("/get-today-booking-for-escort", auth, escortDashboardController.getTotalBookingsTodayForUser);
router.get("/get-this-week-booking-for-escort", auth, escortDashboardController.getTotalBookingsThisWeekForUser);
router.get("/get-this-month-booking-for-escort", auth, escortDashboardController.getTotalBookingsThisMonthForUser);
router.get("/dashboard", auth, escortDashboardController.getTotalBookingsForUser);

//Dashboard Route//
router.get("/get-dashboard-data", auth, isAdmin,dashboardController.dashBoardData );
router.get("/get-month-wise-booking", auth, isAdmin,dashboardController.getMonthlyBookingCounts );

module.exports = router;