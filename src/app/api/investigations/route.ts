import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/auth/session";
import {
  memoryDb,
  ensureDbSynced,
  persistInvestigationToDb,
  deleteInvestigationFromDb,
  persistAuditLogToDb,
} from "@/lib/db";

const InvestigationSchema = z.object({
  title: z.string().min(3, "Judul project minimal 3 karakter."),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  analystNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await ensureDbSynced();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const isAdmin = user.role === "ADMIN" || user.role === "SUPERADMIN";

    let items = Array.from(memoryDb.investigations.values());
    if (!isAdmin || scope !== "all") {
      items = items.filter((inv) => inv.userId === user.userId);
    }

    return NextResponse.json({
      success: true,
      data: items,
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
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Silakan login terlebih dahulu untuk membuat project investigasi." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = InvestigationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, description, tags, priority, analystNotes } = parsed.data;
    const invId = "inv-" + Math.random().toString(36).substring(2, 8);

    const newInv = {
      id: invId,
      userId: user.userId,
      title,
      description: description || "",
      tags: tags || [],
      priority,
      analystNotes: analystNotes || "",
      status: "OPEN",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await persistInvestigationToDb(newInv);

    // Audit log
    await persistAuditLogToDb({
      id: "aud-" + Date.now(),
      userId: user.userId,
      action: "CREATE_INVESTIGATION",
      resourceType: "INVESTIGATION",
      resourceId: invId,
      details: { title },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Project investigasi berhasil dibuat.",
      data: newInv,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json();
    const { id, title, description, tags, priority, status, analystNotes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID investigasi diperlukan." }, { status: 400 });
    }

    const existing = memoryDb.investigations.get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Investigasi tidak ditemukan." }, { status: 404 });
    }

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
    if (user && existing.userId && existing.userId !== user.userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda tidak memiliki izin untuk mengedit investigasi ini." },
        { status: 403 }
      );
    }

    const updated = {
      ...existing,
      title: title ?? existing.title,
      description: description ?? existing.description,
      tags: tags ?? existing.tags,
      priority: priority ?? existing.priority,
      status: status ?? existing.status,
      analystNotes: analystNotes ?? existing.analystNotes,
      updatedAt: new Date(),
    };

    await persistInvestigationToDb(updated);

    await persistAuditLogToDb({
      id: "aud-" + Date.now(),
      userId: user?.userId || "u-guest",
      action: "UPDATE_INVESTIGATION",
      resourceType: "INVESTIGATION",
      resourceId: id,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Investigasi berhasil diperbarui.",
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "ID investigasi diperlukan." }, { status: 400 });
    }

    const existing = memoryDb.investigations.get(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Investigasi tidak ditemukan." }, { status: 404 });
    }

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
    if (user && existing.userId && existing.userId !== user.userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda tidak memiliki izin untuk menghapus investigasi ini." },
        { status: 403 }
      );
    }

    await deleteInvestigationFromDb(id);

    await persistAuditLogToDb({
      id: "aud-" + Date.now(),
      userId: user?.userId || "u-guest",
      action: "DELETE_INVESTIGATION",
      resourceType: "INVESTIGATION",
      resourceId: id,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Investigasi berhasil dihapus.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
