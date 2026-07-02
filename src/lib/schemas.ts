import { z } from "zod";

export const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  zip: z.string().length(6, "Pincode must be exactly 6 digits"),
  shippingName: z.string().optional(),
  shippingAddress: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const b2bLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type B2BLoginFormData = z.infer<typeof b2bLoginSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
