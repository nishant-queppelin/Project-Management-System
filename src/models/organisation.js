const mongoose = require("mongoose");

const organisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    owner: [
      {
        role: String,
        follower: {
          type: mongoose.Schema.Types.ObjectId,
          //   required: true,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

organisationSchema.virtual("projects", {
  ref: "Project",
  localField: "_id",
  foreignField: "owner",
});

const Organisation = mongoose.model("Organisation", organisationSchema);

module.exports = Organisation;
