import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const notificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["SYSTEM", "ADMIN_MESSAGE", "TRANSACTION", "REFERRAL", "STAKING", "WITHDRAWAL", "DEPOSIT", "SECURITY", "PROFILE_UPDATE", "TOKEN_PURCHASE"]),
  userIds: z.array(z.string()).optional(), // If empty, send to all users
  isGlobal: z.boolean().default(false),
  icon: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, type, userIds, isGlobal, icon } = notificationSchema.parse(body);

    let notificationsCreated = 0;

    if (isGlobal || !userIds || userIds.length === 0) {
      // Send to all active users
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      // Create notifications for all users
      const notifications = allUsers.map(user => ({
        userId: user.id,
        type,
        title,
        message,
        icon: icon || "📢",
        isGlobal: true,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      notificationsCreated = allUsers.length;
    } else {
      // Send to specific users
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        icon: icon || "📢",
        isGlobal: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      notificationsCreated = userIds.length;
    }

    // Log the notification action
    console.log(`Admin ${session.user.email} sent ${notificationsCreated} notifications of type ${type}`);

    return NextResponse.json({
      message: `Notifications sent successfully to ${notificationsCreated} users`,
      notificationsCreated,
      type,
      isGlobal: isGlobal || (!userIds || userIds.length === 0),
    });

  } catch (error) {
    console.error("Error sending notifications:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or superadmin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const isGlobal = searchParams.get("isGlobal");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};
    if (type && type !== "all") where.type = type;
    if (isGlobal !== null) where.isGlobal = isGlobal === "true";
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { message: { contains: search } },
      ];
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isGlobal: notification.isGlobal,
      userId: notification.userId,
      userName: notification.user?.name,
      userEmail: notification.user?.email,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
