const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");

const check_duplicate_user = async (connection, email) => {
    const [existing_users] = await connection.execute(
        "SELECT * FROM user WHERE email = ?",
        [email]
    );
    return existing_users.length > 0;
};

const hash_password = async (password) => {
    return await bcrypt.hash(password, 10);
};

const insert_user = async (connection, email, name, firstname, hashed_password) => {
    const [result] = await connection.execute(
        "INSERT INTO user (email, name, firstname, password) VALUES (?, ?, ?, ?)",
        [email, name, firstname, hashed_password]
    );
    return result;
};

const generate_token = (user_id, email) => {
    return jwt.sign(
        { id: user_id, email },
        process.env.SECRET
    );
};

router.post("/", async (req, res) => {
    try {
        const { email, name, firstname, password } = req.body;
        const connection = await pool.getConnection();

        const is_duplicate = await check_duplicate_user(connection, email);
        if (is_duplicate) {
            connection.release();
            return res.status(400).json({ msg: "Account already exists" });
        }

        const hashed_password = await hash_password(password);
        const result = await insert_user(connection, email, name, firstname, hashed_password);
        const token = generate_token(result.insertId, email);

        connection.release();
        res.status(201).json({ token });
    } catch (error) {
        console.log(req.body);
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});

module.exports = router;