import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./src/config/db.js";

dotenv.config();

async function fix() {
    try {
        await connectDB();
        console.log("Connected.");
        const result = await mongoose.connection.collection("applications").dropIndex("jobId_1_studentId_1");
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        process.exit(0);
    }
}
fix();
