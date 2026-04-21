/**
 * Zod schemas — single source of truth for validation.
 * Used on BOTH the server (in API routes) and the client (forms).
 */
import { z } from 'zod';

// --- Auth ---

export const registerSchema = z
  .object({
    email:    z.string().email('Valid email required').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    name:     z.string().min(2, 'Name is too short').max(80),
    phone:    z.string().max(30).optional().or(z.literal('')),
    role:     z.enum(['CUSTOMER', 'HELPER']),
  })
  .refine((d) => !/\s/.test(d.email), { message: 'Email cannot contain spaces', path: ['email'] });

export type RegisterInput = z.infer<typeof registerSchema>;

// --- Profile ---

export const profileUpdateSchema = z.object({
  name:       z.string().min(2).max(80).optional(),
  phone:      z.string().max(30).optional(),
  bio:        z.string().max(500).optional(),
  image:      z.string().url().optional().or(z.literal('')),
  role:       z.enum(['CUSTOMER', 'HELPER']).optional(),
  baseLat:    z.number().min(-90).max(90).optional(),
  baseLng:    z.number().min(-180).max(180).optional(),
  baseAddress: z.string().max(255).optional(),
});

// --- Jobs ---

export const jobCreateSchema = z.object({
  title:          z.string().min(3, 'Title is required').max(120),
  description:    z.string().min(10, 'Please describe the items').max(2000),
  size:           z.enum(['SMALL', 'MEDIUM', 'LARGE', 'XLARGE']),
  pickupAddress:  z.string().min(5).max(255),
  pickupLat:      z.number().min(-90).max(90),
  pickupLng:      z.number().min(-180).max(180),
  dropoffAddress: z.string().min(5).max(255),
  dropoffLat:     z.number().min(-90).max(90),
  dropoffLng:     z.number().min(-180).max(180),
  preferredTime:  z.string().datetime(),
  imageUrl:       z.string().url().optional().or(z.literal('')),
  budgetCents:    z.number().int().min(500).max(500000).optional(), // $5 .. $5000
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

// --- Messages ---

export const messageSchema = z.object({
  body: z.string().min(1).max(2000),
});

// --- Reviews ---

export const reviewSchema = z.object({
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// --- Availability ---

export const availabilitySchema = z.object({
  isHelperActive: z.boolean(),
});

// --- Job status transitions ---

export const jobStatusSchema = z.object({
  action: z.enum(['START', 'COMPLETE', 'CANCEL']),
});
