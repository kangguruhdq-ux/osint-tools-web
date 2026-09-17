import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";
import { memoryDb } from "@/lib/db";
import { hashPassword, comparePassword } from "@/lib/auth/jwt";

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
      for (const u of memoryDb.users.values()) {
        if (u.id === sessionUser.userId) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      const hashed = newPassword ? await hashPassword(newPassword.trim()) : "";
      user = {
        id: sessionUser.userId,
        email: sessionUser.email,
        name: name || sessionUser.name,
        passwordHash: hashed,
        role: sessionUser.role as any,
        avatar: avatar || undefined,
        createdAt: new Date(),
      };
      memoryDb.users.set(sessionUser.email, user);
    } else {
      if (name && typeof name === "string") user.name = name.trim();
      if (avatar !== undefined) user.avatar = avatar;

      if (newPassword && typeof newPassword === "string" && newPassword.trim()) {
        const trimmedNew = newPassword.trim();
        if (trimmedNew.length < 6) {
          return NextResponse.json(
            { success: false, error: "Kata sandi baru minimal 6 karakter." },
            { status: 400 }
          );
        }

        // Verify old password if provided
        if (oldPassword && user.passwordHash) {
          const isOldValid = await comparePassword(oldPassword, user.passwordHash);
          if (!isOldValid) {
            return NextResponse.json(
              { success: false, error: "Kata sandi lama tidak sesuai." },
              { status: 400 }
            );
          }
        }

        user.passwordHash = await hashPassword(trimmedNew);
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

    // CRITICAL: Persist changes to disk
    memoryDb.save();

    return NextResponse.json({
      success: true,
      message: newPassword ? "Kata sandi dan profil berhasil diperbarui." : "Profil berhasil diperbarui.",
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

