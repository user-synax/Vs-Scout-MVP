"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { SavedSearch } from "@/lib/types";

export default function SavedSearchesPage() {
    const router = useRouter();
    const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch[]>(
        "vc-saved-searches",
        [],
    );
    const [name, setName] = useState("");

    const createFromCurrent = () => {
        const params = new URLSearchParams(window.location.search);
        const query = params.get("q") ?? "";
        const industry = params.get("industry") ?? undefined;
        const stage = (params.get("stage") as SavedSearch["stage"]) ?? "Any";
        const tagsString = params.get("tags");
        const tags = tagsString
            ? (tagsString.split(",").filter(Boolean) as NonNullable<SavedSearch["tags"]>)
            : undefined;

        const trimmed = name.trim();
        if (!trimmed) return;

        const now = new Date().toISOString();
        const search: SavedSearch = {
            id: `search-${now}-${Math.random().toString(36).slice(2, 8)}`,
            name: trimmed,
            query,
            industry,
            stage,
            tags,
            createdAt: now,
        };
        setSavedSearches([...savedSearches, search]);
        setName("");
    };

    const runSearch = (s: SavedSearch) => {
        const params = new URLSearchParams();
        if (s.query) params.set("q", s.query);
        if (s.industry) params.set("industry", s.industry);
        if (s.stage && s.stage !== "Any") params.set("stage", s.stage);
        if (s.tags && s.tags.length > 0) params.set("tags", s.tags.join(","));
        router.push(`/companies?${params.toString()}`);
    };

    const remove = (id: string) => {
        setSavedSearches(savedSearches.filter((s) => s.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                        Saved searches
                    </h1>
                    <p className="mt-1 text-xs text-slate-400">
                        Turn noisy generic alerts into thesis-driven workflows you can re-run in
                        one click.
                    </p>
                </div>
            </div>

            <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Save current workflow
                </div>
                <div className="flex flex-col gap-2 text-xs md:flex-row">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Name this search (e.g. Seed climate infra, EU)"
                        className="flex-1 rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                    />
                    <button
                        type="button"
                        onClick={createFromCurrent}
                        className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500 hover:text-sky-100"
                    >
                        Save from URL
                    </button>
                </div>
                <p className="text-[11px] text-slate-500">
                    This captures the current filters and query from the address bar, so it
                    stays in sync with how you actually work.
                </p>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                <div className="flex items-center justify-between text-xs">
                    <div className="font-medium uppercase tracking-wide text-slate-400">
                        Saved workflows
                    </div>
                    <div className="text-slate-500">
                        {savedSearches.length} saved search
                        {savedSearches.length === 1 ? "" : "es"}
                    </div>
                </div>
                {savedSearches.length === 0 ? (
                    <p className="text-xs text-slate-500">
                        No saved searches yet. Configure filters on{" "}
                        <span className="text-slate-300">Companies</span>, then save them here
                        to re-run your thesis with fresh data.
                    </p>
                ) : (
                    <div className="space-y-2 text-xs">
                        {savedSearches.map((s) => (
                            <div
                                key={s.id}
                                className="flex items-center justify-between gap-2 rounded-md border border-slate-900 bg-slate-950/70 px-2 py-1.5"
                            >
                                <div>
                                    <div className="text-slate-100">{s.name}</div>
                                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-500">
                                        {s.query && (
                                            <span className="rounded-full bg-slate-900 px-1.5 py-0.5">
                                                q: {s.query}
                                            </span>
                                        )}
                                        {s.industry && (
                                            <span className="rounded-full bg-slate-900 px-1.5 py-0.5">
                                                {s.industry}
                                            </span>
                                        )}
                                        {s.stage && s.stage !== "Any" && (
                                            <span className="rounded-full bg-slate-900 px-1.5 py-0.5">
                                                {s.stage}
                                            </span>
                                        )}
                                        {s.tags &&
                                            s.tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full bg-slate-900 px-1.5 py-0.5"
                                                >
                                                    {tag.replace(/_/g, " ")}
                                                </span>
                                            ))}
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        Saved{" "}
                                        {new Date(s.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <button
                                        type="button"
                                        onClick={() => runSearch(s)}
                                        className="rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100"
                                    >
                                        Run
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(s.id)}
                                        className="text-[10px] text-slate-500 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

