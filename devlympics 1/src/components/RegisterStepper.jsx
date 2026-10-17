import { useEffect, useState } from "react";
import * as api from "../api/index.js";
import { normalizeError } from "../api/errors.js";
import { useAuth } from "../context/AuthContext.jsx";
import ErrorBanner from "./ErrorBanner.jsx";
import FormField from "./FormField.jsx";
import PastProjectsField from "./PastProjectsField.jsx";
import TagInput from "./TagInput.jsx";
import ClassCard from "./ClassCard.jsx";
import { getDisciplineStyle } from "../styles/disciplines.js";
import Sparky from "./Sparky.jsx";
import { useGame } from "../gamification/GameContext.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const stepForField = {
  email: 1,
  password: 1,
  confirm_password: 1,
  full_name: 2,
  discipline: 2,
  experience_level: 2,
  bio: 2,
  skills: 3,
  interests: 3,
  experience_summary: 4,
  past_projects: 4,
  github_url: 4,
  linkedin_url: 4,
};
const initialValues = {
  email: "",
  password: "",
  confirm_password: "",
  full_name: "",
  discipline: "",
  experience_level: "",
  bio: "",
  skills: [],
  interests: [],
  experience_summary: "",
  past_projects: [],
  github_url: "",
  linkedin_url: "",
};

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function RegisterStepper() {
  const { registerUser } = useAuth();
  const { celebrate, showXp, setWelcomeName } = useGame();
  const [step, setStep] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [disciplines, setDisciplines] = useState([]);
  const [experienceLevels, setExperienceLevels] = useState([]);
  const [lookupError, setLookupError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.getDisciplines(), api.getExperienceLevels()])
      .then(([disciplineOptions, levelOptions]) => {
        if (!active) return;
        setDisciplines(disciplineOptions);
        setExperienceLevels(levelOptions);
      })
      .catch((error) => {
        if (active) setLookupError(normalizeError(error).detail);
      });
    return () => { active = false; };
  }, []);

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      if (field === "past_projects") {
        Object.keys(next).filter((key) => key.startsWith("past_projects.")).forEach((key) => delete next[key]);
      } else {
        delete next[field];
      }
      return next;
    });
    setMessage("");
  }

  function validateCurrentStep() {
    const nextErrors = {};
    if (step === 1) {
      if (!values.email.trim()) nextErrors.email = "Email is required.";
      else if (!emailPattern.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
      if (!values.password) nextErrors.password = "Password is required.";
      else if (values.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
      if (values.confirm_password !== values.password) nextErrors.confirm_password = "Passwords do not match.";
    } else if (step === 2) {
      if (!values.full_name.trim()) nextErrors.full_name = "Full name is required.";
      if (!values.discipline) nextErrors.discipline = "Choose a discipline.";
      if (!values.experience_level) nextErrors.experience_level = "Choose an experience level.";
    } else if (step === 3) {
      if (values.skills.length < 2) nextErrors.skills = "Add at least 2 skills.";
      if (values.interests.length < 1) nextErrors.interests = "Add at least 1 interest.";
    } else if (step === 4) {
      if (!values.experience_summary.trim()) nextErrors.experience_summary = "Experience summary is required.";
      values.past_projects.forEach((project, index) => {
        if (!project.title.trim()) nextErrors[`past_projects.${index}.title`] = "Project title is required.";
        if (!project.description.trim()) nextErrors[`past_projects.${index}.description`] = "Project description is required.";
        if (!isValidUrl(project.link.trim())) nextErrors[`past_projects.${index}.link`] = "Enter a valid URL.";
      });
      if (!isValidUrl(values.github_url.trim())) nextErrors.github_url = "Enter a valid URL.";
      if (!isValidUrl(values.linkedin_url.trim())) nextErrors.linkedin_url = "Enter a valid URL.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    if (validateCurrentStep()) {
      showXp(5);
      setStep((current) => Math.min(current + 1, 4));
      setMessage("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (step < 4) {
      goNext();
      return;
    }
    if (!validateCurrentStep()) return;
    setMessage("");
    setLoading(true);
    const payload = {
      email: values.email.trim(),
      password: values.password,
      full_name: values.full_name.trim(),
      discipline: values.discipline,
      experience_level: values.experience_level,
      bio: values.bio,
      experience_summary: values.experience_summary.trim(),
      skills: values.skills,
      interests: values.interests,
      past_projects: values.past_projects.map(({ title, description, link }) => ({ title, description, link })),
      github_url: values.github_url.trim(),
      linkedin_url: values.linkedin_url.trim(),
    };
    try {
      await registerUser(payload);
      celebrate();
      setWelcomeName(values.full_name.trim());
    } catch (error) {
      const normalized = normalizeError(error);
      setMessage(normalized.detail);
      setErrors(normalized.fieldErrors);
      const firstField = Object.keys(normalized.fieldErrors)[0];
      if (firstField) setStep(stepForField[firstField.split(".")[0]] || 1);
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = ["Create your hero", "Choose your class", "Pick your powers", "Show your quests"];

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-violet">Your hero quest</p>
            <p className="mt-1 font-display text-xl font-extrabold">{stepTitles[step - 1]}</p>
          </div>
          <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-extrabold">{step}/4</span>
        </div>
        <div className="relative grid grid-cols-4 gap-2" role="progressbar" aria-valuemin="1" aria-valuemax="4" aria-valuenow={step} aria-label={`Registration step ${step} of 4`}>
          <div className="absolute left-[12%] right-[12%] top-5 h-1 -translate-y-1/2 bg-mist" aria-hidden="true" />
          {stepTitles.map((title, index) => {
            const node = index + 1;
            return (
              <div className="relative z-10 flex flex-col items-center gap-1 text-center" key={title}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink font-extrabold ${node < step ? "bg-spark" : node === step ? "bg-sun motion-safe:animate-pulse" : "bg-white"}`} aria-label={`${title}${node < step ? ", completed" : node === step ? ", current" : ""}`}>
                  {node < step ? "✓" : node}
                </span>
                <span className="hidden text-[10px] font-bold leading-tight sm:block">{title}</span>
              </div>
            );
          })}
        </div>
      </div>
      {message && <ErrorBanner message={message} />}
      {lookupError && <ErrorBanner message={lookupError} />}

      {step === 1 && (
        <div className="space-y-4">
          <FormField label="Email" error={errors.email}>
            {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="email" autoComplete="email" value={values.email} aria-describedby={errorId} onChange={(event) => updateField("email", event.target.value)} />}
          </FormField>
          <FormField label="Password" error={errors.password}>
            {(id, errorId) => <><input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="password" autoComplete="new-password" value={values.password} aria-describedby={errorId} onChange={(event) => updateField("password", event.target.value)} /><div className="mt-2 flex gap-1" aria-label="Password strength"><span className={`h-2 flex-1 rounded-full ${values.password.length < 8 ? "bg-danger" : values.password.length < 12 ? "bg-orange" : "bg-spark"}`} /><span className={`h-2 flex-1 rounded-full ${values.password.length >= 8 ? values.password.length < 12 ? "bg-mist" : "bg-spark" : "bg-mist"}`} /><span className={`h-2 flex-1 rounded-full ${values.password.length >= 12 ? "bg-spark" : "bg-mist"}`} /></div><span className="text-xs font-semibold text-gray-600">{values.password.length >= 12 ? "Strong password" : values.password.length >= 8 ? "Getting stronger" : "Use at least 8 characters"}</span></>}
          </FormField>
          <FormField label="Confirm password" error={errors.confirm_password}>
            {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="password" autoComplete="new-password" value={values.confirm_password} aria-describedby={errorId} onChange={(event) => updateField("confirm_password", event.target.value)} />}
          </FormField>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <FormField label="Full name" error={errors.full_name}>
            {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" autoComplete="name" value={values.full_name} aria-describedby={errorId} onChange={(event) => updateField("full_name", event.target.value)} />}
          </FormField>
          <FormField label="Discipline" error={errors.discipline} group>
            {(id, errorId) => <div id={id} className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="group" aria-labelledby={`${id}-label`} aria-describedby={errorId}>{disciplines.map((option) => { const style = getDisciplineStyle(option.value); return <ClassCard key={option.value} emoji={style.emoji} label={option.label} selected={values.discipline === option.value} selectedClassName={`${style.bg} ${style.text}`} onClick={() => updateField("discipline", option.value)} />; })}</div>}
          </FormField>
          <FormField label="Experience level" error={errors.experience_level} group>
            {(id, errorId) => <div id={id} className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-labelledby={`${id}-label`} aria-describedby={errorId}>{experienceLevels.map((option) => <ClassCard key={option.value} emoji={{ beginner: "🌱", intermediate: "🔥", advanced: "🚀" }[option.value] || "✨"} label={option.label} selected={values.experience_level === option.value} onClick={() => updateField("experience_level", option.value)} />)}</div>}
          </FormField>
          <FormField label="Short bio" optional error={errors.bio}>
            {(id, errorId) => <textarea id={id} className="min-h-24 w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={values.bio} aria-describedby={errorId} onChange={(event) => updateField("bio", event.target.value)} />}
          </FormField>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <FormField label="Skills" error={errors.skills}>
            {(id, errorId) => <TagInput id={id} ariaDescribedBy={errorId} value={values.skills} onChange={(nextValue) => updateField("skills", nextValue)} fetchSuggestions={(query) => api.searchSkills(query)} placeholder="Type a skill and press Enter" min="2 skills" />}
          </FormField>
          <p className={`text-sm font-extrabold ${values.skills.length >= 2 ? "text-spark-dark" : "text-ink"}`}>{values.skills.length}/2 skills {values.skills.length >= 2 ? "✓" : "to unlock your matches"}</p>
          <FormField label="Interests" error={errors.interests}>
            {(id, errorId) => <TagInput id={id} ariaDescribedBy={errorId} value={values.interests} onChange={(nextValue) => updateField("interests", nextValue)} fetchSuggestions={(query) => api.searchInterests(query)} placeholder="Type an interest and press Enter" min="1 interest" emoji="✨" />}
          </FormField>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <FormField label="Experience summary" error={errors.experience_summary}>
            {(id, errorId) => <textarea id={id} className="min-h-24 w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={values.experience_summary} aria-describedby={errorId} onChange={(event) => updateField("experience_summary", event.target.value)} />}
          </FormField>
          <div>
            <p className="mb-2 text-sm font-semibold">Past projects <span className="font-normal text-gray-500">(optional)</span></p>
            <PastProjectsField value={values.past_projects} onChange={(nextValue) => updateField("past_projects", nextValue)} errors={errors} />
            {errors.past_projects && <p className="mt-1 text-sm text-danger">{errors.past_projects}</p>}
          </div>
          <FormField label="GitHub URL" optional error={errors.github_url}>
            {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="url" value={values.github_url} aria-describedby={errorId} onChange={(event) => updateField("github_url", event.target.value)} />}
          </FormField>
          <FormField label="LinkedIn URL" optional error={errors.linkedin_url}>
            {(id, errorId) => <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="url" value={values.linkedin_url} aria-describedby={errorId} onChange={(event) => updateField("linkedin_url", event.target.value)} />}
          </FormField>
        </div>
      )}

      <Sparky message={step === 1 ? "Your adventure starts with an account." : step === 2 ? "Choose the class that feels like you!" : step === 3 ? "Pick your powers to find your matches." : "Share your quests and show what you can build."} />

      <div className="flex items-center justify-between gap-3 border-t border-black/10 pt-4">
        <button className="rounded-xl border-[3px] border-ink bg-white px-5 py-2.5 font-extrabold shadow-pop-sm transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:bg-sun disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={step === 1 || loading} onClick={() => { setStep((current) => current - 1); setMessage(""); }}>
          Back
        </button>
        {step < 4 ? (
          <button className="rounded-xl border-[3px] border-ink bg-spark px-5 py-2.5 font-extrabold shadow-pop-sm transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:bg-spark-dark" type="button" onClick={goNext}>Next quest →</button>
        ) : (
          <button className="flex items-center gap-2 rounded-xl border-[3px] border-ink bg-spark px-5 py-2.5 font-extrabold shadow-pop-sm transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:bg-spark-dark disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={loading}>
            {loading && <span className="flex gap-1" aria-hidden="true"><i className="h-2 w-2 rounded-full bg-violet motion-safe:animate-bounce" /><i className="h-2 w-2 rounded-full bg-pink motion-safe:animate-bounce [animation-delay:100ms]" /><i className="h-2 w-2 rounded-full bg-sky motion-safe:animate-bounce [animation-delay:200ms]" /></span>}
            {loading ? "Creating account..." : "Create my account"}
          </button>
        )}
      </div>
    </form>
  );
}
