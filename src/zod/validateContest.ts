import z from 'zod'


export const addContest = z.object({
    contestName: z.string().min(5).max(10),
    firstPrize: z.number(),
    maxEntries: z.number(),
    prizePool: z.number(),
    entryFee: z.number(),
    closingOn: z.date(),
})


export const updateContest = z.object({
    contestName: z.string().min(5).max(10),
    firstPrize: z.number(),
    maxEntries: z.number(),
    currentEntries: z.number(),
    prizePool: z.number(),
    entryFee: z.number(),
    closingOn: z.date(),
})