"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { COMPANIES } from "@/data/companies";
import type { Company, FundingStage, ThesisTag } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const PAGE_SIZE = 10;

type SortKey = "name" | "stage" | "location";

const STAGES: (FundingStage | "Any")[] = ["Any", "Pre-Seed", "Seed", "Series A", "Series B+", "Bootstrapped"];

const TAG_LABELS: Record<ThesisTag, string> = {
    vertical_saas: "Vertical SaaS",
    fintech_infra: "Fintech infra",
    climate: "Climate",
    developer_tools: "Developer tools",
    ai_infrastructure: "AI infra",
    applied_ai: "Applied AI",
    marketplaces: "Marketplaces",
    future_of_work: "Future of work",
};

export default function CompaniesPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [customCompanies, setCustomCompanies] = useLocalStorage<Company[]>(
        "vc-custom-companies",
        [],
    );
    const [customName, setCustomName] = useState("");
    const [customWebsite, setCustomWebsite] = useState("");
    const [customDescription, setCustomDescription] = useState("");

    const q = searchParams.get("q") ?? "";
    const stageParam = (searchParams.get("stage") as FundingStage | "Any" | null) ?? "Any";
    const industryParam = searchParams.get("industry") ?? "All";
    const tagsParam = searchParams.get("tags") ?? "";
    const sort = (searchParams.get("sort") as SortKey | null) ?? "name";
    const page = Number(searchParams.get("page") ?? "1");

    const selectedTags = useMemo(
        () => (tagsParam ? (tagsParam.split(",").filter(Boolean) as ThesisTag[]) : []),
        [tagsParam],
    );

    const allCompanies = useMemo(
        () => [...COMPANIES, ...customCompanies],
        [customCompanies],
    );

    const industries = useMemo(() => {
        const fromData = allCompanies.map((c) => c.industry);
        return ["All", ...Array.from(new Set(fromData)).sort()];
    }, [allCompanies]);

    const setParam = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value.length > 0 && value !== "All" && value !== "Any") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    };

    const toggleTag = (tag: ThesisTag) => {
        const next = selectedTags.includes(tag)
            ? selectedTags.filter((t) => t !== tag)
            : [...selectedTags, tag];
        setParam("tags", next.join(","));
    };

    const filtered = useMemo(() => {
        return allCompanies.filter((company) => {
            if (stageParam !== "Any" && company.stage !== stageParam) return false;
            if (industryParam !== "All" && company.industry !== industryParam) return false;
            if (
                selectedTags.length > 0 &&
                !selectedTags.every((t) => company.thesisTags.includes(t))
            ) {
                return false;
            }

            const query = q.toLowerCase().trim();
            if (!query) return true;

            const haystack = [
                company.name,
                company.industry,
                company.description,
                company.location,
                company.website,
                company.stage,
                company.thesisTags.join(" "),
            ]
                .join(" ")
                .toLowerCase();

            return haystack.includes(query);
        }).sort((a, b) => {
            if (sort === "name") {
                return a.name.localeCompare(b.name);
            }
            if (sort === "location") {
                return a.location.localeCompare(b.location);
            }
            if (sort === "stage") {
                return a.stage.localeCompare(b.stage);
            }
            return 0;
        });
    }, [allCompanies, industryParam, q, selectedTags, sort, stageParam]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    const handleAddCustom = (e: FormEvent) => {
        e.preventDefault();
        const name = customName.trim();
        const website = customWebsite.trim();
        if (!name || !website) return;

        const idBase =
            name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
            website.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        const id = `custom-${idBase}-${Math.random().toString(36).slice(2, 6)}`;

        const newCompany: Company = {
            id,
            name,
            website: website.startsWith("http") ? website : `https://${website}`,
            industry: "Custom",
            stage: "Bootstrapped",
            thesisTags: [],
            location: "Unknown",
            description:
                customDescription.trim() ||
                "Custom website added manually for on-the-fly enrichment.",
        };

        setCustomCompanies([...customCompanies, newCompany]);
        setCustomName("");
        setCustomWebsite("");
        setCustomDescription("");
        router.push(`/companies/${id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-50">
                        Companies
                    </h1>
                    <p className="mt-1 text-xs text-slate-400">
                        Search across a mock universe of thesis-relevant companies. Filters and
                        search combine into a reusable workflow.
                    </p>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 md:justify-end">
                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                        {filtered.length} results
                    </span>
                </div>
            </div>

            <section className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs md:p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Quick custom website enrich
                    </div>
                    <div className="text-[11px] text-slate-500">
                        Paste any startup URL to add it as a local-only company and run enrichment.
                    </div>
                </div>
                <form
                    onSubmit={handleAddCustom}
                    className="flex flex-col gap-2 md:flex-row md:items-center"
                >
                    <input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Company name"
                        className="w-full rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60 md:max-w-[180px]"
                    />
                    <input
                        value={customWebsite}
                        onChange={(e) => setCustomWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full flex-1 rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                    />
                    <textarea
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder="Optional: short note on what this company does"
                        rows={2}
                        className="w-full rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60 md:max-w-xs"
                    />
                    <button
                        type="submit"
                        className="w-full rounded-md border border-emerald-500/80 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-500/20 md:w-auto"
                    >
                        Add &amp; enrich
                    </button>
                </form>
            </section>

            <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                <div className="grid gap-3 text-xs md:grid-cols-4">
                    <div className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-400">Stage</div>
                        <select
                            value={stageParam}
                            onChange={(e) => setParam("stage", e.target.value)}
                            className="w-full rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                        >
                            {STAGES.map((stage) => (
                                <option key={stage} value={stage}>
                                    {stage}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-400">Industry</div>
                        <select
                            value={industryParam}
                            onChange={(e) => setParam("industry", e.target.value)}
                            className="w-full rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                        >
                            {industries.map((ind) => (
                                <option key={ind} value={ind}>
                                    {ind}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-400">Sort</div>
                        <select
                            value={sort}
                            onChange={(e) => setParam("sort", e.target.value)}
                            className="w-full rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                        >
                            <option value="name">Name</option>
                            <option value="stage">Stage</option>
                            <option value="location">Location</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-400">
                            Thesis tags (AND)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(Object.keys(TAG_LABELS) as ThesisTag[]).map((tag) => {
                                const active = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                                            active
                                                ? "border-sky-500 bg-sky-500/20 text-sky-100"
                                                : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-100"
                                        }`}
                                    >
                                        {TAG_LABELS[tag]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
                <div className="min-w-full overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                                    Company
                                </th>
                                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                                    Industry
                                </th>
                                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                                    Stage
                                </th>
                                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                                    Thesis tags
                                </th>
                                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                                    Location
                                </th>
                                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                                    Last round
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((company) => (
                                <tr
                                    key={company.id}
                                    className="border-t border-slate-900/60 hover:bg-slate-900/60"
                                >
                                    <td className="px-3 py-2 align-top">
                                        <div className="flex flex-col gap-0.5">
                                            <Link
                                                href={`/companies/${company.id}`}
                                                className="text-xs font-medium text-sky-200 hover:text-sky-100"
                                            >
                                                {company.name}
                                            </Link>
                                            <div className="line-clamp-1 text-[11px] text-slate-500">
                                                {company.description}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-[11px] text-slate-400">
                                        {company.industry}
                                    </td>
                                    <td className="px-3 py-2 align-top text-[11px] text-slate-400">
                                        {company.stage}
                                    </td>
                                    <td className="px-3 py-2 align-top text-[11px]">
                                        <div className="flex flex-wrap gap-1">
                                            {company.thesisTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400"
                                                >
                                                    {TAG_LABELS[tag]}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 align-top text-[11px] text-slate-400">
                                        {company.location}
                                    </td>
                                    <td className="px-3 py-2 align-top text-[11px] text-slate-400">
                                        {company.lastFundingRound ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span>
                                                    {company.lastFundingRound.stage} •{" "}
                                                    {company.lastFundingRound.amountMillions
                                                        ? `$${company.lastFundingRound.amountMillions}M`
                                                        : "Undisclosed"}
                                                </span>
                                                {company.lastFundingRound.date && (
                                                    <span className="text-[10px] text-slate-500">
                                                        {company.lastFundingRound.date}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-500">N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {pageItems.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-3 py-8 text-center text-xs text-slate-500"
                                    >
                                        No companies match this workflow. Try widening your
                                        filters or removing some thesis tags.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2 text-[11px] text-slate-400">
                        <div>
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setParam("page", String(currentPage - 1))}
                                className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setParam("page", String(currentPage + 1))}
                                className="rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

