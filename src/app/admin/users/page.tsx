"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Shield,
  CheckCircle2,
  UserCheck,
  Key,
  Plus,
  Trash2,
  Edit3,
  Search,
  ShieldAlert,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ANALYST");

  // Edit form state
  const [editUserId, setEditUserId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("ANALYST");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editNewPassword, setEditNewPassword] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const d = await res.json();
      if (d.success) setUsers(d.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal membuat pengguna");
        setLoading(false);
        return;
      }

      success("Pengguna baru berhasil ditambahkan!", "Pengguna Dibuat");
      setCreateModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (u: any) => {
    setEditUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditStatus(u.status || "ACTIVE");
    setEditNewPassword("");
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editUserId,
          name: editName,
          role: editRole,
          status: editStatus,
          newPassword: editNewPassword || undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal memperbarui pengguna");
        setLoading(false);
        return;
      }

      success("Data pengguna berhasil diperbarui.", "Tersimpan");
      setEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSetStatus = async (u: any, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, status: newStatus }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) {
        toastError(d.error || "Gagal memperbarui status");
        return;
      }
      success(`Status akun ${u.name} diubah menjadi ${newStatus}.`, "Status Diperbarui");
      fetchUsers();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!confirm(`Hapus pengguna "${u.name}" (${u.email}) dari sistem?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        success("Pengguna berhasil dihapus.", "Terhapus");
        fetchUsers();
      } else {
        toastError(d.error || "Gagal menghapus pengguna");
      }
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout userRole="ADMIN">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-1 text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span>Admin Console</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Manajemen Pengguna & RBAC
            </h1>
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengguna Baru</span>
          </Button>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 p-5">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-white">Daftar Akun Pengguna</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola hak akses Role-Based Access Control (RBAC) dan kredensial analis.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari user atau email..."
                className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <tr>
                  <th className="p-3">Pengguna</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role RBAC</th>
                  <th className="p-3">Status Akses</th>
                  <th className="p-3">Tanggal Dibuat</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/80 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-mono">
                          {u.name.charAt(0)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3">
                      <Badge
                        variant={u.role === "ADMIN" ? "warning" : "default"}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          u.status === "BANNED"
                            ? "destructive"
                            : u.status === "SUSPENDED"
                            ? "warning"
                            : "success"
                        }
                        className="text-[10px] font-mono uppercase"
                      >
                        {u.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.email !== "admin@nexus-osint.io" && (
                          <>
                            {u.status === "SUSPENDED" || u.status === "BANNED" ? (
                              <button
                                type="button"
                                onClick={() => handleQuickSetStatus(u, "ACTIVE")}
                                className="px-2 py-1 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 hover:bg-emerald-900 transition-colors"
                                title="Buka Blokir (Aktifkan)"
                              >
                                Aktifkan
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSetStatus(u, "SUSPENDED")}
                                  className="px-2 py-1 rounded text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50 hover:bg-amber-900 transition-colors"
                                  title="Tangguhkan Akun (Suspend)"
                                >
                                  Suspend
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickSetStatus(u, "BANNED")}
                                  className="px-2 py-1 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-800/50 hover:bg-red-900 transition-colors"
                                  title="Blokir Permanen (Ban)"
                                >
                                  Ban
                                </button>
                              </>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title="Edit Pengguna"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {u.email !== "admin@nexus-osint.io" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Create User */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun analis atau administrator baru dengan kredensial akses instan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Nama Lengkap</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Pengguna"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Alamat Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analis@nexus-osint.io"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Kata Sandi Awal</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Role Pengguna</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="USER">USER (Akses Terbatas)</option>
                <option value="ANALYST">ANALYST (Akses 60 Tools & Workspace)</option>
                <option value="ADMIN">ADMIN (Akses Penuh Console)</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={loading}>
                Tambahkan Pengguna
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* Modal: Edit User */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui nama, ubah role hak akses RBAC, atau reset kata sandi akun.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Nama Lengkap</label>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nama Pengguna"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Role Pengguna</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="USER">USER</option>
                <option value="ANALYST">ANALYST</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Status Akun</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Normal - Akses Penuh)</option>
                <option value="SUSPENDED">SUSPENDED (Ditangguhkan - Blokir Login)</option>
                <option value="BANNED">BANNED (Diblokir Permanen)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-slate-300">Reset Kata Sandi (Opsional)</label>
              <Input
                type="password"
                value={editNewPassword}
                onChange={(e) => setEditNewPassword(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah sandi"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="glow" isLoading={loading}>
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </Dialog>
      </div>
    </AppLayout>
  );
}
