import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import * as api from "../api/index.js";
import { normalizeError } from "../api/errors.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Loader from "../components/Loader.jsx";
import OpportunityCard from "../components/OpportunityCard.jsx";
import PersonCard from "../components/PersonCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getDisciplineStyle } from "../styles/disciplines.js";
import { useGame } from "../gamification/GameContext.jsx";
import { PROFILE_XP_MAX, getLevelProgress } from "../gamification/rules.js";
import QuestList from "../components/QuestList.jsx";
import BadgeShelf from "../components/BadgeShelf.jsx";

const PAGE_SIZE = 6;

function SectionSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading recommendations">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-shimmer min-h-64 rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop-sm" key={index}>
          <div className="h-10 w-2/3 rounded bg-gray-200" />
          <div className="mt-5 h-4 w-full rounded bg-gray-200" />
          <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />
          <div className="mt-6 h-8 w-1/2 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function RecommendationSection({ title, loading, error, items, emptyTitle, emptyMessage, onRetry, toolbar, children }) {
  return (
    <section className="mt-10" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight" id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>{title}</h2>
          <div className="mt-2 h-1.5 w-14 rounded-full bg-pink" />
        </div>
        {!loading && !error && items.length > 0 && <p className="text-sm text-gray-600">{items.length} recommended</p>}
      </div>
      {toolbar}
      {loading ? (
        <SectionSkeleton />
      ) : error ? (
        <ErrorBanner message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        children
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const { profileXp, totalXp, level, streak } = useGame();
  const [questsOpen, setQuestsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const [disciplines, setDisciplines] = useState([]);
  const [discipline, setDiscipline] = useState("");
  const [disciplinesError, setDisciplinesError] = useState("");
  const [people, setPeople] = useState([]);
  const [peopleNext, setPeopleNext] = useState(null);
  const [peoplePage, setPeoplePage] = useState(1);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [peopleMoreLoading, setPeopleMoreLoading] = useState(false);
  const [peopleError, setPeopleError] = useState("");
  const [peopleMoreError, setPeopleMoreError] = useState("");
  const peopleRequestId = useRef(0);

  const [opportunities, setOpportunities] = useState([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true);
  const [opportunitiesError, setOpportunitiesError] = useState("");

  const loadDisciplines = useCallback(async () => {
    setDisciplinesError("");
    try {
      setDisciplines(await api.getDisciplines());
    } catch (error) {
      setDisciplinesError(normalizeError(error).detail);
    }
  }, []);

  const loadPeople = useCallback(async () => {
    const currentRequest = ++peopleRequestId.current;
    setPeopleLoading(true);
    setPeopleMoreLoading(false);
    setPeopleError("");
    try {
      const response = await api.getRecommendedProfiles({ discipline, page: 1, page_size: PAGE_SIZE });
      if (currentRequest === peopleRequestId.current) {
        setPeople(response.results);
        setPeopleNext(response.next);
        setPeoplePage(1);
        setPeopleMoreError("");
      }
    } catch (error) {
      if (currentRequest === peopleRequestId.current) setPeopleError(normalizeError(error).detail);
    } finally {
      if (currentRequest === peopleRequestId.current) setPeopleLoading(false);
    }
  }, [discipline]);

  const loadOpportunities = useCallback(async () => {
    setOpportunitiesLoading(true);
    setOpportunitiesError("");
    try {
      const response = await api.getRecommendedOpportunities({ page: 1, page_size: PAGE_SIZE });
      setOpportunities(response.results);
    } catch (error) {
      setOpportunitiesError(normalizeError(error).detail);
    } finally {
      setOpportunitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisciplines();
  }, [loadDisciplines]);

  useEffect(() => {
    loadPeople();
    loadOpportunities();
  }, [loadPeople, loadOpportunities]);

  async function loadMorePeople() {
    if (!peopleNext || peopleMoreLoading) return;
    const nextPage = peoplePage + 1;
    const currentRequest = ++peopleRequestId.current;
    setPeopleMoreLoading(true);
    setPeopleMoreError("");
    try {
      const response = await api.getRecommendedProfiles({ discipline, page: nextPage, page_size: PAGE_SIZE });
      if (currentRequest === peopleRequestId.current) {
        setPeople((current) => [...current, ...response.results]);
        setPeopleNext(response.next);
        setPeoplePage(nextPage);
      }
    } catch (error) {
      if (currentRequest === peopleRequestId.current) setPeopleMoreError(normalizeError(error).detail);
    } finally {
      if (currentRequest === peopleRequestId.current) setPeopleMoreLoading(false);
    }
  }

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
  const completion = Math.min(100, Math.round((profileXp / PROFILE_XP_MAX) * 100));
  const ringStyle = { background: `conic-gradient(#70E000 ${completion}%, #E5E7EB ${completion}%)` };

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
      <header className="relative overflow-hidden rounded-[2rem] border-[3px] border-ink bg-violet p-6 text-white shadow-pop sm:p-8">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-pink/50 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-ink">Your next great team starts here</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome, {firstName} {level.emoji}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/90">
              Here are people who complement your skills, and competitions you could win together.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="font-extrabold">{level.name} · {totalXp} XP</span>
              <span className="min-w-40 flex-1">
                <span className="mb-1 block text-xs font-bold">Next level</span>
                <span className="block h-3 overflow-hidden rounded-full border-2 border-ink bg-white"><span className="block h-full bg-spark" style={{ width: `${getLevelProgress(totalXp)}%` }} /></span>
              </span>
              <span className="rounded-full border-2 border-ink bg-orange px-3 py-1 font-extrabold text-ink">🔥 {streak} day streak</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-white p-3 text-ink shadow-pop-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-ink p-1" style={ringStyle} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion} aria-label="Profile completeness">
              <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-extrabold">{completion}%</span>
            </div>
            <div><p className="font-extrabold">Hero profile</p><p className="text-xs">{profileXp}/{PROFILE_XP_MAX} profile XP</p></div>
          </div>
        </div>
      </header>

      <div className="mt-6 rounded-2xl border-[3px] border-ink bg-white p-4 shadow-pop-sm lg:hidden">
        <button className="flex w-full items-center justify-between font-extrabold" type="button" aria-expanded={questsOpen} onClick={() => setQuestsOpen((open) => !open)}>
          <span>🗺️ Daily quests & badges</span><span>{questsOpen ? "−" : "+"}</span>
        </button>
        <div className={questsOpen ? "mt-4 block" : "hidden"}><QuestList compact /><h2 className="mb-2 mt-5 font-display text-lg font-extrabold">Badge preview</h2><BadgeShelf compact /></div>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <aside className="hidden rounded-2xl border-[3px] border-ink bg-cream p-4 shadow-pop-sm lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:block">
          <h2 className="mb-3 font-display text-xl font-extrabold">🗺️ Daily quests</h2>
          <QuestList compact />
          <h2 className="mb-3 mt-6 font-display text-xl font-extrabold">Badge preview</h2>
          <BadgeShelf compact />
        </aside>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
      <RecommendationSection
        title="People you should meet"
        loading={peopleLoading}
        error={peopleError}
        items={people}
        emptyTitle="No recommendations yet"
        emptyMessage="There aren’t any people recommendations to show right now. Check back soon."
        onRetry={loadPeople}
        toolbar={(
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="mr-1 self-center text-sm font-extrabold">Class filter:</span>
            <button className={`rounded-full border-2 border-ink px-3 py-1.5 text-sm font-extrabold transition hover:-translate-y-0.5 ${!discipline ? "bg-ink text-white" : "bg-white"}`} type="button" aria-pressed={!discipline} onClick={() => setDiscipline("")}>✨ All</button>
            {disciplines.map((option) => {
              const style = getDisciplineStyle(option.value);
              return <button className={`rounded-full border-2 border-ink px-3 py-1.5 text-sm font-extrabold transition hover:-translate-y-0.5 ${discipline === option.value ? `${style.bg} ${style.text} shadow-pop-sm` : "bg-white"}`} key={option.value} type="button" aria-pressed={discipline === option.value} onClick={() => setDiscipline(option.value)}>{style.emoji} {option.label}</button>;
            })}
            {disciplinesError && <div className="w-full"><ErrorBanner message={disciplinesError} onRetry={loadDisciplines} /></div>}
          </div>
        )}
      >
        <>
          <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            {people.map((item) => <motion.div key={item.profile.id} variants={{ hidden: { opacity: 0, y: reduceMotion ? 0 : 14 }, visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.12 : 0.25 } } }}><PersonCard item={item} /></motion.div>)}
          </motion.div>
          {peopleMoreError && <div className="mt-5"><ErrorBanner message={peopleMoreError} onRetry={loadMorePeople} /></div>}
          {peopleNext && (
            <div className="mt-6 text-center">
              <button
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl border-[3px] border-ink bg-sun px-5 py-2.5 font-extrabold shadow-pop-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={loadMorePeople}
                disabled={peopleMoreLoading}
              >
                {peopleMoreLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                {peopleMoreLoading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      </RecommendationSection>

      <RecommendationSection
        title="Opportunities for you"
        loading={opportunitiesLoading}
        error={opportunitiesError}
        items={opportunities}
        emptyTitle="No opportunities found"
        emptyMessage="There aren’t any matching opportunities right now. Check again later."
        onRetry={loadOpportunities}
      >
        <>
          <motion.div className="grid grid-cols-1 gap-5 md:grid-cols-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            {opportunities.map((item) => <motion.div key={item.opportunity.id} variants={{ hidden: { opacity: 0, y: reduceMotion ? 0 : 14 }, visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.12 : 0.25 } } }}><OpportunityCard item={item} /></motion.div>)}
          </motion.div>
          <div className="mt-6 text-center">
            <Link className="font-extrabold underline decoration-spark decoration-2 underline-offset-4 hover:decoration-ink" to="/opportunities">
              View all opportunities →
            </Link>
          </div>
        </>
      </RecommendationSection>
        </div>
      </div>
    </main>
  );
}
