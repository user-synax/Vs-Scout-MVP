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
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
            setSidebarOpen(false);
        },
        [globalQuery, router, searchParams],
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="flex min-h-screen">
                {/* Desktop sidebar */}
                <aside className="hidden w-60 border-r border-slate-800 bg-slate-950/80 px-4 py-6 md:flex md:flex-col">
                    <div className="mb-8">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Precision Scout
                        </div>
                        <div className="mt-1 text-sm font-medium text-slate-200">
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
                                    className={`flex items-center justify-between rounded-md px-2 py-2 text-[13px] transition ${
                                        active
                                            ? "bg-slate-800 text-slate-50 shadow-sm"
                                            : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100"
                                    }`}
                                >
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-8 rounded-md border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-500">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Fund thesis
                        </div>
                        <div className="mt-1 text-slate-200">
                            AI-enabled vertical SaaS & infra.
                        </div>
                        <div className="mt-1 text-slate-500">
                            Each enrichment explains why a company matches.
                        </div>
                    </div>
                </aside>

                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-30 flex md:hidden">
                        <button
                            type="button"
                            aria-label="Close navigation"
                            onClick={() => setSidebarOpen(false)}
                            className="h-full flex-1 bg-black/60 backdrop-blur-sm"
                        />
                        <div className="relative h-full w-64 border-l border-slate-800 bg-slate-950 px-4 py-5 shadow-2xl">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                                        Precision Scout
                                    </div>
                                    <div className="mt-1 text-xs font-medium text-slate-200">
                                        Thesis-driven dealflow
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSidebarOpen(false)}
                                    className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-500"
                                >
                                    Close
                                </button>
                            </div>
                            <nav className="space-y-1 text-sm">
                                {NAV_ITEMS.map((item) => {
                                    const active = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`block rounded-md px-2 py-2 text-[13px] transition ${
                                                active
                                                    ? "bg-slate-800 text-slate-50 shadow-sm"
                                                    : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-100"
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-6 rounded-md border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-500">
                                <div className="font-semibold uppercase tracking-wide text-slate-400">
                                    Fund thesis
                                </div>
                                <div className="mt-1 text-slate-200">
                                    AI-enabled vertical SaaS & infra.
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <main className="flex-1 bg-slate-950/95">
                    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
                        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-4 md:gap-3 md:px-6 md:py-3">
                            <button
                                type="button"
                                aria-label="Toggle navigation"
                                onClick={() => setSidebarOpen((v) => !v)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-900 md:hidden"
                            >
                                <span className="sr-only">Toggle navigation</span>
                                <span className="flex flex-col gap-0.5">
                                    <span className="block h-0.5 w-4 rounded bg-slate-300" />
                                    <span className="block h-0.5 w-4 rounded bg-slate-300" />
                                    <span className="block h-0.5 w-3 rounded bg-slate-300" />
                                </span>
                            </button>
                            <form
                                onSubmit={onSubmit}
                                className="flex-1 rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-sm text-slate-100 shadow-sm focus-within:border-sky-500/60 focus-within:ring-1 focus-within:ring-sky-500/60"
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
                                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                                    Live enrichment
                                </span>
                                <span className="hidden sm:inline text-slate-400">
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

