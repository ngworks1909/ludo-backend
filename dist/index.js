"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const adminRoute_1 = __importDefault(require("./routes/adminRoute"));
const contestRoute_1 = __importDefault(require("./routes/contestRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const transactionRoute_1 = __importDefault(require("./routes/transactionRoute"));
const bannerRoute_1 = __importDefault(require("./routes/bannerRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use('/uploads', express_1.default.static('uploads'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/admin', adminRoute_1.default);
app.use('/api/contest', contestRoute_1.default);
app.use('/api/user', userRoute_1.default);
app.use('/api/transactions', transactionRoute_1.default);
app.use('/api/banner', bannerRoute_1.default);
app.get("/", (req, res) => {
    res.send("Hello User");
});
app.listen(process.env.PORT || 3001, () => {
    console.log(`Connected to localhost on port ${process.env.PORT || 3001}`);
});
