import express from 'express'
import multer from 'multer'
import path from 'path';
import { verifyAdmin } from '../middlewares/verifyAdmin';
import prisma from '../lib/auth';
import { validateBanner } from '../zod/validateBanner';
import fs from 'fs'

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Folder where images will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Filename format
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: function (req, file, cb) {
    // Only allow image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed')); // Custom error message
  }
});

router.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Validate title field using Zod
  const bannerValidate = validateBanner.safeParse(req.body);
  if (!bannerValidate.success) {
    return res.status(400).json({ message: 'Title should have at least 4 characters' });
  }

  const fileUrl = `${process.env.APP_URL}/uploads/${req.file.filename}`;

  try {
    const { title } = req.body;
    // Insert the file URL into the MySQL database using Prisma
    await prisma.banner.create({
      data: {
        title,
        imageUrl: fileUrl, // Assuming your database model has an 'imageUrl' field
      },
    });

    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).send('Error uploading file and saving to database');
  }
});



router.get('/fetchallbanners', async(req, res) => {
  try {
    const banners = await prisma.banner.findMany({});
    return res.status(200).json({banners})
  } catch (error) {
    return res.status(500).json({message: 'Internal server error'})
  }
})

router.get('/fetchbanner/:bannerId', async(req, res) => {
  try {
    const bannerId = req.params.bannerId;
    if(!bannerId){
      return res.status(400).json({message: 'Invalid banner'})
    }
    const banner = await prisma.banner.findUnique({
      where: {
        bannerId
      }
    })
    if(!banner){
      return res.status(400).json({message: 'Banner not found'})
    }
  } catch (error) {
    return res.status(500).json({message: 'Internal server error'})
  }
})

router.put('/updatebanner/:bannerId', verifyAdmin, async(req, res) => {
  try {
    const bannerId = req.params.bannerId
    if(!bannerId){
      return res.status(400).json({message: 'Invalid banner'})
    }
    const bannerValidate = validateBanner.safeParse(req.body);
    if(!bannerValidate.success){
      return res.status(400).json({message: 'Title should have atleast 4 characters'})
    }
    const {title} = req.body
    await prisma.banner.update({
      where: {
        bannerId
      },
      data: {
        title
      }
    });

    return res.status(200).json({message: 'Banner updated successfully'})
  } catch (error) {
    return res.status(500).json({message: 'Internal server error'})
  }
});


router.delete('/deletebanner/:bannerId', verifyAdmin, async(req, res) => {
    try {
      const bannerId = req.params.bannerId
    if(!bannerId){
      return res.status(400).json({message: 'Invalid banner'})
    }
    await prisma.$transaction(async(tx) => {
      const banner = await tx.banner.findUnique({where: {bannerId}});
      if(!banner){
        return res.status(400).json({message: 'Banner not found'})
      }
      const filename = path.basename(banner.imageUrl);
      
      const filePath = path.join(__dirname, 'uploads', filename);
      fs.unlink(filePath, async (err) => {
        if (err) {
          console.error('File deletion error:', err);
          return res.status(500).json({ message: 'Error deleting file from server.' });
        }
  
        // Delete the corresponding record from the database
        await tx.banner.delete({
          where: {
            bannerId: banner.bannerId, // Assuming imageUrl is unique in the database
          },
        });
  
        return res.status(200).json({ message: 'Banner deleted successfully.' });
      });
  
    })
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' })
    }
});


export default router

