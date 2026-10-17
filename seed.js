
require("dotenv").config();

const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

const Author = require("./src/models/Author");
const Book = require("./src/models/Book");

const AUTHOR_COUNT = 2000;
const BOOK_COUNT = 10000;
const BATCH_SIZE = 500;

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Povezava z MongoDB je uspešna.");

    //ponovljiv nabor testnih podatkov
    faker.seed(20261017);

    //avtorji
    const authors = [];

    for (let i = 0; i < AUTHOR_COUNT; i++) {
      authors.push({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      });
    }

    //kombinacija imena in priimka kot ključ (da ni podvajanja)
    for (let i = 0; i < authors.length; i += BATCH_SIZE) {
      const batch = authors.slice(i, i + BATCH_SIZE);

      await Author.bulkWrite(
        batch.map((author) => ({
          updateOne: {
            filter: {
              firstName: author.firstName,
              lastName: author.lastName,
            },
            update: {
              $set: author,
            },
            upsert: true,
          },
        }))
      );
    }

    //berem vse avtorje iz baze, da jih povežem s knjigami
    const savedAuthors = await Author.find(
      {},
      { _id: 1 }
    ).lean();

    if (savedAuthors.length === 0) {
      throw new Error("V bazi ni najdenih avtorjev.");
    }

    console.log(`Na voljo je ${savedAuthors.length} avtorjev.`);

    //generiranje knjig
    const bookOperations = [];

    for (let i = 0; i < BOOK_COUNT; i++) {
      const author =
        savedAuthors[i % savedAuthors.length];

      const title = faker.book.title();

      bookOperations.push({
        updateOne: {
          filter: {
            title,
            author: author._id,
          },
          update: {
            $set: {
              title,
              author: author._id,
            },
          },
          upsert: true,
        },
      });

      if (bookOperations.length === BATCH_SIZE) {
        await Book.bulkWrite(bookOperations);
        bookOperations.length = 0;

        console.log(`Obdelanih knjig: ${i + 1}`);
      }
    }

    if (bookOperations.length > 0) {
      await Book.bulkWrite(bookOperations);
    }

    const totalAuthors = await Author.countDocuments();
    const totalBooks = await Book.countDocuments();

    console.log("\nGeneriranje je zaključeno.");
    console.log(`Skupno avtorjev v bazi: ${totalAuthors}`);
    console.log(`Skupno knjig v bazi: ${totalBooks}`);
  } catch (error) {
    console.error("Napaka pri generiranju:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
