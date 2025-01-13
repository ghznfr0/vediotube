import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
        const db = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`MongoDB connected Successfully with ${db.connection.host}`);
}

export {connectDB}