
require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const booksRouter = require("./routes/books");
const authorsRouter = require("./routes/authors");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Book Library API deluje!" });
});

app.use("/api/books", booksRouter);
app.use("/api/authors", authorsRouter);

async function startServer() {
  await connectDB();

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Strežnik deluje na http://localhost:${port}`);
  });
}

startServer();
