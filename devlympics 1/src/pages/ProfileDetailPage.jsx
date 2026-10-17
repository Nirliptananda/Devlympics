import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Github, Linkedin, Mail } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api/index.js";
import { normalizeError } from "../api/errors.js";
import EmptyState from "../components/EmptyState.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Loader from "../components/Loader.jsx";
import PairOpportunityCard from "../components/PairOpportunityCard.jsx";
import SkillChip from "../components/SkillChip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import VennSkills from "../components/VennSkills.jsx";
import { getDisciplineStyle } from "../styles/disciplines.js";
import { useGame } from "../gamification/GameContext.jsx";

function initialsFor(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isSelfProfileError(error) {
  return error?.response?.status === 400
    && error?.response?.data?.detail === "Cannot compare a profile with itself.";
}

function isValidExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function PairOpportunitySkeletons() {
  return (
    <div className="grid gap-5 md:grid-cols-2" aria-label="Loading pair opportunities">
      {[0, 1].map((index) => (
        <div className="skeleton-shimmer min-h-72 rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop-sm" key={index}>
          <div className="h-5 w-1/3 rounded bg-gray-200" />
          <div className="mt-5 h-6 w-4/5 rounded bg-gray-200" />
          <div className="mt-5 h-4 w-full rounded bg-gray-200" />
          <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
          <div className="mt-6 h-8 w-1/2 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function ProfileDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: currentProfile } = useAuth();
  const { trackProfileView } = useGame();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [pairItems, setPairItems] = useState([]);
  const [pairLoading, setPairLoading] = useState(true);
  const [pairError, setPairError] = useState("");

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const result = await api.getProfile(id);
      setProfile(result);
    } catch (error) {
      if (error?.response?.status === 400) {
        navigate("/me", { replace: true });
        return;
      }
      setProfileError({
        status: error?.response?.status,
        message: normalizeError(error).detail,
      });
    } finally {
      setProfileLoading(false);
    }
  }, [id, navigate]);

  const loadPairOpportunities = useCallback(async () => {
    setPairLoading(true);
    setPairError("");
    try {
      const result = await api.getPairOpportunities(id);
      setPairItems(result.results);
    } catch (error) {
      if (isSelfProfileError(error)) {
        navigate("/me", { replace: true });
        return;
      }
      setPairError(normalizeError(error).detail);
    } finally {
      setPairLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (currentProfile?.id !== undefined && Number(id) === Number(currentProfile.id)) {
      navigate("/me", { replace: true });
      return;
    }
    loadProfile();
    loadPairOpportunities();
  }, [currentProfile?.id, id, loadPairOpportunities, loadProfile, navigate]);

  useEffect(() => {
    if (profile) document.title = `${profile.full_name} | Sparkmatch`;
    return () => { document.title = "Sparkmatch"; };
  }, [profile]);

  useEffect(() => {
    if (profile) trackProfileView(profile);
  }, [profile, trackProfileView]);

  if (profileLoading) {
    return <main className="mx-auto max-w-5xl px-5 py-12"><Loader label="Loading profile" /></main>;
  }

  if (profileError?.status === 404) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12">
        <EmptyState
          title="Profile not found"
          message="This profile may have been removed or the link may be incorrect."
          action={<Link className="inline-flex items-center gap-2 rounded-lg bg-spark px-5 py-2.5 font-semibold hover:bg-spark-dark" to="/dashboard"><ArrowLeft size={16} /> Back to dashboard</Link>}
        />
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12">
        <ErrorBanner message={profileError.message} onRetry={loadProfile} />
      </main>
    );
  }

  if (!profile) return null;

  const disciplineStyle = getDisciplineStyle(profile.discipline);
  const firstName = profile.full_name.trim().split(/\s+/)[0];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-12">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold underline decoration-spark decoration-2 underline-offset-4" to="/dashboard">
        <ArrowLeft size={16} aria-hidden="true" /> Back to dashboard
      </Link>

      <section className={`relative overflow-hidden rounded-[2rem] border-[3px] border-ink p-6 shadow-pop sm:p-8 ${disciplineStyle.bg} ${disciplineStyle.text}`}>
        <div className="absolute inset-x-0 top-0 h-3 bg-ink" aria-hidden="true" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-white text-2xl font-extrabold shadow-pop-sm" aria-hidden="true">
            {initialsFor(profile.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{profile.full_name}</h1>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-extrabold text-ink">{disciplineStyle.emoji} {profile.discipline_label}</span>
              <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-extrabold capitalize text-ink">{profile.experience_level}</span>
            </div>
            {profile.bio && <p className="mt-4 max-w-3xl leading-7 text-gray-700">{profile.bio}</p>}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="contact-heading">
        <h2 className="font-display text-2xl font-extrabold" id="contact-heading">Contact</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {profile.email && (
            <a className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-4 py-2 font-bold text-ink shadow-pop-sm transition hover:-translate-y-0.5" href={`mailto:${profile.email}`}>
              <Mail size={17} aria-hidden="true" /> {profile.email}
            </a>
          )}
          {profile.github_url && isValidExternalUrl(profile.github_url) && (
            <a className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-4 py-2 font-bold text-ink shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-sun" href={profile.github_url} target="_blank" rel="noopener noreferrer">
              <Github size={17} aria-hidden="true" /> GitHub <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
          {profile.linkedin_url && isValidExternalUrl(profile.linkedin_url) && (
            <a className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-4 py-2 font-bold text-ink shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-sun" href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
              <Linkedin size={17} aria-hidden="true" /> LinkedIn <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="skills-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold" id="skills-heading">Skill overlap</h2>
          <p className="text-sm font-semibold text-gray-600">Shared powers glow green</p>
        </div>
        <div className="mt-5"><VennSkills yourSkills={currentProfile?.skills || []} theirSkills={profile.skills} yourName={currentProfile?.full_name?.split(/\s+/)[0] || "You"} theirName={firstName} /></div>
      </section>

      <section className="mt-6 rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="interests-heading">
        <h2 className="font-display text-2xl font-extrabold" id="interests-heading">Interests</h2>
        {profile.interests.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((interest) => <SkillChip key={interest} label={interest} emoji="✨" />)}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-600">No interests added yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="experience-heading">
        <h2 className="font-display text-2xl font-extrabold" id="experience-heading">Experience</h2>
        <p className="mt-3 whitespace-pre-line leading-7 text-gray-700">{profile.experience_summary}</p>
      </section>

      {profile.past_projects.length > 0 && (
        <section className="mt-6" aria-labelledby="projects-heading">
          <h2 className="font-display text-2xl font-extrabold" id="projects-heading">Past projects</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {profile.past_projects.map((project, index) => (
              <article className={`rounded-2xl border-[3px] border-ink p-5 shadow-pop-sm ${["bg-sun/40", "bg-sky/30", "bg-pink/25"][index % 3]}`} key={project.id}>
                <h3 className="font-display text-lg font-extrabold">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">{project.description}</p>
                {project.link && isValidExternalUrl(project.link) && (
                  <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline decoration-spark decoration-2 underline-offset-4" href={project.link} target="_blank" rel="noopener noreferrer">
                    View project <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="pair-opportunities-heading">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-extrabold tracking-tight" id="pair-opportunities-heading">Opportunities for you two</h2>
          <div className="mt-2 h-1.5 w-14 rounded-full bg-violet" />
        </div>
        {pairLoading ? (
          <PairOpportunitySkeletons />
        ) : pairError ? (
          <ErrorBanner message={pairError} onRetry={loadPairOpportunities} />
        ) : pairItems.length === 0 ? (
          <EmptyState title="No shared opportunities yet" message="No competitions found where you both are needed yet." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {pairItems.map((item) => <PairOpportunityCard item={item} viewer={currentProfile} person={profile} key={item.opportunity.id} />)}
          </div>
        )}
      </section>
    </main>
  );
}
