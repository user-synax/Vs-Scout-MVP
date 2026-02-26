"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { CompanyList } from "@/lib/types";
import { COMPANIES } from "@/data/companies";

export default function ListsPage() {
    const [lists, setLists] = useLocalStorage<CompanyList[]>("vc-lists", []);
    const [name, setName] = useState("");

    const listsWithCompanies = useMemo(
        () =>
            lists.map((list) => ({
                ...list,
                companies: list.companyIds
                    .map((id) => COMPANIES.find((c) => c.id === id))
                    .filter(Boolean),
            })),
        [lists],
    );

    const createList = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const now = new Date().toISOString();
        const newList: CompanyList = {
            id: `list-${now}-${Math.random().toString(36).slice(2, 8)}`,
            name: trimmed,
            createdAt: now,
            companyIds: [],
        };
        setLists([...lists, newList]);
        setName("");
    };

    const removeList = (id: string) => {
        setLists(lists.filter((l) => l.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                        Lists
                    </h1>
                    <p className="mt-1 text-xs text-slate-400">
                        Structure your sourcing workflow into focused lists (e.g. “Pre-seed
                        climate infra”, “Series A applied AI in healthcare”).
                    </p>
                </div>
            </div>

            <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Create list
                </div>
                <div className="flex flex-col gap-2 text-xs md:flex-row">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Seed vertical SaaS – US"
                        className="flex-1 rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                    />
                    <button
                        type="button"
                        onClick={createList}
                        className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500 hover:text-sky-100"
                    >
                        Create
                    </button>
                </div>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                <div className="flex items-center justify-between text-xs">
                    <div className="font-medium uppercase tracking-wide text-slate-400">
                        Lists
                    </div>
                    <div className="text-slate-500">
                        {lists.length} list{lists.length === 1 ? "" : "s"}
                    </div>
                </div>
                {listsWithCompanies.length === 0 ? (
                    <p className="text-xs text-slate-500">
                        No lists yet. Create a list above, then add companies from their detail
                        pages.
                    </p>
                ) : (
                    <div className="space-y-2 text-xs">
                        {listsWithCompanies.map((list) => (
                            <div
                                key={list.id}
                                className="space-y-1 rounded-md border border-slate-900 bg-slate-950/70 p-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-slate-100">{list.name}</div>
                                        <div className="text-[10px] text-slate-500">
                                            Created{" "}
                                            {new Date(list.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeList(list.id)}
                                        className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-400 hover:border-red-500 hover:text-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                                {list.companies.length === 0 ? (
                                    <div className="text-[11px] text-slate-500">
                                        Empty. Add companies from{" "}
                                        <Link
                                            href="/companies"
                                            className="text-sky-300 hover:text-sky-200"
                                        >
                                            Companies
                                        </Link>
                                        .
                                    </div>
                                ) : (
                                    <ul className="mt-1 grid gap-1 md:grid-cols-2">
                                        {list.companies.map((company) =>
                                            company ? (
                                                <li
                                                    key={company.id}
                                                    className="flex items-center justify-between gap-2 rounded border border-slate-900 bg-slate-950 px-2 py-1"
                                                >
                                                    <div>
                                                        <Link
                                                            href={`/companies/${company.id}`}
                                                            className="text-slate-100 hover:text-sky-200"
                                                        >
                                                            {company.name}
                                                        </Link>
                                                        <div className="text-[10px] text-slate-500">
                                                            {company.stage} • {company.industry}
                                                        </div>
                                                    </div>
                                                </li>
                                            ) : null,
                                        )}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

