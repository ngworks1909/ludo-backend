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
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const verifyAdmin_1 = require("../middlewares/verifyAdmin");
const auth_1 = __importDefault(require("../lib/auth"));
const validateBanner_1 = require("../zod/validateBanner");
const fs_1 = __importDefault(require("fs"));
const zod_1 = __importDefault(require("zod"));
const router = express_1.default.Router();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to store uploaded files
    },
    filename: (req, file, cb) => {
        const extension = path_1.default.extname(file.originalname); // Get the original file extension
        const newFilename = `${file.fieldname}-${Date.now()}${extension}`; // Create a unique filename
        cb(null, newFilename); // Use the unique filename
    },
});
// Set up multer with the defined storage configuration
const upload = (0, multer_1.default)({ storage: storage });
router.post('/upload', upload.single('files'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    // Validate title field using Zod
    const validateBanner = zod_1.default.object({
        title: zod_1.default.string().min(4, { message: "Title should have at least 4 characters" }),
    });
    const bannerValidate = validateBanner.safeParse(req.body);
    if (!bannerValidate.success) {
        return res.status(400).json({ message: 'Title should have at least 4 characters' });
    }
    const fileUrl = `${process.env.APP_URL}/uploads/${req.file.filename}`; // Create the file URL
    try {
        const { title } = req.body; // Extract the title from the request body
        // Insert the file URL into the MySQL database using Prisma
        yield auth_1.default.banner.create({
            data: {
                title, // Assuming your database model has a 'title' field
                imageUrl: fileUrl, // Save the constructed file URL
            },
        });
        return res.status(200).json({ message: 'File uploaded successfully' }); // Success response
    }
    catch (error) {
        console.error(error); // Log error for debugging
        return res.status(500).send('Error uploading file and saving to database'); // Error response
    }
}));
router.get('/fetchallbanners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banners = yield auth_1.default.banner.findMany({});
        return res.status(200).json({ banners });
    }
    catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}));
router.get('/fetchbanner/:bannerId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.put('/updatebanner/:bannerId', verifyAdmin_1.verifyAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bannerId = req.params.bannerId;
        if (!bannerId) {
            return res.status(400).json({ message: 'Invalid banner' });
        }
        const bannerValidate = validateBanner_1.validateBanner.safeParse(req.body);
        if (!bannerValidate.success) {
            return res.status(400).json({ message: 'Title should have atleast 4 characters' });
        }
        const { title } = req.body;
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
                if (err) {
                    console.error('File deletion error:', err);
                    return res.status(500).json({ message: 'Error deleting file from server.' });
                }
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
