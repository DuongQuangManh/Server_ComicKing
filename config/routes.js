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
  'POST /api/admin/detailCategory': 'CategoryController.detail',

  // author
  'POST /api/admin/findAuthor': 'AuthorController.adminFind',
  'POST /api/admin/editAuthor': 'AuthorController.edit',
  'POST /api/admin/addAuthor': 'AuthorController.add',
  'POST /api/admin/detailAuthor': 'AuthorController.adminDetail',

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
  'POST /api/admin/getComicPendingData': 'PendingController.getComicPendingData',
  'POST /api/admin/getCategoriesPending': 'PendingController.getCategories',
  'POST /api/admin/getAuthorsPending': 'PendingController.getAuthors',

  // decorate
  'POST /api/admin/addDecorate': 'DecorateController.add',
  'POST /api/admin/findDecorate': 'DecorateController.adminFind',
  'POST /api/admin/editDecorate': 'DecorateController.edit',
  'POST /api/admin/detailDecorate': 'DecorateController.adminDetail',

  //vip
  'POST /api/admin/addVip': 'VipController.add',
  'POST /api/admin/editVip': 'VipController.edit',
  'POST /api/admin/detailVip': 'VipController.adminDetail',
  'POST /api/admin/findVip': 'VipController.adminFind',

  //level
  'POST /api/admin/addLevel': 'LevelController.add',
  'POST /api/admin/editLevel': 'LevelController.edit',
  'POST /api/admin/detailLevel': 'LevelController.adminDetail',
  'POST /api/admin/findLevel': 'LevelController.adminFind',

  // comment
  'POST /api/admin/detailComment': 'CommentController.adminDetail',
  'POST /api/admin/findComment': 'CommentController.adminFind',
  'POST /api/admin/editComment': 'CommentController.edit',

  // attendance
  'POST /api/admin/detailAttendance': 'AttendanceController.adminDetail',
  'POST /api/admin/findAttendance': 'AttendanceController.adminFind',
  'POST /api/admin/editAttendance': 'AttendanceController.edit',
  'POST /api/admin/addAttendance': 'AttendanceController.add',

  /**
    CLIENT 
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
  'POST /api/user/getHistoryReading': 'UserController.getHistoryReading',
  'POST /api/user/toggleLikeChapter': 'UserController.toggleLikeChapter',
  'POST /api/user/getComicFollowing': 'UserController.getComicFollowing',
  'POST /api/user/toggleFollowComic': 'UserController.toggleFollowComic',
  'POST /api/user/getAuthorFollowing': 'UserController.getAuthorFollowing',
  'POST /api/user/toggleFollowAuthor': 'UserController.toggleFollowAuthor',
  'POST /api/user/getUserInfo': 'UserController.getUserInfo',
  'POST /api/user/changeAvatarFrame': 'UserController.changeAvatarFrame',
  'POST /api/user/changeAvatarTitle': 'UserController.changeAvatarTitle',
  'POST /api/user/sendCommentInChapter': 'UserController.sendCommentInChapter',
  'POST /api/user/sendCommentInComic': 'UserController.sendCommentInComic',
  'POST /api/user/sendCommentInComment': 'UserController.sendCommentInComment',
  'POST /api/user/toggleLikeComment': 'UserController.toggleLikeComment',
  'POST /api/user/getListCommented': 'UserController.getListCommented',
  'POST /api/user/findCategory': 'CategoryController.clientFind',
  'POST /api/user/dailyAttendance': 'UserAttendanceController.dailyAttendance',

  // category
  'POST /api/user/category/getListComic': 'CategoryController.getListComic',

  // comic
  'POST /api/user/findComic': 'ComicController.clientFind',
  'POST /api/user/detailComic': 'ComicController.clientDetail',
  'POST /api/user/comic/getListComment': 'ComicController.getListComment',

  // home client
  'POST /api/user/getNewestComics': 'ClientHomeController.getNewestComics',
  'POST /api/user/getProposeComics': 'ClientHomeController.getProposeComics',
  'POST /api/user/getSliderComics': 'ClientHomeController.getSliderComics',
  'POST /api/user/getDoneComics': 'ClientHomeController.getDoneComics',
  'POST /api/user/getHotComic': 'ClientHomeController.getHotComic',

  // chapter
  'POSt /api/user/detailChapter': 'ChapterController.clientDetail',
  'POST /api/user/chapter/getListComment': 'ChapterController.getListComment',

  // author
  'POST /api/user/findAuthor': 'AuthorController.clientFind',
  'POST /api/user/detailAuthor': 'AuthorController.clientDetail',

  // decorate
  'POST /api/user/findDecorate': 'DecorateController.clientFind',

  // vip
  'POST /api/user/findVip': 'VipController.clientFind',

  // level
  'POST /api/user/findLevel': 'LevelController.clientFind',

  // comment
  'POST /api/user/findComment': 'CommentController.clientFind',
  'POST /api/user/detailComment': 'CommentController.clientDetail',
  'POST /api/user/comment/getListComment': 'CommentController.getListComment',

  //rank
  'POST /api/user/getRankUserLevel': 'RankController.getRankUserLevel',
  'POST /api/user/getRankHotComic': 'RankController.getRankHotComic',
  'POST /api/user/getRankNewComic': 'RankController.getRankNewComic',
  'POST /api/user/getRankDoneComic': 'RankController.getRankDoneComic',
  'POST /api/user/getRankUserPurchase': 'RankController.getRankUserPurchase',

  // attendance
  'POST /api/user/findAttendance': 'AttendanceController.clientFind'
};
