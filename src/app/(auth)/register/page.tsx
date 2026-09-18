import { AuthCard } from "@/components/auth/auth-card";

export const metadata = {
  title: "Daftar Akun - NEXUS OSINT TOOLS",
  description: "Daftar akun gratis untuk akses 60 tools OSINT publik.",
};

export default function RegisterPage() {
  return <AuthCard initialMode="register" />;
}
