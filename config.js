const mongoose = require('mongoose');
require('dotenv').config(); 

const uri = process.env.MONGO_URI;


if (!uri) {
  console.error("MongoDB connection string is not defined");
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
