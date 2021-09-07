const express = require("express");
const Organisation = require("../models/organisation");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/orgs", auth, async (req, res) => {
  console.log(req);
  const organisation = new Organisation({
    ...req.body,
    postedBy: req.user._id,
    owner: [{ role: "admin", follower: req.user._id }],
  });

  try {
    await organisation.save();
    res.status(201).send(organisation);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/orgs", auth, async (req, res) => {
  //   console.log("here", req.user.populate);
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
    // const organisation = await Organisation.find({});

    Organisation.find({ "owner.follower": req.user._id })
      .populate("postedBy")
      .populate("owner.follower")
      .exec(function (error, posts) {
        res.status(200).send(JSON.stringify(posts, null, "\t"));
      });
  } catch (e) {
    res.status(500).send();
  }
});
module.exports = router;
