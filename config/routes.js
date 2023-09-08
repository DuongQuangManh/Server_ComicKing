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

  // auth
  'POST /api/user/login': 'AuthController.login',
  'POST /api/user/register': 'AuthController.register',
  'POST /api/user/registerVerifyOtp': 'AuthController.registerVerifyOtp',
  'POST /api/user/loginVerifyOtp': 'AuthController.loginVerifyOtp',
  'POST /api/upload': 'ComicController.upload',
  'POST /api/user/loginWithGoogle': 'AuthController.loginWithGoogle',
  'POST /api/user/forgotPassword': 'AuthController.forgotPassword',
  'POST /api/user/forgotPasswordVerifyOtp': 'AuthController.forgotPasswordVerifyOtp',
  'POST /api/user/changePassword': 'AuthController.changePassword',
  'Post /api/user/changePasswordVerifyOtp': 'AuthController.changePasswordVerifyOtp',
  'POST /api/user/resendOtp': 'AuthController.resendOtp',
  'POST /api/user/loginWithFacebook': 'AuthController.loginWithFacebook',
  'POST /api/user/changePassword': 'AuthController.changePassword',
  'POST /api/user/changePasswordVerifyOtp': 'AuthController.changePasswordVerifyOtp',

  //category
  'POST /api/category/findAll': 'CategoryController.findAll',
  'POST /api/category/find': 'CategoryController.find',
  'POST /api/category/add': 'CategoryController.add',
  'POST /api/category/edit': 'CategoryController.edit',

  //author
  'POST /api/author/find': 'AuthorController.find',
  'POST /api/author/edit': 'AuthorController.edit',
  'POST /api/author/add': 'AuthorController.add',
  'POST /api/author/detail': 'AuthorController.detail',

  //comic

  //chapter
};
