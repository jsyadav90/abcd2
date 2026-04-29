import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Construct the MongoDB URI using environment variables
    const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@abcd2.cajzft8.mongodb.net/${process.env.MONGO_DB_NAME}?appName=ABCD2`;

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host} to database: ${conn.connection.name}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;