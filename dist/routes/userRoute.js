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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../lib/auth"));
const validateUser_1 = require("../zod/validateUser");
const router = express_1.default.Router();
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userValidate = validateUser_1.validateUser.safeParse(req.body);
        if (!userValidate.success) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const { name, mobile } = req.body;
        let user = yield auth_1.default.user.findUnique({
            where: {
                mobile
            }
        });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const otp = generateOtp();
        yield auth_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            user = yield tx.user.create({
                data: {
                    username: name,
                    mobile,
                    otp
                }
            });
            yield tx.wallet.create({
                data: {
                    userId: user.userId
                }
            });
        }));
        fetch(`https://test.troposcore.com/twilio`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mobile,
                otp
            })
        });
        return res.status(200).json({ message: 'OTP generated. Please verify.' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
}));
router.post('/update/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const userValidate = validateUser_1.validateUser.safeParse(req.body);
        if (!userValidate.success) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const { mobile, username } = req.body;
        let user = yield auth_1.default.user.findUnique({
            where: {
                userId
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const previousName = user.username;
        const previousMobile = user.mobile;
        user = yield auth_1.default.user.findUnique({
            where: {
                mobile
            }
        });
        if (user) {
            return res.status(400).json({ message: 'Mobile number already registered' });
        }
        user = yield auth_1.default.user.update({
            where: {
                userId
            },
            data: {
                mobile: mobile || previousMobile,
                username: username || previousName
            }
        });
        return res.status(200).json({ message: 'User updated successfully', user });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mobile } = req.body;
        let user = yield auth_1.default.user.findUnique({
            where: {
                mobile
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'Mobile number not registered' });
        }
        const otp = generateOtp();
        user = yield auth_1.default.user.update({
            where: {
                mobile
            },
            data: {
                otp
            }
        });
        fetch(`https://test.troposcore.com/twilio`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mobile,
                otp
            })
        });
        return res.status(200).json({ message: "OTP sent" });
    }
    catch (error) {
        return res.status(500).json({ message: 'Some error occured', error });
    }
}));
router.post('/verifyotp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otp, mobile } = req.body;
        const user = yield auth_1.default.user.findUnique({
            where: {
                mobile
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        if (otp !== user.otp) {
            return res.status(400).json({ message: 'Incorrect OTP' });
        }
        const token = jsonwebtoken_1.default.sign({ mobile: user.mobile, userId: user.userId, username: user.username }, process.env.JWT_SECRET || "secret");
        return res.status(200).json({ token, message: 'Login successful' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
}));
router.post('/delete/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = yield req.params.id;
        yield auth_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield tx.user.findUnique({
                where: {
                    userId
                }
            });
            if (!user) {
                return res.status(400).json({ message: 'User not found' });
            }
            yield tx.wallet.deleteMany({
                where: {
                    userId
                }
            });
            return res.status(200).json({ message: 'User deleted successfully' });
        }));
        return res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.get('/fetchuser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).send('Unauthorized token'); // Unauthorized
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret", (err, user) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                return res.status(403).send('Forbidden error'); // Forbidden
            }
            const { mobile } = user;
            const person = yield auth_1.default.user.findUnique({
                where: {
                    mobile
                }
            });
            if (!person) {
                return res.status(400).json({ message: 'User not found' });
            }
            return res.status(200).json({ user: person });
        }));
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.put('/resendotp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mobile } = req.body;
        const user = yield auth_1.default.user.findUnique({
            where: {
                mobile
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const otp = generateOtp();
        yield auth_1.default.user.update({
            where: {
                mobile
            },
            data: {
                otp
            }
        });
        fetch(`https://test.troposcore.com/twilio`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                mobile,
                otp
            })
        });
        return res.status(200).json({ message: 'OTP updated' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.get('/fetchalluser', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield auth_1.default.user.findMany({
            select: {
                userId: true,
                username: true,
                mobile: true,
                wallet: {
                    select: {
                        totalBalance: true
                    },
                    take: 1
                }
            }
        });
        return res.status(200).json({ users });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.default = router;
