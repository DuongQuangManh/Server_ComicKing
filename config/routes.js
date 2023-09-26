/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  '/': { view: 'pages/homepage' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/
  /*
    ADMIN
  */

  // special list
  'POST /api/admin/addSpecial': 'SpecialListController.add',
  'POST /api/admin/editSpecial': 'SpecialListController.edit',
  'POST /api/admin/find': 'SpecialListController.find',
  'POST /api/admin/detail': 'SpecialListController.detail',

  // user
  'POST /api/admin/addUser': 'UserController.add',
  'POST /api/admin/editUser': 'UserController.edit',
  'POST /api/admin/findUser': 'UserController.find',
  'POST /api/admin/detailUser': 'UserController.detail',

  // otp
  'POST /api/admin/findOtp': 'OtpController.find',
  'POST /api/admin/findOtpVerification': 'OtpController.otpVerificationFind',

  // category
  'POST /api/admin/findCategory': 'CategoryController.adminFind',
  'POST /api/admin/addCategory': 'CategoryController.add',
  'POST /api/admin/editCategory': 'CategoryController.edit',

  // author
  'POST /api/admin/findAuthor': 'AuthorController.find',
  'POST /api/admin/editAuthor': 'AuthorController.edit',
  'POST /api/admin/addAuthor': 'AuthorController.add',
  'POST /api/admin/detailAuthor': 'AuthorController.detail',

  // comic
  'POST /api/admin/findComic': 'ComicController.adminFind',
  'POST /api/admin/addComic': 'ComicController.add',
  'POST /api/admin/editComic': 'ComicController.edit',
  'POST /api/admin/detailComic': 'ComicController.adminDetail',

  // chapter
  'POST /api/admin/findChapter': 'ChapterController.find',
  'POST /api/admin/addChapter': 'ChapterController.add',
  'POST /api/admin/editChapter': 'ChapterController.edit',
  'POST /api/admin/detailChapter': 'ChapterController.adminDetail',

  // pending data
  'POST /api/admin/getAdminPendingData': 'PendingController.getAdminPendingData',


  /**
    MOBIE 
  **/

  // authen
  'POST /api/user/login': 'AuthController.login',
  'POST /api/user/register': 'AuthController.register',
  'POST /api/user/registerVerifyOtp': 'AuthController.registerVerifyOtp',
  'POST /api/user/loginVerifyOtp': 'AuthController.loginVerifyOtp',
  'POST /api/user/loginWithGoogle': 'AuthController.loginWithGoogle',
  'POST /api/user/forgotPassword': 'AuthController.forgotPassword',
  'POST /api/user/forgotPasswordVerifyOtp': 'AuthController.forgotPasswordVerifyOtp',
  'POST /api/user/changePassword': 'AuthController.changePassword',
  'Post /api/user/changePasswordVerifyOtp': 'AuthController.changePasswordVerifyOtp',
  'POST /api/user/resendOtp': 'AuthController.resendOtp',
  'POST /api/user/loginWithFacebook': 'AuthController.loginWithFacebook',
  'POST /api/user/changePassword': 'AuthController.changePassword',
  'POST /api/user/changePasswordVerifyOtp': 'AuthController.changePasswordVerifyOtp',

  // user
  'POST /api/user/getProfile': 'UserController.getProfile',
  'POST /api/user/updateProfile': 'UserController.updateProfile',
  'POST /api/user/toggleLikeChapter': 'UserController.toggleLikeChapter',

  // category
  'POST /api/category/get': 'CategoryController.get',

  // comic
  'POST /api/user/findComic': 'ComicController.clientFind',
  'POST /api/user/detailComic': 'ComicController.clientDetail',
  'POST /api/user/getNewestComics': 'ComicController.getNewestComics',
  'POST /api/user/getProposeComics': 'ComicController.getProposeComics',
  'POST /api/user/getSliderComics': 'ComicController.getSliderComics',
  'POST /api/user/getDoneComics': 'ComicController.getDoneComics',

  // chapter
  'POSt /api/user/detailChapter': 'ChapterController.clientDetail'
};
