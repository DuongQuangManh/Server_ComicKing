export const LOGIN_VERIFY_OTP_MAIL_TEMPLATE = {
    subject: 'Xác minh đăng nhập tài khoản ComicBook.',
    html: "User thân mến ,"
        + "<p>Mã xác nhận: <b><%= otp %></b>."
        + "Sử dụng mã này để đăng nhập vào tài khoản ComicBook."
        + "</p><p>Bảo mật, vui lòng không chia sẻ mã này vơi bất kỳ ai."
        + "Nếu bạn không tạo yêu cầu này, hãy bỏ qua nó."
        + "</p><p>Trân trọng,</p>ComicBook"
}

export const REGISTER_VERIFY_OTP_MAIL_TEMPLATE = {
    subject: 'Xác minh đăng kí tài khoản ComicBook.',
    html: "User thân mến ,"
        + "<p>Mã xác nhận: <b><%= otp %></b>."
        + "Sử dụng mã này để đăng kí tài khoản ComicBook."
        + "</p><p>Bảo mật, vui lòng không chia sẻ mã này vơi bất kỳ ai."
        + "Nếu bạn không gửi yêu cầu này, hãy bỏ qua nó."
        + "</p><p>Trân trọng,</p>ComicBook"
}