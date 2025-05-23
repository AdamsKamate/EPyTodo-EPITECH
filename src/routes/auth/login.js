const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const pool = require("../../config/db")

const find_user = async (connection, email) => {
    const [users] = await connection.execute(
        "SELECT * FROM user WHERE email = ?",
        [email]
    );
    return users[0];
};

const verify_password = async (password, hashed_password) => {
    return await bcrypt.compare(password, hashed_password);
};

const generate_token = (user_id, email) => {
    return jwt.sign({
            id: user_id,
            email
        },
        process.env.SECRET
    );
};

router.post("/", async (req, res, next) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                msg: "Bad parameter"
            });
        }

        const connection = await pool.getConnection();

        const user = await find_user(connection, email);
        if (!user) {
            connection.release();
            return res.status(401).json({
                msg: "Invalid Credentials"
            });
        }

        const is_valid = await verify_password(password, user.password);
        if (!is_valid) {
            connection.release();
            return res.status(401).json({
                msg: "Invalid Credentials"
            });
        }

        const token = generate_token(user.id, user.email);
        connection.release();
        res.status(200).json({
            token
        });
    } catch (error) {
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Database connection error:', error.message);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
        
        next(error);
    }
});

module.exports = router;