import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get IP address and user agent from request
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Extract device type and browser from user agent
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const location = getLocationFromIP(ipAddress);

    // Track the login
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
        userAgent,
        status: 'SUCCESS',
        location,
        deviceType,
        browser
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Login tracked successfully" 
    });

  } catch (error) {
    console.error("Login tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track login" },
      { status: 500 }
    );
  }
}

function getDeviceType(userAgent: string): string {
  if (userAgent.includes("Mobile")) return "Mobile";
  if (userAgent.includes("Tablet")) return "Tablet";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("Linux")) return "Linux";
  return "Unknown";
}

function getBrowser(userAgent: string): string {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera")) return "Opera";
  return "Unknown";
}

function getLocationFromIP(ip: string): string {
  // In a real application, you would use an IP geolocation service
  if (ip === "127.0.0.1" || ip === "localhost" || ip === "unknown") return "Local";
  if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) return "Private Network";
  return "Unknown Location";
}
