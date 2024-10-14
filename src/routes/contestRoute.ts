import express from "express";
import prisma from "../lib/auth";
import { addContest, updateContest } from "../zod/validateContest";

const router = express.Router();

router.get("/fetchallcontests", async (req, res) => {
  try {
    const contests = await prisma.contest.findMany({
      where: {
        isActive: true
      }
    });
    res.status(200).json({ contests });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get contest by ID
router.get("/fetchcontest/:id", async (req, res) => {
  try {
    const contestId = req.params.id;
    const contest = await prisma.contest.findUnique({
      where: {
        contestId
      },
    });
    if(!contest){
      return res.status(400).json({message: 'Contest not found'})
    }
    if(!contest.isActive){
      return res.status(400).json({message: 'Contest has expired'})
    }
    res.status(200).json({ contest })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new contest
router.post("/createcontest", async (req, res) => {
  try {
    const isValid = addContest.safeParse(req.body);
    if(!isValid){
      res.status(400).json({message: "Invalid credentials"})
    }
    const {
      contestName,
      maxEntries,
      prizePool,
      entryFee,
      closingOn,
    } = req.body;
    const totalAmount = entryFee * maxEntries
    const tax = 0.05 * totalAmount;
    const firstPrize = totalAmount - tax
    const contest = await prisma.contest.create({
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
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update contest by ID
router.put("/updatecontest/:id", async (req, res) => {
  try {
    const contestId = req.params.id;
    let contest = await prisma.contest.findUnique({
      where: {
        contestId,
      },
    });
    if (contest) {
      const isValid = updateContest.safeParse(req.body)
      if(!isValid){
        return res.status(400).json({message: "Invalid credentials"})
      }
      const {
        contestName,
        firstPrize,
        maxEntries,
        currentEntries,
        prizePool,
        entryFee,
        closingOn,
      } = req.body;
      contest = await prisma.contest.update({
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
      res.status(200).json({message: 'Contest updated successfully', contest})
    }
    res.status(400).json({message: 'Contest not found'})
  } catch (error) {
    res.status(500).json({message: 'Internal server error'})
  }
});

// Delete contest by ID
router.delete("/deletecontest/:id", async(req, res) => {
    try {
        const contestId = req.params.id;
        let contest = await prisma.contest.delete({
            where: {
                contestId
            },
        });
        if(contest){
            res.status(201).json({message: 'Contest deleted successfully', contest});
        }
        res.status(400).json({message: 'Contest not found'})
    } catch (error) {
        res.status(500).json({message: 'Internal server error'})
    }
});

router.put("/updateActive/:id", async(req, res) => {
    try {
      const contestId = req.params.id;
        let contest = await prisma.contest.findUnique({
            where: {
                contestId
            }
        });
        if(contest){
            const {isActive} = req.body
            contest = await prisma.contest.update({
                where: {
                    contestId
                },
                data: {
                    isActive
                }
            });
            res.status(201).json({message: 'Contest updated successfully'}); 
        }
        res.status(400).json({message: 'Contest not found'})
    } catch (error) {
        res.status(500).json({message: 'Internal server error'})
    }
});

export default router
