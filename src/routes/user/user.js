const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const auth = require('../../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/user', auth, async (req, res, next) => {
    try {
        const [user] = await pool.query('SELECT * FROM user WHERE id = ?', [req.user.id]);
        if (!user.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }
        res.json(user[0]);
    } catch (err) {
        next(err);
    }
});

router.get('/user/todos', auth, async (req, res, next) => {
    try {
        const [todos] = await pool.query('SELECT * FROM todo WHERE user_id = ?', [req.user.id]);
        res.json(todos);
    } catch (err) {
        next(err);
    }
});

router.get('/users/:id', auth, async (req, res, next) => {
    try {
        let query, params;
        const param = req.params.id;
        
        if (param.includes('@') && param.includes('.')) {
            query = 'SELECT * FROM user WHERE email = ?';
            params = [param];
        } 
        else if (!isNaN(param) && !isNaN(parseInt(param))) {
            query = 'SELECT * FROM user WHERE id = ?';
            params = [parseInt(param)];
        } 
        else {
            const [userById] = await pool.query('SELECT * FROM user WHERE id = ?', [param]);
            if (userById.length) {
                return res.json(userById[0]);
            }
            
            const [userByEmail] = await pool.query('SELECT * FROM user WHERE email = ?', [param]);
            if (userByEmail.length) {
                return res.json(userByEmail[0]);
            }
            
            return res.status(404).json({
                msg: 'Not found'
            });
        }

        const [user] = await pool.query(query, params);
        if (!user.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }
        
        res.json(user[0]);
    } catch (err) {
        next(err);
    }
});

router.put('/users/:id', auth, async (req, res, next) => {
    try {
        const {
            email,
            password,
            firstname,
            name
        } = req.body;
        const param = req.params.id;
        let whereClause = 'id = ?';
        let queryParam = param;
        
        if (param.includes('@') && param.includes('.')) {
            whereClause = 'email = ?';
        }
        
        const [existingUser] = await pool.query(`SELECT * FROM user WHERE ${whereClause}`, [queryParam]);
        if (!existingUser.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }
        
        const userId = existingUser[0].id;

        let updateFields = [];
        let queryParams = [];
        
        if (email) {
            updateFields.push('email = ?');
            queryParams.push(email);
        }
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            queryParams.push(hashedPassword);
        }
        
        if (firstname) {
            updateFields.push('firstname = ?');
            queryParams.push(firstname);
        }
        
        if (name) {
            updateFields.push('name = ?');
            queryParams.push(name);
        }
        
        if (updateFields.length > 0) {
            queryParams.push(userId);
            await pool.query(
                `UPDATE user SET ${updateFields.join(', ')} WHERE id = ?`,
                queryParams
            );
        }

        const [user] = await pool.query('SELECT * FROM user WHERE id = ?', [userId]);
        res.json(user[0]);
    } catch (err) {
        next(err);
    }
});

router.delete('/users/:id', auth, async (req, res, next) => {
    try {
        const param = req.params.id;
        let whereClause = 'id = ?';
        let queryParam = param;
        
        if (param.includes('@') && param.includes('.')) {
            whereClause = 'email = ?';
        }
        
        const [existingUser] = await pool.query(`SELECT * FROM user WHERE ${whereClause}`, [queryParam]);
        if (!existingUser.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }
        
        const userId = existingUser[0].id;
        
        await pool.query('DELETE FROM todo WHERE user_id = ?', [userId]);
        
        await pool.query('DELETE FROM user WHERE id = ?', [userId]);
        res.json({
            msg: `Successfully deleted record number: ${userId}`
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;