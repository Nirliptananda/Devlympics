import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import * as api from "../api/index.js";
import { normalizeError } from "../api/errors.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import OpportunityCard from "../components/OpportunityCard.jsx";

const PAGE_SIZE = 3;
const types = [
  { value: "competition", label: "Competition" },
  { value: "hackathon", label: "Hackathon" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];
function OpportunitySkeletons() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading opportunities">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="skeleton-shimmer min-h-72 rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop-sm" key={index}>
          <div className="h-5 w-1/3 rounded-full bg-pink/40" />
          <div className="mt-5 h-6 w-4/5 rounded bg-sky/40" />
          <div className="mt-5 h-4 w-full rounded bg-mist" />
          <div className="mt-2 h-4 w-5/6 rounded bg-mist" />
          <div className="mt-6 h-8 w-1/2 rounded-full bg-spark/50" />
        </div>
      ))}
    </div>
  );
}

export default function OpportunitiesPage() {
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("");
  const [source, setSource] = useState("");
  const [sources, setSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [sourcesError, setSourcesError] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const sourceRequestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadOpportunities = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const response = await api.listOpportunities({
        type,
        source,
        search: debouncedSearch,
        page,
        page_size: PAGE_SIZE,
      });
      if (currentRequest === requestId.current) setResult(response);
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(normalizeError(requestError).detail);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, page, source, type]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const loadSources = useCallback(async () => {
    const currentRequest = ++sourceRequestId.current;
    setSourcesLoading(true);
    setSourcesError("");
    try {
      const response = await api.listOpportunities({ page: 1, page_size: 50 });
      if (currentRequest === sourceRequestId.current) {
        setSources([...new Set(response.results.map((opportunity) => opportunity.source).filter(Boolean))].sort());
      }
    } catch (requestError) {
      if (currentRequest === sourceRequestId.current) setSourcesError(normalizeError(requestError).detail);
    } finally {
      if (currentRequest === sourceRequestId.current) setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useEffect(() => {
    document.title = "Opportunities | Sparkmatch";
    return () => { document.title = "Sparkmatch"; };
  }, []);

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
      <header className="mb-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-violet">Find your next challenge</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Opportunities</h1>
        <p className="mt-3 max-w-2xl leading-7 text-gray-700">Browse competitions, hackathons and projects that bring ideas to life.</p>
      </header>

      <section className="mb-8 grid gap-4 rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop sm:grid-cols-2 lg:grid-cols-3" aria-label="Opportunity filters">
        <label className="text-sm font-semibold" htmlFor="opportunity-search">
          Search
          <span className="relative mt-1.5 block">
            <motion.span className="absolute left-3 top-1/2 -translate-y-1/2" animate={reduceMotion ? undefined : { rotate: [0, -12, 12, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}><Search className="text-ink" size={17} aria-hidden="true" /></motion.span>
            <input
              className="w-full rounded-xl border-[3px] border-ink bg-white py-2.5 pl-10 pr-3 font-normal focus:ring-4 focus:ring-sky/60"
              id="opportunity-search"
              type="search"
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="Search by title or description"
            />
          </span>
        </label>
        <div className="text-sm font-semibold sm:col-span-2 lg:col-span-1">
          <span>Type</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <button className={`rounded-full border-2 border-ink px-3 py-2 text-xs font-extrabold ${!type ? "bg-ink text-white" : "bg-white"}`} type="button" aria-pressed={!type} onClick={() => updateFilter(setType, "")}>All</button>
            {types.map((option, index) => <button className={`rounded-full border-2 border-ink px-3 py-2 text-xs font-extrabold ${type === option.value ? ["bg-orange", "bg-pink", "bg-sky", "bg-mist"][index] : "bg-white"}`} key={option.value} type="button" aria-pressed={type === option.value} onClick={() => updateFilter(setType, option.value)}>{option.label}</button>)}
          </div>
        </div>
        <label className="text-sm font-semibold" htmlFor="opportunity-source">
          Source
          <select
            className="mt-1.5 block w-full rounded-xl border-[3px] border-ink bg-white px-3 py-2.5 font-normal capitalize focus:ring-4 focus:ring-sky/60"
            id="opportunity-source"
            value={source}
            disabled={sourcesLoading}
            onChange={(event) => updateFilter(setSource, event.target.value)}
          >
            <option value="">All sources</option>
            {sources.map((option) => <option className="capitalize" key={option} value={option}>{option}</option>)}
          </select>
        </label>
        {sourcesError && <div className="sm:col-span-2 lg:col-span-3"><ErrorBanner message={sourcesError} onRetry={loadSources} /></div>}
      </section>

      <section aria-labelledby="opportunity-results-heading">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold" id="opportunity-results-heading">Browse opportunities</h2>
          {!loading && !error && <p className="text-sm text-gray-600">{result.count} found</p>}
        </div>
        {loading ? (
          <OpportunitySkeletons />
        ) : error ? (
          <ErrorBanner message={error} onRetry={loadOpportunities} />
        ) : result.results.length === 0 ? (
          <EmptyState title="No opportunities found" message="Try another search or adjust your filters." />
        ) : (
          <>
            <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
              {result.results.map((opportunity) => <motion.div key={opportunity.id} variants={{ hidden: { opacity: 0, y: reduceMotion ? 0 : 14 }, visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.12 : 0.25 } } }}><OpportunityCard item={opportunity} /></motion.div>)}
            </motion.div>
            {(result.previous || result.next) && (
              <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Opportunity pages">
                <button
                  className="rounded-xl border-[3px] border-ink bg-white px-5 py-2.5 font-extrabold shadow-pop-sm hover:bg-sun disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  disabled={!result.previous || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <button
                  className="rounded-xl border-[3px] border-ink bg-white px-5 py-2.5 font-extrabold shadow-pop-sm hover:bg-sun disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  disabled={!result.next || loading}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
