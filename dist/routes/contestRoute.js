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
const auth_1 = __importDefault(require("../lib/auth"));
const validateContest_1 = require("../zod/validateContest");
const router = express_1.default.Router();
router.get("/fetchallcontests", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contests = yield auth_1.default.contest.findMany({
            where: {
                isActive: true
            }
        });
        res.status(200).json({ contests });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
// Get contest by ID
router.get("/fetchcontest/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestId = req.params.id;
        const contest = yield auth_1.default.contest.findUnique({
            where: {
                contestId
            },
        });
        if (!contest) {
            return res.status(400).json({ message: 'Contest not found' });
        }
        if (!contest.isActive) {
            return res.status(400).json({ message: 'Contest has expired' });
        }
        res.status(200).json({ contest });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
// Create a new contest
router.post("/createcontest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isValid = validateContest_1.addContest.safeParse(req.body);
        if (!isValid) {
            res.status(400).json({ message: "Invalid credentials" });
        }
        const { contestName, maxEntries, prizePool, entryFee, closingOn, } = req.body;
        const totalAmount = entryFee * maxEntries;
        const tax = 0.05 * totalAmount;
        const firstPrize = totalAmount - tax;
        const contest = yield auth_1.default.contest.create({
            data: {
                contestName,
                firstPrize,
                maxEntries,
                prizePool,
                tax,
                entryFee,
                closingOn,
            },
        });
        res.status(201).json({ message: "Contest created successfully", contest });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}));
// Update contest by ID
router.put("/updatecontest/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestId = req.params.id;
        let contest = yield auth_1.default.contest.findUnique({
            where: {
                contestId,
            },
        });
        if (contest) {
            const isValid = validateContest_1.updateContest.safeParse(req.body);
            if (!isValid) {
                return res.status(400).json({ message: "Invalid credentials" });
            }
            const { contestName, firstPrize, maxEntries, currentEntries, prizePool, entryFee, closingOn, } = req.body;
            contest = yield auth_1.default.contest.update({
                where: {
                    contestId,
                },
                data: {
                    contestName: contestName || contest.contestName,
                    firstPrize: firstPrize || contest.firstPrize,
                    maxEntries: maxEntries || contest.maxEntries,
                    currentEntries: currentEntries || contest.currentEntries,
                    prizePool: prizePool || contest.prizePool,
                    entryFee: entryFee || contest.entryFee,
                    closingOn: closingOn || contest.closingOn,
                },
            });
            res.status(200).json({ message: 'Contest updated successfully', contest });
        }
        res.status(400).json({ message: 'Contest not found' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}));
// Delete contest by ID
router.delete("/deletecontest/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestId = req.params.id;
        let contest = yield auth_1.default.contest.delete({
            where: {
                contestId
            },
        });
        if (contest) {
            res.status(201).json({ message: 'Contest deleted successfully', contest });
        }
        res.status(400).json({ message: 'Contest not found' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}));
router.put("/updateActive/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contestId = req.params.id;
        let contest = yield auth_1.default.contest.findUnique({
            where: {
                contestId
            }
        });
        if (contest) {
            const { isActive } = req.body;
            contest = yield auth_1.default.contest.update({
                where: {
                    contestId
                },
                data: {
                    isActive
                }
            });
            res.status(201).json({ message: 'Contest updated successfully' });
        }
        res.status(400).json({ message: 'Contest not found' });
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.default = router;
