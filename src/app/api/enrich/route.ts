import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_FUND_THESIS } from "@/lib/thesis";
import type { EnrichmentResult, RawEnrichmentPayload, SignalEngineOutput } from "@/lib/types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function fetchWebsiteText(url: string): Promise<string> {
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "PrecisionScoutBot/1.0 (+https://example.com; contact: dev@example.com)",
            },
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch site: ${res.status}`);
        }
        const html = await res.text();
        const withoutScripts = html.replace(
            /<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi,
            "",
        );
        const text = withoutScripts
            .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        return text.slice(0, 20_000);
    } catch (err) {
        console.error("Error fetching website", err);
        throw new Error("Unable to fetch website content");
    }
}

async function callLlmForEnrichment(input: {
    name: string;
    description: string;
    websiteText: string;
    url: string;
}): Promise<RawEnrichmentPayload> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        // In development without a key, return a deterministic mock payload.
        const now = new Date().toISOString();
        return {
            summary: `${input.name} operates in a thesis-aligned space, based on mock enrichment data.`,
            whatTheyDo: [
                "Mocked: workflow software for a thesis-relevant vertical",
                "Mocked: leverages AI to automate repetitive operations",
            ],
            keywords: ["mock", "thesis-aligned", "vertical SaaS", "AI automation"],
            signals: [
                "Mock signal: clear vertical focus",
                "Mock signal: workflow depth",
                "Mock signal: AI-native product surface",
            ],
            sources: [
                {
                    url: input.url,
                    scrapedAt: now,
                },
            ],
        };
    }

    const prompt = `
You are helping a venture fund understand whether a company fits its thesis.

Company:
- Name: ${input.name}
- Existing description: ${input.description}

Website excerpt:
${input.websiteText.slice(0, 8000)}

Return a concise JSON object with the following shape (no extra keys, no comments):
{
  "summary": string (1-2 sentences describing the company in plain language),
  "whatTheyDo": string[] (3-5 bullets on product, customer, and workflow),
  "keywords": string[] (8-12 single or two-word phrases capturing vertical, buyer, product, and motion),
  "signals": string[] (5-8 notable signals for investors, like wedge, motion, buyers, or infra dependencies),
  "sources": [{ "url": string, "scrapedAt": string }]
}

Use the website excerpt when available. If information is missing, fall back to the existing description and be explicit about any assumptions. Keep language precise and concrete.
`;

    const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You structure company information for venture investors. Your outputs must be concise, concrete, and directly usable in a CRM.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.2,
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("OpenAI error", res.status, errText);
        throw new Error("LLM enrichment failed");
    }

    const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") {
        throw new Error("Unexpected LLM response shape");
    }

    let parsed: RawEnrichmentPayload;
    try {
        parsed = JSON.parse(raw) as RawEnrichmentPayload;
    } catch (err) {
        console.error("Failed to parse LLM JSON", err, raw.slice(0, 500));
        throw new Error("Failed to parse LLM output");
    }

    if (!parsed.sources || parsed.sources.length === 0) {
        parsed.sources = [
            {
                url: input.url,
                scrapedAt: new Date().toISOString(),
            },
        ];
    }

    return parsed;
}

function runSignalEngine(payload: RawEnrichmentPayload): SignalEngineOutput {
    const thesis = DEFAULT_FUND_THESIS;
    const text = [
        payload.summary,
        payload.whatTheyDo.join(" "),
        payload.keywords.join(" "),
        payload.signals.join(" "),
    ]
        .join(" ")
        .toLowerCase()
        .trim();

    let score = 40;
    const derivedSignals: string[] = [];

    const addScore = (delta: number, reason: string) => {
        score += delta;
        derivedSignals.push(reason);
    };

    if (thesis.focusTags.some((tag) => text.includes(tag.replace(/_/g, " ")))) {
        addScore(15, "Direct match to fund focus tags in content.");
    }

    const verticalWords = ["vertical", "industry-specific", "specialty", "sector"];
    if (verticalWords.some((w) => text.includes(w))) {
        addScore(10, "Language suggests strong vertical / workflow depth.");
    }

    const workflowWords = ["workflow", "back-office", "ops", "operations", "playbook"];
    if (workflowWords.some((w) => text.includes(w))) {
        addScore(10, "Product appears embedded in an operational workflow.");
    }

    const aiWords = ["ai", "machine learning", "ml", "copilot", "model", "llm"];
    const aiCount = aiWords.filter((w) => text.includes(w)).length;
    if (aiCount >= 2) {
        addScore(10, "Multiple references to AI-native product surface.");
    } else if (aiCount === 1) {
        addScore(5, "Some evidence of AI usage in the product.");
    }

    if (text.includes("api") || text.includes("developer") || text.includes("sdk")) {
        addScore(10, "Developer-first or infra-like motion inferred.");
    }

    const goToMarketWords = ["self-serve", "bottoms-up", "usage-based", "product-led"];
    if (goToMarketWords.some((w) => text.includes(w))) {
        addScore(10, "Signals of bottoms-up or product-led go-to-market.");
    }

    if (text.includes("on-prem") || text.includes("legacy")) {
        addScore(5, "Opportunity framed against legacy or on-prem incumbents.");
    }

    score = Math.max(0, Math.min(100, score));

    const thesisMatchExplanation = [
        "This score reflects simple, explainable rules:",
        "- Content overlap with the fund's focus areas (vertical SaaS, AI infra, applied AI).",
        "- Presence of workflow depth, developer/infra motion, and AI-native product signals.",
        "- Hints about go-to-market (self-serve, bottoms-up) and displacement of legacy systems.",
        "",
        "Use this as a directional thesis fit signal, not as an automated investment decision.",
    ].join(" ");

    return {
        derivedSignals,
        thesisMatchExplanation,
        score,
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            companyId?: string;
            website?: string;
            name?: string;
            description?: string;
        };

        if (!body.website || !body.name) {
            return NextResponse.json(
                { error: "Missing website or name" },
                { status: 400 },
            );
        }

        const websiteUrl = body.website.startsWith("http")
            ? body.website
            : `https://${body.website}`;

        let websiteText = "";
        try {
            websiteText = await fetchWebsiteText(websiteUrl);
        } catch (err) {
            // Some sites block bots or require JS; we still want the workflow to succeed.
            console.warn("Website fetch failed; falling back to description only.", err);
            websiteText = "";
        }

        const raw = await callLlmForEnrichment({
            name: body.name,
            description: body.description ?? "",
            websiteText,
            url: websiteUrl,
        });

        const engine = runSignalEngine(raw);

        const enrichment: EnrichmentResult = {
            ...raw,
            ...engine,
        };

        return NextResponse.json({ enrichment });
    } catch (err: unknown) {
        console.error("Enrichment error", err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Unexpected error running enrichment pipeline",
            },
            { status: 500 },
        );
    }
}

