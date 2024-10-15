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
const verifyAdmin_1 = require("../middlewares/verifyAdmin");
const auth_1 = __importDefault(require("../lib/auth"));
const verifyUser_1 = require("../middlewares/verifyUser");
const router = express_1.default.Router();
router.post('/getallwallets', verifyAdmin_1.verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wallets = yield auth_1.default.wallet.findMany({});
        return res.status(200).json({ wallets });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.post('/getwallet', verifyUser_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mobile } = req.body;
        const wallet = yield auth_1.default.wallet.findFirst({
            where: {
                user: {
                    mobile
                }
            }
        });
        if (!wallet) {
            return res.status(400).json({ message: 'Wallet not found' });
        }
        return res.status(200).json({ wallet });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
