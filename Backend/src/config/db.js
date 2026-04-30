import mongoose from "mongoose";
import dns from "dns";

const connectDB = async () => {
  try {
    // Ensure Node uses reliable public DNS servers for SRV lookups
    // (fixes `querySrv ECONNREFUSED` in some environments)
    dns.setServers(["8.8.8.8", "1.1.1.1"]);

    // Allow an explicit MONGO_URI in .env (useful to avoid SRV DNS lookups)
    // If not provided, fall back to constructing the mongodb+srv URI
    const mongoURI = process.env.MONGO_URI || `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@abcd2.cajzft8.mongodb.net/${process.env.MONGO_DB_NAME}?appName=ABCD2`;

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host} to database: ${conn.connection.name}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;