import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const GithubSchema = z.object({
  username: z.string().min(1, "Username GitHub wajib diisi."),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const parsed = GithubSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    let username = parsed.data.username.trim().replace(/^@/, "");
    if (username.startsWith("http://") || username.startsWith("https://")) {
      const url = new URL(username);
      username = url.pathname.split("/").filter(Boolean)[0] || username;
    }

    const headers = {
      "User-Agent": "NexusGithubRecon/1.0",
      Accept: "application/vnd.github.v3+json",
    };

    // 1. Fetch User Profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers,
      signal: AbortSignal.timeout(6000),
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { success: false, error: `Pengguna GitHub '${username}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    const u = await userRes.json();

    // 2. Fetch Top Repositories
    let repos: any[] = [];
    let languages: Record<string, number> = {};

    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=8`,
        { headers, signal: AbortSignal.timeout(6000) }
      );
      if (reposRes.ok) {
        const repoList = await reposRes.json();
        if (Array.isArray(repoList)) {
          repos = repoList.map((r: any) => {
            if (r.language) {
              languages[r.language] = (languages[r.language] || 0) + 1;
            }
            return {
              name: r.name,
              fullName: r.full_name,
              description: r.description,
              stars: r.stargazers_count,
              forks: r.forks_count,
              language: r.language,
              updatedAt: r.updated_at?.split("T")[0],
              url: r.html_url,
            };
          });
        }
      }
    } catch {}

    const topLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({ lang, count }));

    return NextResponse.json({
      success: true,
      provider: "GitHub Official Public API Recon Engine",
      username,
      profile: {
        login: u.login,
        name: u.name || u.login,
        bio: u.bio || "Tidak ada bio publik.",
        company: u.company || "-",
        blog: u.blog || "-",
        location: u.location || "-",
        email: u.email || "Privat / Tidak ditampilkan",
        publicRepos: u.public_repos,
        publicGists: u.public_gists,
        followers: u.followers,
        following: u.following,
        createdAt: u.created_at?.split("T")[0],
        avatarUrl: u.avatar_url,
        htmlUrl: u.html_url,
      },
      topLanguages,
      recentRepositories: repos,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Gagal merekon GitHub: " + err.message },
      { status: 500 }
    );
  }
}
