import { app } from "./app.js";
import { connectDB } from "./db/dbConnection.js";
import dotenv from 'dotenv'

dotenv.config({path: './.env'})
connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log('MONGODB connection failed !!!', err.message);
    process.exit(1)
})

