"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = void 0;
const zod_1 = __importDefault(require("zod"));
exports.validateUser = zod_1.default.object({
    name: zod_1.default.string().min(4),
    mobile: zod_1.default.string().refine((value) => {
        return /^[6-9][0-9]{9}$/.test(value);
    })
});
