"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']; // Assuming Bearer token format
    if (!token) {
        return res.status(401).send('Unauthorized token'); // Unauthorized
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
        if (err) {
            return res.status(403).send('Forbidden error'); // Forbidden
        }
        req.user = user; // Save user information for use in the next middleware
        next(); // Proceed to the next middleware
    });
}
