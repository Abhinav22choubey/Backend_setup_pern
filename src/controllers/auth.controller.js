import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/token.js";

import prisma from "../config/prisma.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(201).json({
            message: "Signup successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        // Don't reveal whether email exists
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Verify password
        const isValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Generate tokens using actual user ID
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token in HttpOnly cookie
        res.cookie("refreshToken", refreshToken, cookieOptions);

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};


export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing",
            });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Check that user still exists
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
        });

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(
            user.id
        );

        return res.status(200).json({
            accessToken: newAccessToken,
        });

    } catch (error) {
        console.error("Refresh token error:", error);

        return res.status(401).json({
            message: "Invalid or expired refresh token",
        });
    }
};


export const logout = (req, res) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(200).json({
        message: "Logout successful",
    });
};