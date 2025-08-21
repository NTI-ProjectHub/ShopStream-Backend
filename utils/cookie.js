exports.setCookie = (res, name, value , maxAge) => {
    res.cookie(name, value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        maxAge
    });
}

exports.clearCookie = (res, name) => {
    res.clearCookie(name);
}
