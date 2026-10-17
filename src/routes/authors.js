
const express = require("express");
const mongoose = require("mongoose");
const Author = require("../models/Author");
const Book = require("../models/Book");

const router = express.Router();

// GET /api/authors
router.get("/", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { firstName: { $regex: escapedSearch, $options: "i" } },
        { lastName: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (req.query.page === undefined) {
      const authors = await Author.find(filter)
        .sort({ lastName: 1, firstName: 1 })
        .lean();

      return res.json(authors);
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [authors, total] = await Promise.all([
      Author.find(filter)
        .sort({ lastName: 1, firstName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Author.countDocuments(filter),
    ]);

    res.json({
      data: authors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Napaka pri pridobivanju avtorjev." });
  }
});

// GET /api/authors/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Neveljaven ID avtorja." });
    }

    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: "Avtor ni najden." });
    }

    res.json(author);
  } catch (error) {
    res.status(500).json({ message: "Napaka pri pridobivanju avtorja." });
  }
});

// POST /api/authors
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim()
    ) {
      return res.status(400).json({
        message: "Ime in priimek sta obvezna.",
      });
    }

    const author = await Author.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    res.status(201).json(author);
  } catch (error) {
    res.status(400).json({ message: "Avtorja ni bilo mogoče ustvariti." });
  }
});

// PUT /api/authors/:id
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Neveljaven ID avtorja." });
    }

    const { firstName, lastName } = req.body;

    if (
      typeof firstName !== "string" ||
      !firstName.trim() ||
      typeof lastName !== "string" ||
      !lastName.trim()
    ) {
      return res.status(400).json({
        message: "Ime in priimek sta obvezna.",
      });
    }

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!author) {
      return res.status(404).json({ message: "Avtor ni najden." });
    }

    res.json(author);
  } catch (error) {
    res.status(400).json({ message: "Avtorja ni bilo mogoče urediti." });
  }
});

// DELETE /api/authors/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Neveljaven ID avtorja." });
    }

    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: "Avtor ni najden." });
    }

    const hasBooks = await Book.exists({ author: author._id });

    if (hasBooks) {
      return res.status(409).json({
        message: "Avtorja ni mogoče izbrisati, ker ima povezane knjige.",
      });
    }

    await author.deleteOne();

    res.json({ message: "Avtor je bil izbrisan." });
  } catch (error) {
    res.status(500).json({ message: "Avtorja ni bilo mogoče izbrisati." });
  }
});

module.exports = router;
