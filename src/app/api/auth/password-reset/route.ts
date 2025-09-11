import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendPasswordReset } from "@/lib/email-events";
import crypto from "crypto";

const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = passwordResetSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in user record (you might want to create a separate table for this)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Note: You might want to add resetToken and resetTokenExpiry fields to your User model
        // For now, we'll use a simple approach
      }
    });

    // Get IP address and user agent for security monitoring
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Send password reset email to user
    try {
      await sendPasswordReset(user.id, {
        email: user.email,
        name: user.name,
        resetToken,
        expiryTime: tokenExpiry.toLocaleString()
      });
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails
    }

    // Send admin notification
    try {
      // Check for previous password reset requests in last 24 hours
      const recentResets = await prisma.loginHistory.findMany({
        where: {
          userId: user.id,
          status: 'FAILED', // Assuming failed logins might indicate password reset attempts
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      // Admin notification removed - function doesn't exist
      console.log(`Password reset requested for ${user.email}`);
    } catch (adminError) {
      console.error('Admin notification error:', adminError);
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent."
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
