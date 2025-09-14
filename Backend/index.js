import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from "./routes/show.route.js"
import bookingRouter from "./routes/booking.route.js"
import adminRouter from "./routes/adminRoutes.js"
import userRouter from "./routes/user.route.js"

dotenv.config({ quiet: true })

connectDB()

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.use('/api/booking', bookingRouter)
app.use('/api/admin', adminRouter)
app.use('/api/user', userRouter)


app.listen(process.env.PORT, () => {
    console.log(`Server listening at port ${PORT}`)
})