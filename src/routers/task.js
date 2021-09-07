const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const Project = require("../models/project");
const router = new express.Router();

router.post("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const task = new Task({
    ...req.body,
    owner: _id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    const proj = await Project.findOne({
      _id,
    });
    console.log(proj);
    await proj
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
        populate: {
          path: "owner",
        },
      })
      .execPopulate();

    res.send(proj.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:project_id/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const project_id = req.params.project_id;

  try {
    const proj = await Project.findOne({
      _id: project_id,
    });

    proj.owners = proj.owners.filter((own) => {
      return own.follower.equals(req.user._id);
    });

    console.log(proj);
    const task = await Task.findOne({ _id, owner: project_id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    v;
    const task = await Task.findOne({
      _id: req.params.id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
    });

    if (!task) {
      res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
