const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB povezava je uspešna.");
    console.log("Baza:", mongoose.connection.name);
  } catch (error) {
    console.error("Napaka pri povezavi z MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
