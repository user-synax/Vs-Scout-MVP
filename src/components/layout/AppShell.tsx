"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";

const NAV_ITEMS = [
    { href: "/companies", label: "Companies" },
    { href: "/lists", label: "Lists" },
    { href: "/saved-searches", label: "Saved searches" },
];

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [globalQuery, setGlobalQuery] = useState(searchParams.get("q") ?? "");

    useEffect(() => {
        setGlobalQuery(searchParams.get("q") ?? "");
    }, [searchParams]);

    const onSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            const params = new URLSearchParams(searchParams.toString());
            if (globalQuery) {
                params.set("q", globalQuery);
            } else {
                params.delete("q");
            }
            router.push(`/companies?${params.toString()}`);
        },
        [globalQuery, router, searchParams],
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="flex min-h-screen">
                <aside className="hidden w-60 border-r border-slate-800 bg-slate-950/80 px-4 py-6 md:flex md:flex-col">
                    <div className="mb-8">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Precision Scout
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-300">
                            Thesis-driven dealflow
                        </div>
                    </div>
                    <nav className="flex-1 space-y-1 text-sm">
                        {NAV_ITEMS.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between rounded-md px-2 py-2 transition ${
                                        active
                                            ? "bg-slate-800 text-slate-50"
                                            : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">
                        <div>Fund thesis: AI vertical SaaS & infra</div>
                        <div className="mt-1 text-slate-600">
                            Signals explain why each company matches.
                        </div>
                    </div>
                </aside>
                <main className="flex-1 bg-slate-950/95">
                    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
                        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
                            <form
                                onSubmit={onSubmit}
                                className="flex-1 rounded-md border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-sm text-slate-100 shadow-sm focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/60"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">
                                        Global search
                                    </span>
                                    <input
                                        value={globalQuery}
                                        onChange={(e) =>
                                            setGlobalQuery(e.target.value)
                                        }
                                        placeholder="Company, keyword, or URL"
                                        className="ml-2 flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                                    />
                                    <kbd className="hidden rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-500 md:inline-block">
                                        Enter
                                    </kbd>
                                </div>
                            </form>
                            <div className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex">
                                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-400">
                                    Live enrichment
                                </span>
                                <span className="hidden sm:inline">
                                    API keys stay on the server.
                                </span>
                            </div>
                        </div>
                    </header>
                    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

