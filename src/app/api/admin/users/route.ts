import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth/session";
import { memoryDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const usersList = Array.from(memoryDb.users.values()).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status || "ACTIVE",
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: usersList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateRequest(req);
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (memoryDb.users.has(email)) {
      return NextResponse.json(
        { success: false, error: "Pengguna dengan email ini sudah terdaftar." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newId = "u-" + Math.random().toString(36).substring(2, 9);

    const newUser = {
      id: newId,
      name,
      email,
      passwordHash,
      role: role || "ANALYST",
      createdAt: new Date(),
    };

    memoryDb.users.set(email, newUser);

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: adminUser?.userId || "u-admin-01",
      action: "ADMIN_CREATE_USER",
      resourceType: "ADMIN_USER",
      resourceId: newId,
      details: { email, role: newUser.role },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Pengguna baru berhasil ditambahkan.",
      data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminUser = await authenticateRequest(req);
    const body = await req.json();
    const { userId, role, name, newPassword, status } = body;

    let targetUser: any = null;
    let targetEmail: string | null = null;

    for (const [email, u] of memoryDb.users.entries()) {
      if (u.id === userId) {
        targetUser = u;
        targetEmail = email;
        break;
      }
    }

    if (!targetUser || !targetEmail) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    if (role) targetUser.role = role;
    if (name) targetUser.name = name;
    if (newPassword && newPassword.length >= 6) {
      targetUser.passwordHash = await hashPassword(newPassword);
    }
    if (status && ["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      if (targetEmail === "admin@nexus-osint.io" && status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, error: "Akun Administrator Utama tidak dapat disuspend atau diblokir." },
          { status: 400 }
        );
      }
      targetUser.status = status;
    }

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: adminUser?.userId || "u-admin-01",
      action: "ADMIN_UPDATE_USER",
      resourceType: "ADMIN_USER",
      resourceId: userId,
      details: { role: targetUser.role, name: targetUser.name, status: targetUser.status },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await authenticateRequest(req);
    const url = new URL(req.url);
    let userId = url.searchParams.get("id");

    if (!userId) {
      try {
        const body = await req.json();
        userId = body.id || body.userId;
      } catch {
        // no body
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "ID pengguna diperlukan." },
        { status: 400 }
      );
    }

    let foundEmail: string | null = null;
    for (const [email, u] of memoryDb.users.entries()) {
      if (u.id === userId) {
        foundEmail = email;
        break;
      }
    }

    if (!foundEmail) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Protect default admin from accidental deletion
    if (foundEmail === "admin@nexus-osint.io") {
      return NextResponse.json(
        { success: false, error: "Akun Super Admin utama tidak dapat dihapus demi keamanan sistem." },
        { status: 403 }
      );
    }

    memoryDb.users.delete(foundEmail);

    memoryDb.auditLogs.unshift({
      id: "aud-" + Date.now(),
      userId: adminUser?.userId || "u-admin-01",
      action: "ADMIN_DELETE_USER",
      resourceType: "ADMIN_USER",
      resourceId: userId,
      details: { deletedEmail: foundEmail },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus dari sistem.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
