require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const register = require("./routes/auth/register");
const login = require("./routes/auth/login");
const userRoutes = require('./routes/user/user');
const todoRoutes = require('./routes/todos/todo');
const errorHandler = require('./middleware/error');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use("/register", register);
app.use("/login", login);
app.use('/', userRoutes);
app.use('/', todoRoutes);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});