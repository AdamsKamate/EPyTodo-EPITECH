const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const auth = require('../../middleware/auth');

router.get('/todos', auth, async (req, res, next) => {
    try {
        const [todos] = await pool.query('SELECT * FROM todo');
        return res.status(200).json(todos);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/todos/:id', auth, async (req, res, next) => {
    try {
        const todoId = parseInt(req.params.id);

        if (isNaN(todoId)) {
            return res.status(400).json({
                msg: 'Bad parameter'
            });
        }

        const [todo] = await pool.query('SELECT * FROM todo WHERE id = ?', [todoId]);
        if (!todo.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }
        return res.status(200).json(todo[0]);
    } catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/todos', auth, async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            title,
            description,
            due_time,
            user_id,
            status
        } = req.body;

        if (!title || !description || !due_time) {
            return res.status(400).json({
                msg: 'Bad parameter'
            });
        }

        const todoStatus = status || 'not started';
        const todoUserId = user_id || req.user.id;

        const validStatuses = ['not started', 'todo', 'in progress', 'done'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                msg: 'Bad parameter'
            });
        }

        if (user_id) {
            const [userExists] = await connection.query('SELECT id FROM user WHERE id = ?', [user_id]);
            if (!userExists.length) {
                return res.status(400).json({
                    msg: 'Bad parameter'
                });
            }
        }
        try {
            new Date(due_time);
        } catch (e) {
            return res.status(400).json({
                msg: 'Bad parameter'
            });
        }

        const [result] = await connection.query(
            'INSERT INTO todo (title, description, due_time, user_id, status) VALUES (?, ?, ?, ?, ?)',
            [title, description, due_time, todoUserId, todoStatus]
        );

        const [todo] = await connection.query('SELECT * FROM todo WHERE id = ?', [result.insertId]);

        await connection.commit();
        return res.status(201).json(todo[0]);
    } catch (err) {
        await connection.rollback();
        console.error(err);
        next(err);
    } finally {
        connection.release();
    }
});

router.put('/todos/:id', auth, async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const todoId = parseInt(req.params.id);

        if (isNaN(todoId)) {
            return res.status(400).json({
                msg: 'Bad parameter'
            });
        }

        const [existingTodo] = await connection.query('SELECT * FROM todo WHERE id = ?', [todoId]);
        if (!existingTodo.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }

        const todo = existingTodo[0];
        const {
            title,
            description,
            due_time,
            user_id,
            status
        } = req.body;

        if (user_id) {
            const [userExists] = await connection.query('SELECT id FROM user WHERE id = ?', [user_id]);
            if (!userExists.length) {
                return res.status(400).json({
                    msg: 'Bad parameter'
                });
            }
        }

        if (status) {
            const validStatuses = ['not started', 'todo', 'in progress', 'done'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    msg: 'Bad parameter'
                });
            }
        }

        if (due_time) {
            try {
                new Date(due_time);
            } catch (e) {
                return res.status(400).json({
                    msg: 'Bad parameter'
                });
            }
        }

        const updatedTitle = title !== undefined ? title : todo.title;
        const updatedDescription = description !== undefined ? description : todo.description;
        const updatedDueTime = due_time !== undefined ? due_time : todo.due_time;
        const updatedUserId = user_id !== undefined ? user_id : todo.user_id;
        const updatedStatus = status !== undefined ? status : todo.status;

        await connection.query(
            'UPDATE todo SET title = ?, description = ?, due_time = ?, user_id = ?, status = ? WHERE id = ?',
            [updatedTitle, updatedDescription, updatedDueTime, updatedUserId, updatedStatus, todoId]
        );

        const [updatedTodo] = await connection.query('SELECT * FROM todo WHERE id = ?', [todoId]);

        await connection.commit();
        return res.status(200).json(updatedTodo[0]);
    } catch (err) {
        await connection.rollback();
        console.error(err);
        next(err);
    } finally {
        connection.release();
    }
});

router.delete('/todos/:id', auth, async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const todoId = parseInt(req.params.id);

        if (isNaN(todoId)) {
            return res.status(400).json({
                msg: 'Bad parameter'
            });
        }

        const [existingTodo] = await connection.query('SELECT * FROM todo WHERE id = ?', [todoId]);
        if (!existingTodo.length) {
            return res.status(404).json({
                msg: 'Not found'
            });
        }

        await connection.query('DELETE FROM todo WHERE id = ?', [todoId]);

        await connection.commit();
        return res.status(200).json({
            msg: `Successfully deleted record number: ${todoId}`
        });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        next(err);
    } finally {
        connection.release();
    }
});

module.exports = router;