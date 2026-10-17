
const express = require("express");
const mongoose = require("mongoose");
const Book = require("../models/Book");
const Author = require("../models/Author");

const router = express.Router();

// GET /api/books?page=1&limit=20&search=klancu
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = {};

    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.title = {
        $regex: req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate("author", "firstName lastName")
        .sort({ title: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Book.countDocuments(filter),
    ]);

    res.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Napaka pri pridobivanju knjig." });
  }
});

// GET /api/books/:id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Neveljaven ID knjige." });
    }

    const book = await Book.findById(req.params.id)
      .populate("author", "firstName lastName");

    if (!book) {
      return res.status(404).json({ message: "Knjiga ni najdena." });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Napaka pri pridobivanju knjige." });
  }
});

// POST /api/books
router.post("/", async (req, res) => {
  try {
    const { title, author } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Naslov je obvezen." });
    }

    if (!mongoose.isValidObjectId(author)) {
      return res.status(400).json({ message: "Izberi veljavnega avtorja." });
    }

    const authorExists = await Author.exists({ _id: author });

    if (!authorExists) {
      return res.status(400).json({ message: "Izbrani avtor ne obstaja." });
    }

    const book = await Book.create({
      title: title.trim(),
      author,
    });

    const result = await book.populate("author", "firstName lastName");

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: "Knjige ni bilo mogoče ustvariti." });
  }
});

// PUT /api/books/:id
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Neveljaven ID knjige." });
    }

    const { title, author } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Naslov je obvezen." });
    }

    if (!mongoose.isValidObjectId(author)) {
      return res.status(400).json({ message: "Izberi veljavnega avtorja." });
    }

    const authorExists = await Author.exists({ _id: author });

    if (!authorExists) {
      return res.status(400).json({ message: "Izbrani avtor ne obstaja." });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title: title.trim(), author },
      { new: true, runValidators: true }
    ).populate("author", "firstName lastName");

    if (!book) {
      return res.status(404).json({ message: "Knjiga ni najdena." });
    }

    res.json(book);
  } catch (error) {
    res.status(400).json({ message: "Knjige ni bilo mogoče urediti." });
  }
});

// DELETE /api/books/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Neveljaven ID knjige." });
    }

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Knjiga ni najdena." });
    }

    res.json({ message: "Knjiga je bila izbrisana." });
  } catch (error) {
    res.status(500).json({ message: "Knjige ni bilo mogoče izbrisati." });
  }
});

module.exports = router;
