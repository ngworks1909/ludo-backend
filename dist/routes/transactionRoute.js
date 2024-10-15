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
const razorpay_1 = __importDefault(require("razorpay"));
const zod_1 = __importDefault(require("zod"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const razorpayInstance = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY || 'your_key_id',
    key_secret: process.env.RAZORPAY_SECRET || 'your_key_secret',
});
router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).send('Unauthorized token'); // Unauthorized
        }
        const data = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
        const { userId } = data;
        const user = yield auth_1.default.user.findUnique({
            where: {
                userId
            }
        });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        const validateAmount = zod_1.default.number().safeParse(amount);
        if (!validateAmount) {
            return res.status(400).json({ message: 'Invalid type' });
        }
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: 'receipt_order_123',
            payment_capture: 1, // Auto-capture
        };
        const order = yield razorpayInstance.orders.create(options);
        // Store the transaction in the database
        const transaction = yield auth_1.default.transactions.create({
            data: {
                orderId: order.id,
                userId,
                amount: Number(order.amount),
                currency: order.currency
            },
        });
        return res.status(200).json({ message: 'Payment sent', order, transaction });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.post('/update', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, status } = req.body;
    razorpay_order_id;
    // If status is failed, no need to verify signature, directly update status
    if (status === 'failed') {
        try {
            const updatedTransaction = yield auth_1.default.transactions.updateMany({
                where: { orderId: razorpay_order_id },
                data: {
                    status: "Failed", // Mark transaction as failed
                },
            });
            return res.status(200).json({ message: 'Transaction marked as failed', transaction: updatedTransaction });
        }
        catch (error) {
            console.error('Error updating transaction:', error);
            return res.status(500).json({ message: 'Error updating transaction', error });
        }
    }
    // Otherwise, verify the successful payment
    const secret = process.env.RAZORPAY_KEY || 'your_key_secret';
    const generatedSignature = crypto_1.default
        .createHmac('sha256', secret)
        .update(razorpay_payment_id + '|' + razorpay_order_id)
        .digest('hex');
    if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature. Payment verification failed' });
    }
    try {
        // Update transaction for successful payment
        const updatedTransaction = yield auth_1.default.transactions.updateMany({
            where: { orderId: razorpay_order_id },
            data: {
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                status: "Paid",
            },
        });
        res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
    }
    catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Error updating transaction', error });
    }
}));
exports.default = router;
