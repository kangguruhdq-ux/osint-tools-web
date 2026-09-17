import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword, signToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { memoryDb, prisma, safeDbQuery } from "@/lib/db";

const LoginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;

    let user: any = memoryDb.users.get(email);
    if (!user) {
      user = await safeDbQuery((p) => p.user.findUnique({ where: { email } }));
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah." },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, error: "Akun Anda saat ini ditangguhkan (SUSPENDED). Silakan hubungi Administrator." },
        { status: 403 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json(
        { success: false, error: "Akun Anda telah diblokir secara permanen (BANNED) oleh Administrator." },
        { status: 403 }
      );
    }

    const expiryStr = rememberMe ? "365d" : "7d";
    const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 365 : 60 * 60 * 24 * 7;

    const token = signToken(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
      },
      expiryStr
    );

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });

    // Set secure HTTP-only cookie with rememberMe duration
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });

    // Record audit log
    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: user.id,
      action: "USER_LOGIN",
      resourceType: "AUTH",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      createdAt: new Date(),
    });

    // Persist login audit to disk
    memoryDb.save();

    return response;

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server: " + error.message },
      { status: 500 }
    );
  }
}
