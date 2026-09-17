import { AuthCard } from "@/components/auth/auth-card";

export const metadata = {
  title: "Masuk - NEXUS OSINT TOOLS",
  description: "Masuk ke platform intelijen publik dan utilitas OSINT.",
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}
