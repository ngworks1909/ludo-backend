"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const argon2_1 = __importDefault(require("argon2"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../lib/auth"));
const validateAdmin_1 = require("../zod/validateAdmin");
const router = express_1.default.Router();
// @route   POST /api/admin/create
// @desc    Create a new admin
// @access  Private/Admin
router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, role } = req.body;
    try {
        const adminValidate = validateAdmin_1.validateAdmin.safeParse(req.body);
        if (!adminValidate.success) {
            return res.status(400).json({ message: "Invalid details" });
        }
        const hash = yield argon2_1.default.hash(password);
        const admin = yield auth_1.default.admin.create({
            data: {
                name, email, password: hash, role: role || "admin"
            }
        });
        return res.status(200).json({ message: "Admin created successfully", admin });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}));
// @route   POST /api/admin/login
// @desc    Login admin and return token
// @access  Public
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const admin = yield auth_1.default.admin.findUnique({
            where: {
                email
            }
        });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        const isMatch = yield argon2_1.default.verify(admin.password, password);
        if (!isMatch) {
            return res.status(400).json({ message: "Inavlid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.adminId, role: admin.role }, process.env.JWT_SECRET || "secret", { expiresIn: "1h" } // Token expires in 1 hour
        );
        return res.status(200).json({
            token, // Return token to the client
            admin: {
                name: admin.name,
                email: admin.email,
                password: admin.password,
                role: admin.role
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}));
// @route   GET /api/admin/admins
// @desc    Get all admins
// @access  Private/Admin
router.get("/admins", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admins = yield auth_1.default.admin.findMany({});
        res.status(200).json(admins);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
// @route   GET /api/admin/admin/:id
// @desc    Get an admin by ID
// @access  Private/Admin
router.get("/admin/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.params.id;
        const admin = yield auth_1.default.admin.findUnique({
            where: {
                adminId,
            },
        });
        if (!admin) {
            return res.status(400).json({ message: "Admin not found" });
        }
        return res.status(200).json({ admin });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}));
// @route   PUT /api/admin/edit/:id
// @desc    Edit an admin by ID
// @access  Private/Admin
router.put("/edit/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.params.id;
        let admin = yield auth_1.default.admin.findUnique({
            where: {
                adminId,
            },
        });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const adminValidate = validateAdmin_1.validateAdmin.safeParse(req.body);
        if (!adminValidate.success) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const { name, email, password, role } = req.body;
        admin = yield auth_1.default.admin.update({
            where: {
                adminId,
            },
            data: {
                name: name || admin.name,
                email: email || admin.email,
                password: password || admin.password,
                role: role || admin.role,
            },
        });
        return res.status(200).json({ message: "Admin updated successfully", admin });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}));
// @route   DELETE /api/admin/admin/:id
// @desc    Delete an admin by ID
// @access  Private/Admin
router.delete("/admin/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminId = req.params.id;
        const admin = yield auth_1.default.admin.delete({
            where: {
                adminId
            }
        });
        if (!admin) {
            return res.status(400).json({ message: "Admin not found" });
        }
        return res.status(200).json({ message: 'Admin deleted successfully', admin });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.default = router;
