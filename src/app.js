const express = require("express");
const cors = require("cors");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const projectRouter = require("./routers/project");
const organisationRouter = require("./routers/organisation");

const app = express();
app.use(cors());
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);
app.use(organisationRouter);
app.use(projectRouter);

module.exports = app;
