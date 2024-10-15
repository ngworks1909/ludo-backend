import express from 'express'
import multer from 'multer'
import path from 'path';
import { verifyAdmin } from '../middlewares/verifyAdmin';
import prisma from '../lib/auth';
import { validateBanner } from '../zod/validateBanner';
import fs from 'fs'
import z from 'zod'
import { authenticateToken } from '../middlewares/verifyUser';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Directory to store uploaded files
  },
  filename: (req, file, cb) => {
      const extension = path.extname(file.originalname); // Get the original file extension
      const newFilename = `${file.fieldname}-${Date.now()}${extension}`; // Create a unique filename
      cb(null, newFilename); // Use the unique filename
  },
});

// Set up multer with the defined storage configuration
const upload = multer({ storage: storage });

router.post('/upload', upload.single('files'), async (req, res) => {
  if (!req.file) {
      return res.status(400).send('No file uploaded.');
  }

  // Validate title field using Zod
  const validateBanner = z.object({
      title: z.string().min(4, { message: "Title should have at least 4 characters" }),
  });
  const bannerValidate = validateBanner.safeParse(req.body);
  if (!bannerValidate.success) {
    return res.status(400).json({ message: 'Title should have at least 4 characters' });
  }

  const fileUrl = `${process.env.APP_URL}/uploads/${req.file.filename}`; // Create the file URL

  try {
      const { title } = req.body; // Extract the title from the request body
      // Insert the file URL into the MySQL database using Prisma
      await prisma.banner.create({
          data: {
              title, // Assuming your database model has a 'title' field
              imageUrl: fileUrl, // Save the constructed file URL
          },
      });

      return res.status(200).json({ message: 'File uploaded successfully' }); // Success response
  } catch (error) {
      console.error(error); // Log error for debugging
      return res.status(500).send('Error uploading file and saving to database'); // Error response
  }
});



router.get('/fetchallbanners', authenticateToken, async(req, res) => {
  try {
    const banners = await prisma.banner.findMany({});
    return res.status(200).json({banners})
  } catch (error) {
    return res.status(500).json({message: 'Internal server error'})
  }
})

router.get('/fetchbanner/:bannerId', authenticateToken, async(req, res) => {
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

