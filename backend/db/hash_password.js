const bcrypt = require('bcrypt');

const password = 'Test@123';

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Password: Test@123');
    console.log('Hashed password:', hash);
    console.log('\nUse this hash in the SQL file');
});
