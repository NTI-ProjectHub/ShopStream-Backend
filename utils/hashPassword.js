const bcrypt = require('bcrypt');

exports.hash = async (password) => {
    try {
        const salt = await bcrypt.genSalt(Number(process.env.BCRYPT_SALT_ROUNDS));
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } 
    catch (error) {
        console.error('Error during password encryption:', error);
        throw new Error('Encryption failed');
    }
}

exports.compare = async (password, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } 
    catch (error) {
        console.error('Error during password comparison:', error);
        throw new Error('Comparison failed');
    }
}
