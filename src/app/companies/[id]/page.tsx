"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { COMPANIES } from "@/data/companies";
import type {
    Company,
    CompanyList,
    EnrichmentResult,
    SignalTimelineItem,
} from "@/lib/types";
import { DEFAULT_FUND_THESIS } from "@/lib/thesis";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type EnrichmentMap = Record<string, EnrichmentResult>;
type NotesMap = Record<string, string>;

export default function CompanyDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const company = useMemo(
        () => COMPANIES.find((c) => c.id === params.id),
        [params.id],
    );

    const [enrichments, setEnrichments] = useLocalStorage<EnrichmentMap>(
        "vc-enrichments",
        {},
    );
    const [notesMap, setNotesMap] = useLocalStorage<NotesMap>("vc-notes", {});
    const [lists, setLists] = useLocalStorage<CompanyList[]>("vc-lists", []);

    const enrichment = company ? enrichments[company.id] : undefined;
    const [isEnriching, setIsEnriching] = useState(false);
    const [enrichError, setEnrichError] = useState<string | null>(null);

    if (!company) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => router.push("/companies")}
                    className="rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                >
                    ← Back to companies
                </button>
                <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-200">
                    Company not found in the current universe.
                </div>
            </div>
        );
    }

    const notes = notesMap[company.id] ?? "";

    const inLists = lists.filter((list) =>
        list.companyIds.includes(company.id),
    );

    const toggleInList = (list: CompanyList) => {
        setLists(
            lists.map((l) =>
                l.id === list.id
                    ? {
                          ...l,
                          companyIds: l.companyIds.includes(company.id)
                              ? l.companyIds.filter((id) => id !== company.id)
                              : [...l.companyIds, company.id],
                      }
                    : l,
            ),
        );
    };

    const timeline: SignalTimelineItem[] = useMemo(() => {
        const items: SignalTimelineItem[] = [];
        if (company.lastFundingRound?.date) {
            items.push({
                id: `${company.id}-funding`,
                type: "funding",
                label: `${company.lastFundingRound.stage} round${
                    company.lastFundingRound.amountMillions
                        ? ` ($${company.lastFundingRound.amountMillions}M)`
                        : ""
                }`,
                date: company.lastFundingRound.date,
                source: company.lastFundingRound.leadInvestor,
            });
        }
        if (enrichment) {
            items.push({
                id: `${company.id}-enriched`,
                type: "enrichment",
                label: "Thesis enrichment run",
                date:
                    enrichment.sources[0]?.scrapedAt ??
                    new Date().toISOString().slice(0, 10),
                source: enrichment.sources[0]?.url,
            });
        }
        return items.sort((a, b) => b.date.localeCompare(a.date));
    }, [company, enrichment]);

    async function handleEnrich() {
        setIsEnriching(true);
        setEnrichError(null);
        try {
            const res = await fetch("/api/enrich", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    companyId: company.id,
                    website: company.website,
                    name: company.name,
                    description: company.description,
                }),
            });
            if (!res.ok) {
                const errorJson = await res.json().catch(() => null);
                throw new Error(errorJson?.error ?? "Failed to enrich company");
            }
            const data = (await res.json()) as { enrichment: EnrichmentResult };
            setEnrichments({
                ...enrichments,
                [company.id]: data.enrichment,
            });
        } catch (err: unknown) {
            setEnrichError(
                err instanceof Error
                    ? err.message
                    : "Unexpected error during enrichment",
            );
        } finally {
            setIsEnriching(false);
        }
    }

    const score = enrichment?.score ?? null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => router.push("/companies")}
                        className="group inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300"
                    >
                        <span className="transition group-hover:-translate-x-0.5">
                            ←
                        </span>
                        <span>Back to companies</span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-semibold tracking-tight text-slate-50">
                            {company.name}
                        </h1>
                        <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-sky-300 hover:text-sky-200"
                        >
                            {company.website.replace(/^https?:\/\//, "")}
                        </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>{company.industry}</span>
                        <span>•</span>
                        <span>{company.stage}</span>
                        <span>•</span>
                        <span>{company.location}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        type="button"
                        onClick={handleEnrich}
                        disabled={isEnriching}
                        className="rounded-md border border-emerald-500/80 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-100 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-500/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
                    >
                        {isEnriching
                            ? "Enriching…"
                            : enrichment
                              ? "Re-run enrichment"
                              : "Enrich"}
                    </button>
                    {score != null && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                                {score}
                            </span>
                            <span>Thesis fit score</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
                <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Overview
                        </h2>
                        <div className="text-[11px] text-slate-500">
                            Thesis: {DEFAULT_FUND_THESIS.name}
                        </div>
                    </div>
                    <p className="text-sm text-slate-200">
                        {company.description}
                    </p>
                    {company.thesisTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400">
                            {company.thesisTags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px]"
                                >
                                    {tag.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Notes
                        </h2>
                        <span className="text-[11px] text-slate-500">
                            Private • stored locally
                        </span>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) =>
                            setNotesMap({
                                ...notesMap,
                                [company.id]: e.target.value,
                            })
                        }
                        rows={6}
                        placeholder="Log why this fits or doesn’t fit your thesis, next steps, and owners. Stored only in your browser."
                        className="w-full rounded-md border border-slate-800 bg-slate-950/80 p-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Auto-saved</span>
                    </div>
                </section>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
                <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Signals timeline
                        </h2>
                        <span className="text-[11px] text-slate-500">
                            Sorted by recency
                        </span>
                    </div>
                    {timeline.length === 0 ? (
                        <p className="text-xs text-slate-500">
                            No signals yet. Run enrichment or update the mock
                            dataset to see a temporal view of activity.
                        </p>
                    ) : (
                        <ol className="space-y-2 text-xs">
                            {timeline.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-start gap-2 rounded-md border border-slate-900 bg-slate-950/70 px-2 py-1.5"
                                >
                                    <span
                                        className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                                            item.type === "funding"
                                                ? "bg-emerald-400"
                                                : "bg-sky-400"
                                        }`}
                                    />
                                    <div className="flex-1 space-y-0.5">
                                        <div className="flex flex-wrap items-center gap-1">
                                            <span className="font-medium text-slate-200">
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {item.date}
                                            </span>
                                            {item.source && (
                                                <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-400">
                                                    {item.source}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-wide text-slate-500">
                                            {item.type === "funding"
                                                ? "Funding signal"
                                                : "Enrichment signal"}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Lists
                        </h2>
                        <Link
                            href="/lists"
                            className="text-[11px] text-sky-300 hover:text-sky-200"
                        >
                            Manage lists
                        </Link>
                    </div>
                    {lists.length === 0 ? (
                        <p className="text-xs text-slate-500">
                            No lists yet. Create one from the{" "}
                            <span className="text-slate-300">Lists</span> page
                            to structure your pipeline.
                        </p>
                    ) : (
                        <ul className="space-y-1 text-xs">
                            {lists.map((list) => {
                                const inList = list.companyIds.includes(
                                    company.id,
                                );
                                return (
                                    <li
                                        key={list.id}
                                        className="flex items-center justify-between gap-2 rounded-md border border-slate-900 bg-slate-950/70 px-2 py-1.5"
                                    >
                                        <div>
                                            <div className="text-slate-100">
                                                {list.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {list.companyIds.length}{" "}
                                                companies
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleInList(list)}
                                            className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500 hover:text-sky-100"
                                        >
                                            {inList ? "Remove" : "Add"}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {inLists.length > 0 && (
                        <div className="pt-2 text-[11px] text-slate-500">
                            Currently in {inLists.length} list
                            {inLists.length > 1 ? "s" : ""}:{" "}
                            {inLists.map((l) => l.name).join(", ")}
                        </div>
                    )}
                </section>
            </div>

            <section className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Enrichment
                    </h2>
                    <span className="text-[11px] text-slate-500">
                        Live web content + rule-based thesis engine
                    </span>
                </div>
                {enrichError && (
                    <div className="rounded-md border border-red-900/70 bg-red-950/40 px-2 py-1.5 text-[11px] text-red-200">
                        {enrichError}
                    </div>
                )}
                {!enrichment && !isEnriching && !enrichError && (
                    <p className="text-xs text-slate-500">
                        No enrichment yet. Click{" "}
                        <span className="font-medium text-slate-300">
                            Enrich
                        </span>{" "}
                        above to pull the public website, extract structure via
                        LLM, and generate a thesis explanation.
                    </p>
                )}
                {isEnriching && (
                    <p className="text-xs text-slate-400">
                        Running enrichment pipeline: fetching site → extracting
                        text → LLM structuring → signal engine…
                    </p>
                )}
                {enrichment && !isEnriching && (
                    <div className="space-y-4 text-xs">
                        <div className="space-y-1.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                Summary
                            </div>
                            <p className="text-sm text-slate-200">
                                {enrichment.summary}
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    What they do
                                </div>
                                <ul className="space-y-1">
                                    {enrichment.whatTheyDo.map((item, idx) => (
                                        <li
                                            key={idx}
                                            className="text-slate-200"
                                        >
                                            • {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Keywords
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {enrichment.keywords.map((kw) => (
                                        <span
                                            key={kw}
                                            className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Raw signals
                                </div>
                                <ul className="space-y-1">
                                    {enrichment.signals.map((sig, idx) => (
                                        <li
                                            key={idx}
                                            className="text-slate-200"
                                        >
                                            • {sig}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Derived signals
                                </div>
                                <ul className="space-y-1">
                                    {enrichment.derivedSignals.map(
                                        (sig, idx) => (
                                            <li
                                                key={idx}
                                                className="text-slate-200"
                                            >
                                                • {sig}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>
                            <div className="space-y-1.5">
                                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Thesis explanation
                                </div>
                                <p className="text-slate-200">
                                    {enrichment.thesisMatchExplanation}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                Sources
                            </div>
                            <ul className="space-y-1">
                                {enrichment.sources.map((src, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center justify-between gap-2 text-[11px] text-slate-400"
                                    >
                                        <a
                                            href={src.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="truncate text-sky-300 hover:text-sky-200"
                                        >
                                            {src.url}
                                        </a>
                                        <span className="whitespace-nowrap text-slate-500">
                                            {new Date(
                                                src.scrapedAt,
                                            ).toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
