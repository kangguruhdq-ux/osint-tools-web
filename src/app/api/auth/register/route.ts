import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, signToken } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { memoryDb, persistUserToDb, prisma, safeDbQuery } from "@/lib/db";

const RegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    let existing: any = memoryDb.users.get(email);
    if (!existing) {
      existing = await safeDbQuery((p) => p.user.findUnique({ where: { email } }));
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar. Silakan login." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = "u-" + Math.random().toString(36).substring(2, 9);

    const newUser = {
      id: userId,
      name,
      email,
      passwordHash,
      role: "ANALYST" as const,
      createdAt: new Date(),
    };

    await persistUserToDb(newUser);

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Registrasi berhasil.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: newUser.id,
      action: "USER_REGISTER",
      resourceType: "AUTH",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      createdAt: new Date(),
    });

    memoryDb.save();

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Gagal memproses registrasi: " + error.message },
      { status: 500 }
    );
  }
}
