const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const { OAuth2Client } = require("google-auth-library");
const auth = require("../middleware/auth");
// const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");
const { $conditionalHandlers } = require("mongoose/lib/schema/boolean");
const router = new express.Router();

const client = new OAuth2Client(
  "87219646630-f4a7pn7t8uraj06t2fhh4dh1o7r5sjo9.apps.googleusercontent.com"
);

router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    console.log(token);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});
router.post("/users/googlelogin", async (req, res) => {
  const { tokenId } = req.body;
  console.log(tokenId);
  await client
    .verifyIdToken({
      idToken: tokenId,
      audience:
        "87219646630-f4a7pn7t8uraj06t2fhh4dh1o7r5sjo9.apps.googleusercontent.com",
    })
    .then((response) => {
      const { email_verified, name, email, at_hash } = response.payload;
      if (email_verified) {
        User.findOne({ email }).exec((err, user) => {
          if (err) {
            return res.status(400).json({
              error: "something went wrong....",
            });
          } else {
            if (user) {
              googleLogin(user, res);
            } else {
              const googleUser = new User({
                name: name,
                email: email,
                password: at_hash + "queppelin",
              });
              googleCreateUser(googleUser, res);
            }
          }
        });
      }
    });
});

const googleLogin = async (user, res) => {
  try {
    const token = await user.generateAuthToken();
    return res.send({ user, token });
  } catch (e) {
    return res.status(400).send();
  }
};
const googleCreateUser = async (googleUser, res) => {
  try {
    await googleUser.save();
    const token = await googleUser.generateAuthToken();
    console.log(token);
    return res.status(201).send({ googleUser, token });
  } catch (e) {
    return res.status(400).send(e);
  }
};

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    // sendCancelationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    console.log(req.file);
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

module.exports = router;
