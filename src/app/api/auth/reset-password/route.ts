import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Hash the token to compare with stored hash
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
        used: false,
      },
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { email: passwordReset.email },
      data: { password: hashedPassword },
    });

    // Mark the reset token as used
    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { used: true },
    });

    // Create profile update tracking record
    await prisma.profileUpdate.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email: passwordReset.email } }))?.id || "",
        field: "password",
        oldValue: "[HIDDEN]",
        newValue: "[HIDDEN]",
        updateType: "PASSWORD_RESET",
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    return NextResponse.json(
      { message: "Password has been reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
