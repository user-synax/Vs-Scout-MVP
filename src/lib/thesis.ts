import { ThesisTag } from "@/lib/types";

export interface FundThesis {
    id: string;
    name: string;
    focusTags: ThesisTag[];
    description: string;
    preferredStages: ("Pre-Seed" | "Seed" | "Series A")[];
    geographyBias?: string;
}

// Simple, hard-coded thesis to drive the signal engine.
export const DEFAULT_FUND_THESIS: FundThesis = {
    id: "core-fund-thesis",
    name: "AI-Enabled Vertical SaaS & Infra",
    focusTags: ["vertical_saas", "developer_tools", "ai_infrastructure", "applied_ai"],
    preferredStages: ["Pre-Seed", "Seed", "Series A"],
    geographyBias: "North America + Western Europe",
    description:
        "We invest in thesis-driven, AI-enabled vertical SaaS and infrastructure companies at pre-seed to Series A, with a bias for workflow depth, clear ROI, and strong bottoms-up adoption.",
};

