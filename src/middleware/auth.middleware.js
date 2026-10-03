import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access token required",
            });
        }

        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        req.userId = decoded.userId;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Access token expired or invalid",
        });
    }
};