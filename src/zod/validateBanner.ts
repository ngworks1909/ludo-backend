import z from 'zod'

export const validateBanner = z.object({
    title: z.string().min(4)
})