const express = require("express");
const Project = require("../models/project");
const auth = require("../middleware/auth");
const Organisation = require("../models/organisation");
const router = new express.Router();

router.post("/projects/:id", auth, async (req, res) => {
  console.log("here", req);
  const _id = req.params.id;
  console.log(_id);
  const project = new Project({
    ...req.body,
    owner: _id,
    owners: [{ role: "admin", follower: req.user._id }],
  });

  try {
    await project.save();
    res.status(201).send(project);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc``
router.get("/projects/:id", auth, async (req, res) => {
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
    const org = await Organisation.findOne({
      _id,
    });

    await org
      .populate({
        path: "projects",
        match: { "owners.follower": req.user._id },
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
        populate: {
          path: "owner owners.follower",
          populate: {
            path: "postedBy owner.follower",
          },
        },
      })
      .execPopulate();

    res.send(org.projects);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
