export type FundingStage = "Pre-Seed" | "Seed" | "Series A" | "Series B+" | "Bootstrapped";

export type ThesisTag =
    | "vertical_saas"
    | "fintech_infra"
    | "climate"
    | "developer_tools"
    | "ai_infrastructure"
    | "applied_ai"
    | "marketplaces"
    | "future_of_work";

export interface Company {
    id: string;
    name: string;
    website: string;
    industry: string;
    stage: FundingStage;
    thesisTags: ThesisTag[];
    location: string;
    description: string;
    lastFundingRound?: {
        stage: FundingStage;
        amountMillions?: number;
        date?: string;
        leadInvestor?: string;
    };
    employeeCountRange?: string;
}

export interface RawEnrichmentPayload {
    summary: string;
    whatTheyDo: string[];
    keywords: string[];
    signals: string[];
    sources: {
        url: string;
        scrapedAt: string;
    }[];
}

export interface SignalEngineOutput {
    derivedSignals: string[];
    thesisMatchExplanation: string;
    score: number; // 0-100
}

export interface EnrichmentResult extends RawEnrichmentPayload, SignalEngineOutput {}

export interface SignalTimelineItem {
    id: string;
    type: "funding" | "hiring" | "product" | "press" | "enrichment";
    label: string;
    date: string;
    source?: string;
}

export interface CompanyList {
    id: string;
    name: string;
    createdAt: string;
    companyIds: string[];
}

export interface SavedSearch {
    id: string;
    name: string;
    query: string;
    industry?: string;
    stage?: FundingStage | "Any";
    tags?: ThesisTag[];
    createdAt: string;
}

