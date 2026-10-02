import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "PERN Backend is running 🚀"
    });
});

export default app;