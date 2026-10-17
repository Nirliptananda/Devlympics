import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Github, Linkedin, LoaderCircle, Pencil, X } from "lucide-react";
import * as api from "../api/index.js";
import { normalizeError } from "../api/errors.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import FormField from "../components/FormField.jsx";
import Loader from "../components/Loader.jsx";
import PastProjectsField from "../components/PastProjectsField.jsx";
import SkillChip from "../components/SkillChip.jsx";
import TagInput from "../components/TagInput.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ClassCard from "../components/ClassCard.jsx";
import BadgeShelf from "../components/BadgeShelf.jsx";
import { getDisciplineStyle } from "../styles/disciplines.js";
import { PROFILE_XP_MAX, getProfileXp } from "../gamification/rules.js";
import { useGame } from "../gamification/GameContext.jsx";

const initialDraft = {
  full_name: "",
  discipline: "",
  experience_level: "",
  bio: "",
  experience_summary: "",
  skills: [],
  interests: [],
  past_projects: [],
  github_url: "",
  linkedin_url: "",
};

function toDraft(profile) {
  return {
    ...initialDraft,
    full_name: profile.full_name || "",
    discipline: profile.discipline || "",
    experience_level: profile.experience_level || "",
    bio: profile.bio || "",
    experience_summary: profile.experience_summary || "",
    skills: [...(profile.skills || [])],
    interests: [...(profile.interests || [])],
    past_projects: (profile.past_projects || []).map(({ title, description, link }) => ({ title, description, link: link || "" })),
    github_url: profile.github_url || "",
    linkedin_url: profile.linkedin_url || "",
  };
}

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function safeExternalUrl(value) {
  return isValidUrl(value) ? value : "";
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading profile">
      <div className="skeleton-shimmer h-48 rounded-2xl border-[3px] border-ink bg-white shadow-pop-sm" />
      <div className="skeleton-shimmer h-32 rounded-2xl border-[3px] border-ink bg-white shadow-pop-sm" />
      <div className="skeleton-shimmer h-40 rounded-2xl border-[3px] border-ink bg-white shadow-pop-sm" />
    </div>
  );
}

export default function MyProfilePage() {
  const { refreshProfile } = useAuth();
  const { level, celebrate } = useGame();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(initialDraft);
  const [disciplines, setDisciplines] = useState([]);
  const [experienceLevels, setExperienceLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [result, disciplineOptions, levelOptions] = await Promise.all([
        api.getMyProfile(),
        api.getDisciplines(),
        api.getExperienceLevels(),
      ]);
      setProfile(result);
      setDraft(toDraft(result));
      setDisciplines(disciplineOptions);
      setExperienceLevels(levelOptions);
    } catch (requestError) {
      setError(normalizeError(requestError).detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    document.title = "My Profile | Sparkmatch";
    return () => { document.title = "Sparkmatch"; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      if (field === "past_projects") {
        Object.keys(next).filter((key) => key.startsWith("past_projects.")).forEach((key) => delete next[key]);
      } else {
        delete next[field];
      }
      return next;
    });
    setError("");
  }

  function validateDraft() {
    const next = {};
    if (!draft.full_name.trim()) next.full_name = "Full name is required.";
    if (!draft.discipline) next.discipline = "Choose a discipline.";
    if (!draft.experience_level) next.experience_level = "Choose an experience level.";
    if (draft.skills.length < 2) next.skills = "Add at least 2 skills.";
    if (draft.interests.length < 1) next.interests = "Add at least 1 interest.";
    if (!draft.experience_summary.trim()) next.experience_summary = "Experience summary is required.";
    draft.past_projects.forEach((project, index) => {
      if (!project.title.trim()) next[`past_projects.${index}.title`] = "Project title is required.";
      if (!project.description.trim()) next[`past_projects.${index}.description`] = "Project description is required.";
      if (!isValidUrl(project.link.trim())) next[`past_projects.${index}.link`] = "Enter a valid URL.";
    });
    if (!isValidUrl(draft.github_url.trim())) next.github_url = "Enter a valid URL.";
    if (!isValidUrl(draft.linkedin_url.trim())) next.linkedin_url = "Enter a valid URL.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!validateDraft()) return;
    const wasComplete = getProfileXp(profile) >= PROFILE_XP_MAX;
    setSaving(true);
    setError("");
    setToast("");
    try {
      const payload = {
        full_name: draft.full_name.trim(),
        discipline: draft.discipline,
        experience_level: draft.experience_level,
        bio: draft.bio,
        experience_summary: draft.experience_summary.trim(),
        skills: draft.skills,
        interests: draft.interests,
        past_projects: draft.past_projects.map(({ title, description, link }) => ({ title, description, link })),
        github_url: draft.github_url.trim(),
        linkedin_url: draft.linkedin_url.trim(),
      };
      const updatedProfile = await api.updateMyProfile(payload);
      setProfile(updatedProfile);
      setDraft(toDraft(updatedProfile));
      await refreshProfile();
      setEditing(false);
      setToast("Profile updated");
      if (!wasComplete && getProfileXp(updatedProfile) >= PROFILE_XP_MAX) celebrate();
    } catch (requestError) {
      const normalized = normalizeError(requestError);
      setError(normalized.detail);
      setFieldErrors(normalized.fieldErrors);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDraft(toDraft(profile));
    setFieldErrors({});
    setError("");
    setEditing(false);
  }

  if (loading) {
    return <main className="mx-auto max-w-5xl px-5 py-10"><ProfileSkeleton /></main>;
  }

  if (!profile) {
    return <main className="mx-auto max-w-5xl px-5 py-10"><ErrorBanner message={error || "Profile could not be loaded."} onRetry={loadProfile} /></main>;
  }

  const disciplineLabel = disciplines.find((item) => item.value === profile.discipline)?.label || profile.discipline_label;
  const levelLabel = experienceLevels.find((item) => item.value === profile.experience_level)?.label || profile.experience_level;
  const profileXp = getProfileXp(profile);
  const completion = Math.min(100, Math.round((profileXp / PROFILE_XP_MAX) * 100));
  const disciplineStyle = getDisciplineStyle(profile.discipline);
  const ringStyle = { background: `conic-gradient(#70E000 ${completion}%, #E5E7EB ${completion}%)` };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-12">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em]">Your Sparkmatch profile</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">My profile</h1>
        </div>
        {!editing && (
          <button className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-5 py-2.5 font-extrabold shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-spark-dark active:translate-x-[3px] active:translate-y-[3px] active:shadow-none" type="button" onClick={() => { setDraft(toDraft(profile)); setFieldErrors({}); setError(""); setEditing(true); }}>
            <Pencil size={17} aria-hidden="true" /> Edit profile
          </button>
        )}
      </header>
      {toast && <p className="mb-5 rounded-xl border-[3px] border-ink bg-spark px-4 py-3 text-sm font-extrabold shadow-pop-sm" role="status">🎉 {toast}</p>}
      {error && <div className="mb-5"><ErrorBanner message={error} /></div>}

      <section className="mb-6 grid gap-5 rounded-[2rem] border-[3px] border-ink bg-white p-5 shadow-pop sm:grid-cols-[auto_1fr] sm:items-center sm:p-6" aria-label="Profile progress and badges">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-ink p-1" style={ringStyle} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion} aria-label="Profile completeness">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg font-extrabold">{completion}%</span>
          </div>
          <div>
            <p className="font-extrabold">Profile power</p><p className="text-sm">{profileXp}/{PROFILE_XP_MAX} XP</p>
            <p className="mt-1 font-bold">{level.emoji} {level.name}</p>
          </div>
        </div>
        <div><h2 className="mb-2 font-display text-lg font-extrabold">Badge shelf</h2><BadgeShelf compact /></div>
      </section>

      {editing ? (
        <form className="space-y-6" onSubmit={saveProfile} noValidate>
          <section className="rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="edit-about-heading">
            <h2 className="font-display text-xl font-extrabold" id="edit-about-heading">About you</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" error={fieldErrors.full_name}>
                {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={draft.full_name} aria-describedby={errorId} onChange={(event) => updateField("full_name", event.target.value)} />}
              </FormField>
              <FormField label="Discipline" error={fieldErrors.discipline} group>
                {(id, errorId) => <div id={id} className="grid grid-cols-2 gap-2" role="group" aria-labelledby={`${id}-label`} aria-describedby={errorId}>{disciplines.map((option) => { const style = getDisciplineStyle(option.value); return <ClassCard key={option.value} emoji={style.emoji} label={option.label} selected={draft.discipline === option.value} selectedClassName={`${style.bg} ${style.text}`} onClick={() => updateField("discipline", option.value)} />; })}</div>}
              </FormField>
              <FormField label="Experience level" error={fieldErrors.experience_level} group>
                {(id, errorId) => <div id={id} className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-labelledby={`${id}-label`} aria-describedby={errorId}>{experienceLevels.map((option) => <ClassCard key={option.value} emoji={{ beginner: "🌱", intermediate: "🔥", advanced: "🚀" }[option.value] || "✨"} label={option.label} selected={draft.experience_level === option.value} onClick={() => updateField("experience_level", option.value)} />)}</div>}
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Short bio" optional error={fieldErrors.bio}>
                  {(id, errorId) => <textarea id={id} className="min-h-24 w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={draft.bio} aria-describedby={errorId} onChange={(event) => updateField("bio", event.target.value)} />}
                </FormField>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="edit-skills-heading">
            <h2 className="font-display text-xl font-extrabold" id="edit-skills-heading">Skills and interests</h2>
            <div className="mt-5 space-y-4">
              <FormField label="Skills" error={fieldErrors.skills}>
                {(id, errorId) => <TagInput id={id} ariaDescribedBy={errorId} value={draft.skills} onChange={(value) => updateField("skills", value)} fetchSuggestions={api.searchSkills} placeholder="Type a skill and press Enter" min="2 skills" />}
              </FormField>
              <FormField label="Interests" error={fieldErrors.interests}>
                {(id, errorId) => <TagInput id={id} ariaDescribedBy={errorId} value={draft.interests} onChange={(value) => updateField("interests", value)} fetchSuggestions={api.searchInterests} placeholder="Type an interest and press Enter" min="1 interest" emoji="✨" />}
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8" aria-labelledby="edit-experience-heading">
            <h2 className="font-display text-xl font-extrabold" id="edit-experience-heading">Experience</h2>
            <div className="mt-5 space-y-4">
              <FormField label="Experience summary" error={fieldErrors.experience_summary}>
                {(id, errorId) => <textarea id={id} className="min-h-28 w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={draft.experience_summary} aria-describedby={errorId} onChange={(event) => updateField("experience_summary", event.target.value)} />}
              </FormField>
              <div>
                <p className="mb-2 text-sm font-semibold">Past projects <span className="font-normal text-gray-500">(optional)</span></p>
                <PastProjectsField value={draft.past_projects} onChange={(value) => updateField("past_projects", value)} errors={fieldErrors} />
              </div>
              <FormField label="GitHub URL" optional error={fieldErrors.github_url}>
                {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="url" value={draft.github_url} aria-describedby={errorId} onChange={(event) => updateField("github_url", event.target.value)} />}
              </FormField>
              <FormField label="LinkedIn URL" optional error={fieldErrors.linkedin_url}>
                {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="url" value={draft.linkedin_url} aria-describedby={errorId} onChange={(event) => updateField("linkedin_url", event.target.value)} />}
              </FormField>
            </div>
          </section>
          <div className="flex flex-wrap justify-end gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-5 py-2.5 font-extrabold shadow-pop-sm hover:bg-sun disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={cancelEdit} disabled={saving}>
              <X size={17} aria-hidden="true" /> Cancel
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-5 py-2.5 font-extrabold shadow-pop-sm hover:bg-spark-dark disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Check size={17} aria-hidden="true" />}
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[3px] border-ink ${disciplineStyle.bg} ${disciplineStyle.text} text-2xl font-extrabold shadow-pop-sm`}>
                {profile.full_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl font-extrabold">{profile.full_name}</h2>
                <p className="mt-1 text-gray-600">{profile.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${disciplineStyle.bg} ${disciplineStyle.text}`}>{disciplineStyle.emoji} {disciplineLabel}</span>
                  <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-bold">{levelLabel}</span>
                </div>
                {profile.bio && <p className="mt-4 leading-7 text-gray-700">{profile.bio}</p>}
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {safeExternalUrl(profile.github_url) && <a className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-3 py-2 text-sm font-bold shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-sun" href={profile.github_url} target="_blank" rel="noopener noreferrer"><Github size={16} /> GitHub <ExternalLink size={13} /></a>}
                  {safeExternalUrl(profile.linkedin_url) && <a className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-3 py-2 text-sm font-bold shadow-pop-sm transition hover:-translate-y-0.5 hover:bg-sun" href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"><Linkedin size={16} /> LinkedIn <ExternalLink size={13} /></a>}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8">
            <h2 className="font-display text-xl font-extrabold">Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">{profile.skills.map((skill) => <SkillChip key={skill} label={skill} />)}</div>
          </section>

          <section className="rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8">
            <h2 className="font-display text-xl font-extrabold">Interests</h2>
            <div className="mt-4 flex flex-wrap gap-2">{profile.interests.map((interest) => <SkillChip key={interest} label={interest} emoji="✨" />)}</div>
          </section>

          <section className="rounded-2xl border-[3px] border-ink bg-white p-6 shadow-pop sm:p-8">
            <h2 className="font-display text-xl font-extrabold">Experience</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-gray-700">{profile.experience_summary}</p>
          </section>

          {profile.past_projects.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-extrabold">Past projects</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {profile.past_projects.map((project) => (
                  <article className="rounded-2xl border-[3px] border-ink bg-white p-5 shadow-pop-sm" key={project.id ?? project.title}>
                    <h3 className="font-display font-extrabold">{project.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-700">{project.description}</p>
                    {safeExternalUrl(project.link) && <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline decoration-spark decoration-2 underline-offset-4" href={project.link} target="_blank" rel="noopener noreferrer">View project <ExternalLink size={14} /></a>}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
