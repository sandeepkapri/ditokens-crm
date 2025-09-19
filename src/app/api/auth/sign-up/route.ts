import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendWelcomeEmail, sendUserRegistrationAdmin } from "@/lib/email-events";
import { isDatabaseConnectionError, getDatabaseErrorMessage } from "@/lib/database-health";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
  country: z.string().min(2, "Country is required"),
  state: z.string().min(2, "State is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, contactNumber, country, state, password, referralCode } = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code
    const userReferralCode = generateReferralCode();

    // Check if referral code is valid and get referrer
    let referrerId = null;
    let referrer = null;
    if (referralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (referrer) {
        referrerId = referrer.referralCode;
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        contactNumber,
        country,
        state,
        password: hashedPassword,
        referralCode: userReferralCode,
        referredBy: referrerId,
        isActive: true, // Set user as active by default
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        referralCode: true,
        contactNumber: true,
        country: true,
        state: true,
        referredBy: true,
        createdAt: true,
      }
    });

    // If user was referred, create initial commission record
    if (referrer && referrerId) {
      await prisma.referralCommission.create({
        data: {
          referrerId: referrer.id,
          referredUserId: user.id,
          amount: 0, // Initial commission is 0 until they make purchases
          tokenAmount: 0,
          pricePerToken: 0,
          commissionPercentage: 5.0, // Default commission percentage
          status: "PENDING", // Initial status for new signups
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      });
    }

    // Send welcome email to user
    try {
      await sendWelcomeEmail(user.id, {
        email: user.email,
        name: user.name
      });
      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the signup if email fails
    }

    // Send admin notification
    try {
      await sendUserRegistrationAdmin({
        userName: user.name,
        userEmail: user.email,
        contactNumber: user.contactNumber || 'Not provided',
        country: user.country || 'Not provided',
        state: user.state || 'Not provided',
        referralCode: user.referralCode,
        referredBy: user.referredBy || undefined,
        registrationTime: new Date().toLocaleString()
      });
      console.log(`Admin notification sent for new user: ${user.email}`);
    } catch (adminEmailError) {
      console.error('Failed to send admin notification:', adminEmailError);
      // Don't fail the signup if admin email fails
    }

    return NextResponse.json({
      message: "User created successfully",
      user
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sign-up error:", error);
    
    // Handle database connection errors specifically
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        { 
          error: getDatabaseErrorMessage(error),
          type: "database_error"
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
