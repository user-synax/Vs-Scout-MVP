export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-50">
          Precision AI Scout
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Translate your fund thesis into structured discovery workflows. Start from{" "}
          <span className="font-medium text-slate-200">Companies</span> to explore the mock
          universe, enrich profiles, and build explainable lists.
        </p>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
        Use the sidebar to navigate. The live enrichment workflow is available from each{" "}
        <span className="font-medium text-slate-50">company profile</span>.
      </div>
    </div>
  );
}
