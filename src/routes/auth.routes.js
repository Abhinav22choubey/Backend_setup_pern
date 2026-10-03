import express from "express";

import {
    login,
    refreshAccessToken,
    logout,signup
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup",signup);

router.post("/login", login);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

export default router;