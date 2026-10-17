export const PROFILE_XP_MAX = 265;

export const levels = [
  { level: 1, name: "Spark Starter", emoji: "⚡", threshold: 0 },
  { level: 2, name: "Igniter", emoji: "🔥", threshold: 80 },
  { level: 3, name: "Flame", emoji: "🌟", threshold: 180 },
  { level: 4, name: "Blaze", emoji: "🚀", threshold: 300 },
  { level: 5, name: "Supernova", emoji: "💥", threshold: 450 },
];

export function getProfileXp(profile) {
  if (!profile) return 0;
  const skills = Math.min(profile.skills?.length || 0, 10) * 10;
  const interests = Math.min(profile.interests?.length || 0, 5) * 5;
  const bio = profile.bio?.trim() ? 15 : 0;
  const summary = profile.experience_summary?.trim() ? 20 : 0;
  const projects = Math.min(profile.past_projects?.length || 0, 3) * 25;
  const github = profile.github_url?.trim() ? 15 : 0;
  const linkedin = profile.linkedin_url?.trim() ? 15 : 0;
  return skills + interests + bio + summary + projects + github + linkedin;
}

export function getLevel(totalXp) {
  return [...levels].reverse().find((item) => totalXp >= item.threshold) || levels[0];
}

export function getNextLevel(totalXp) {
  return levels.find((item) => totalXp < item.threshold) || null;
}

export function getLevelProgress(totalXp) {
  const current = getLevel(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 100;
  return Math.min(100, ((totalXp - current.threshold) / (next.threshold - current.threshold)) * 100);
}

export const badgeDefinitions = [
  { id: "hello-world", name: "Hello World", emoji: "👋", hint: "Create your Sparkmatch account." },
  { id: "power-collector", name: "Power Collector", emoji: "🧩", hint: "Add at least 5 skills to your profile." },
  { id: "builder", name: "Builder", emoji: "🛠️", hint: "Add a past project to your profile." },
  { id: "networker", name: "Networker", emoji: "🔗", hint: "Add your GitHub or LinkedIn link." },
  { id: "bridge-builder", name: "Bridge Builder", emoji: "🌉", hint: "Explore people across 3 disciplines." },
  { id: "explorer", name: "Explorer", emoji: "🧭", hint: "Open 5 different opportunities." },
  { id: "dream-team", name: "Dream Team", emoji: "🏆", hint: "View a pair opportunity with a 100% match." },
  { id: "on-fire", name: "On Fire", emoji: "🔥", hint: "Visit Sparkmatch 3 days in a row." },
];

export function getEligibleBadgeIds(profile, game) {
  const unlocked = [];
  if (profile?.id !== undefined && profile?.id !== null) unlocked.push("hello-world");
  if ((profile?.skills?.length || 0) >= 5) unlocked.push("power-collector");
  if ((profile?.past_projects?.length || 0) > 0) unlocked.push("builder");
  if (profile?.github_url || profile?.linkedin_url) unlocked.push("networker");
  if ((game.viewedDisciplines?.length || 0) >= 3) unlocked.push("bridge-builder");
  if ((game.seenOpportunities?.length || 0) >= 5) unlocked.push("explorer");
  if (game.dreamTeamViewed) unlocked.push("dream-team");
  if ((game.streak || 0) >= 3) unlocked.push("on-fire");
  return unlocked;
}
