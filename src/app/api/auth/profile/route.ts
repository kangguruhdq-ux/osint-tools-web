import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";
import { memoryDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await authenticateRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }

    const user = memoryDb.users.get(sessionUser.email);
    return NextResponse.json({
      success: true,
      user: {
        id: sessionUser.userId,
        name: user?.name || sessionUser.name,
        email: sessionUser.email,
        role: sessionUser.role,
        avatar: user?.avatar || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await authenticateRequest(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Tidak terautentikasi." }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar, oldPassword, newPassword } = body;

    let user = memoryDb.users.get(sessionUser.email);
    if (!user) {
      user = {
        id: sessionUser.userId,
        email: sessionUser.email,
        name: name || sessionUser.name,
        passwordHash: newPassword || "",
        role: sessionUser.role as any,
        avatar: avatar || undefined,
        createdAt: new Date(),
      };
      memoryDb.users.set(sessionUser.email, user);
    } else {
      if (name) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;
      if (newPassword) {
        user.passwordHash = newPassword;
      }
    }

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: sessionUser.userId,
      action: newPassword ? "UPDATE_PASSWORD" : "UPDATE_PROFILE",
      resourceType: "AUTH",
      details: {
        name: user.name,
        hasCustomAvatar: !!user.avatar,
        passwordChanged: !!newPassword,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Profil dan foto avatar berhasil diperbarui.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
