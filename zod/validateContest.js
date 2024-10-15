"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateContest = exports.addContest = void 0;
const zod_1 = __importDefault(require("zod"));
exports.addContest = zod_1.default.object({
    contestName: zod_1.default.string().min(5).max(10),
    firstPrize: zod_1.default.number(),
    maxEntries: zod_1.default.number(),
    prizePool: zod_1.default.number(),
    entryFee: zod_1.default.number(),
    closingOn: zod_1.default.date(),
});
exports.updateContest = zod_1.default.object({
    contestName: zod_1.default.string().min(5).max(10),
    firstPrize: zod_1.default.number(),
    maxEntries: zod_1.default.number(),
    currentEntries: zod_1.default.number(),
    prizePool: zod_1.default.number(),
    entryFee: zod_1.default.number(),
    closingOn: zod_1.default.date(),
});
