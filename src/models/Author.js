
const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Author name is required."],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Author last name is required."],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Author", authorSchema);
