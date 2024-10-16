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
const path_1 = __importDefault(require("path"));
const verifyAdmin_1 = require("../middlewares/verifyAdmin");
const auth_1 = __importDefault(require("../lib/auth"));
const validateBanner_1 = require("../zod/validateBanner");
const fs_1 = __importDefault(require("fs"));
const verifyUser_1 = require("../middlewares/verifyUser");
const zod_1 = __importDefault(require("zod"));
const router = express_1.default.Router();
router.post('/upload', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bannerValidate = validateBanner_1.validateBanner.safeParse(req.body);
        if (!bannerValidate.success) {
            return res.status(400).json({ message: 'Invalid request' });
        }
        const { url, title } = req.body;
        const banner = yield auth_1.default.banner.create({
            data: {
                title,
                imageUrl: url
            }
        });
        return res.status(200).json({ message: 'Banner created successfully', banner });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error', error });
    }
}));
// router.get('/fetchallbanners', authenticateToken, async(req, res) => {
//   try {
//     const banners = await prisma.banner.findMany({});
//     return res.status(200).json({banners})
//   } catch (error) {
//     return res.status(500).json({message: 'Internal server error'})
//   }
// })
router.get('/fetchallbanners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banners = yield auth_1.default.banner.findMany({
            select: {
                bannerId: true,
                imageUrl: true,
                title: true
            }
        });
        return res.status(200).json({ banners });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.get('/fetchbanner/:bannerId', verifyUser_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bannerId = req.params.bannerId;
        if (!bannerId) {
            return res.status(400).json({ message: 'Invalid banner' });
        }
        const banner = yield auth_1.default.banner.findUnique({
            where: {
                bannerId
            }
        });
        if (!banner) {
            return res.status(400).json({ message: 'Banner not found' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.put('/updatebanner/:bannerId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bannerId = req.params.bannerId;
        if (!bannerId) {
            return res.status(400).json({ message: 'Invalid banner' });
        }
        const { title } = req.body;
        const bannerValidate = zod_1.default.string().min(4).safeParse(title);
        if (!bannerValidate.success) {
            return res.status(400).json({ message: 'Title should have atleast 4 characters' });
        }
        yield auth_1.default.banner.update({
            where: {
                bannerId
            },
            data: {
                title
            }
        });
        return res.status(200).json({ message: 'Banner updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.delete('/deletebanner/:bannerId', verifyAdmin_1.verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bannerId = req.params.bannerId;
        if (!bannerId) {
            return res.status(400).json({ message: 'Invalid banner' });
        }
        yield auth_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const banner = yield tx.banner.findUnique({ where: { bannerId } });
            if (!banner) {
                return res.status(400).json({ message: 'Banner not found' });
            }
            const filename = path_1.default.basename(banner.imageUrl);
            const filePath = path_1.default.join(__dirname, 'uploads', filename);
            fs_1.default.unlink(filePath, (err) => __awaiter(void 0, void 0, void 0, function* () {
                // Delete the corresponding record from the database
                yield tx.banner.delete({
                    where: {
                        bannerId: banner.bannerId, // Assuming imageUrl is unique in the database
                    },
                });
                return res.status(200).json({ message: 'Banner deleted successfully.' });
            }));
        }));
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
exports.default = router;
