import profiles from "../mocks/profiles.json";
import opportunities from "../mocks/opportunities.json";
import lookups from "../mocks/lookups.json";

const USERS_KEY = "sparkmatch_mock_users";
const MOCK_DELAY_MS = 300;

function profileSummary(profile) {
  const { id, full_name, discipline, discipline_label, experience_level, bio, skills, interests } = profile;
  return { id, full_name, discipline, discipline_label, experience_level, bio, skills, interests };
}

const recommendationFixtures = [
  {
    profile: profileSummary(profiles.find((profile) => profile.id === 12)),
    match_score: 64,
    shared_skills: ["C++", "Arduino"],
    complementary_skills: ["Python", "Django", "REST APIs"],
    shared_interests: ["Agritech"],
    reason: "You both know C++ and Arduino. They also bring Python, Django and REST APIs.",
  },
  {
    profile: profileSummary(profiles.find((profile) => profile.id === 21)),
    match_score: 63,
    shared_skills: ["Arduino"],
    complementary_skills: ["Python", "Machine Learning", "Data Analysis"],
    shared_interests: ["Agritech", "Sustainability"],
    reason: "You both know Arduino. They also bring Python, Machine Learning and Data Analysis.",
  },
  {
    profile: profileSummary(profiles.find((profile) => profile.id === 18)),
    match_score: 58,
    shared_skills: ["IoT"],
    complementary_skills: ["Figma", "UI/UX", "Prototyping"],
    shared_interests: ["Sustainability"],
    reason: "You both know IoT. They also bring Figma, UI/UX and Prototyping.",
  },
  {
    profile: profileSummary(profiles.find((profile) => profile.id === 15)),
    match_score: 58,
    shared_skills: ["IoT"],
    complementary_skills: ["Marketing", "Market Research", "Pitching"],
    shared_interests: ["Agritech"],
    reason: "You both know IoT. They also bring Marketing, Market Research and Pitching.",
  },
];

const opportunityRecommendations = [
  { opportunity: opportunities.find((item) => item.id === 2), match_score: 67, matched_skills: ["Arduino", "IoT"], missing_skills: ["Machine Learning"] },
  { opportunity: opportunities.find((item) => item.id === 3), match_score: 33, matched_skills: ["IoT"], missing_skills: ["Marketing", "Pitching"] },
  { opportunity: opportunities.find((item) => item.id === 1), match_score: 33, matched_skills: ["Arduino"], missing_skills: ["Python", "UI/UX"] },
  { opportunity: opportunities.find((item) => item.id === 4), match_score: 33, matched_skills: ["IoT"], missing_skills: ["Python", "Django"] },
];

const pairRecommendations = [
  { profile_id: 12, opportunity_id: 4, match_score: 100, you_cover: ["IoT"], they_cover: ["Python", "Django"], uncovered: [] },
  { profile_id: 12, opportunity_id: 1, match_score: 67, you_cover: ["Arduino"], they_cover: ["Python", "Arduino"], uncovered: ["UI/UX"] },
  { profile_id: 21, opportunity_id: 2, match_score: 100, you_cover: ["Arduino", "IoT"], they_cover: ["Arduino", "Machine Learning"], uncovered: [] },
  { profile_id: 18, opportunity_id: 1, match_score: 67, you_cover: ["Arduino"], they_cover: ["UI/UX"], uncovered: ["Python"] },
  { profile_id: 15, opportunity_id: 3, match_score: 100, you_cover: ["IoT"], they_cover: ["IoT", "Marketing", "Pitching"], uncovered: [] },
];

const clone = (value) => structuredClone(value);
const wait = () => new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));

function makeError(status, data) {
  const error = new Error(data.detail);
  error.response = { status, data };
  return error;
}

function readUsers() {
  const savedUsers = localStorage.getItem(USERS_KEY);
  if (savedUsers) return JSON.parse(savedUsers);
  const seededUsers = [{
    id: 7,
    email: "demo@sparkmatch.app",
    password: "Demo@1234",
    profile: profiles[0],
  }];
  localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
  return seededUsers;
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function userForToken() {
  const token = localStorage.getItem("sparkmatch_token");
  const match = token?.match(/^mock-token-(\d+)$/);
  const user = match && readUsers().find((entry) => entry.id === Number(match[1]));
  if (!user) throw makeError(401, { detail: "Invalid token." });
  return user;
}

function paginated(items, page = 1, pageSize = 10) {
  const count = items.length;
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    count,
    next: currentPage < pageCount ? `?page=${currentPage + 1}` : null,
    previous: currentPage > 1 ? `?page=${currentPage - 1}` : null,
    results: clone(items.slice(start, start + pageSize)),
  };
}

function profileForId(id) {
  const numericId = Number(id);
  const registered = readUsers().find((user) => user.id === numericId)?.profile;
  return profiles.find((profile) => profile.id === numericId) || registered;
}

function userResponse(user) {
  return {
    token: `mock-token-${user.id}`,
    user: { id: user.id, email: user.email },
    profile: clone(user.profile),
  };
}

export async function register(payload) {
  await wait();
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
    throw makeError(400, {
      detail: "Validation failed.",
      errors: { email: ["A user with this email already exists."] },
    });
  }

  const id = Math.max(99, ...users.map((user) => user.id)) + 1;
  const discipline = lookups.disciplines.find((item) => item.value === payload.discipline);
  const profile = {
    id,
    email: payload.email,
    full_name: payload.full_name,
    discipline: payload.discipline,
    discipline_label: discipline?.label || "",
    experience_level: payload.experience_level,
    bio: payload.bio || "",
    experience_summary: payload.experience_summary,
    skills: clone(payload.skills),
    interests: clone(payload.interests),
    past_projects: (payload.past_projects || []).map((project, index) => ({ id: index + 1, ...project })),
    github_url: payload.github_url || "",
    linkedin_url: payload.linkedin_url || "",
    created_at: new Date().toISOString(),
  };
  const user = { id, email: payload.email, password: payload.password, profile };
  writeUsers([...users, user]);
  return userResponse(user);
}

export async function login({ email, password }) {
  await wait();
  const user = readUsers().find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
  if (!user) throw makeError(401, { detail: "Invalid email or password." });
  return userResponse(user);
}

export async function logout() {
  await wait();
}

export async function getMe() {
  await wait();
  const user = userForToken();
  return { user: { id: user.id, email: user.email }, profile: clone(user.profile) };
}

export async function getMyProfile() {
  await wait();
  return clone(userForToken().profile);
}

export async function updateMyProfile(partial) {
  await wait();
  const currentUser = userForToken();
  const users = readUsers();
  const profileChanges = clone(partial);
  if (Array.isArray(profileChanges.past_projects)) {
    profileChanges.past_projects = profileChanges.past_projects.map((project, index) => ({
      ...project,
      id: index + 1,
    }));
  }
  if (profileChanges.discipline) {
    profileChanges.discipline_label = lookups.disciplines.find(
      (discipline) => discipline.value === profileChanges.discipline,
    )?.label || "";
  }
  const updatedUser = {
    ...currentUser,
    profile: { ...currentUser.profile, ...profileChanges },
  };
  writeUsers(users.map((user) => user.id === currentUser.id ? updatedUser : user));
  return clone(updatedUser.profile);
}

export async function getProfile(id) {
  await wait();
  const profile = profileForId(id);
  if (!profile) throw makeError(404, { detail: "Not found." });
  return clone(profile);
}

export async function getDisciplines() {
  await wait();
  return clone(lookups.disciplines);
}

export async function getExperienceLevels() {
  await wait();
  return clone(lookups.experience_levels);
}

export async function searchSkills(search = "", limit = 10) {
  await wait();
  const query = search.trim().toLowerCase();
  return clone(lookups.skills.filter((skill) => skill.name.toLowerCase().includes(query)).slice(0, limit));
}

export async function searchInterests(search = "", limit = 10) {
  await wait();
  const query = search.trim().toLowerCase();
  return clone(lookups.interests.filter((interest) => interest.name.toLowerCase().includes(query)).slice(0, limit));
}

export async function getRecommendedProfiles({ discipline, page = 1, page_size = 10 } = {}) {
  await wait();
  const results = recommendationFixtures.filter((item) => !discipline || item.profile.discipline === discipline);
  return paginated(results, page, page_size);
}

export async function getRecommendedOpportunities({ type, page = 1, page_size = 10 } = {}) {
  await wait();
  const results = opportunityRecommendations.filter((item) => !type || item.opportunity.type === type);
  return paginated(results, page, page_size);
}

export async function getPairOpportunities(profileId, { page = 1, page_size = 10 } = {}) {
  await wait();
  const currentUser = userForToken();
  if (Number(profileId) === currentUser.profile.id) {
    throw makeError(400, { detail: "Cannot compare a profile with itself." });
  }
  const results = pairRecommendations
    .filter((item) => item.profile_id === Number(profileId))
    .map(({ profile_id, opportunity_id, ...item }) => ({
      ...item,
      opportunity: opportunities.find((opportunity) => opportunity.id === opportunity_id),
    }));
  return paginated(results, page, page_size);
}

export async function listOpportunities({ type, source, skill, search, page = 1, page_size = 10 } = {}) {
  await wait();
  const query = search?.trim().toLowerCase();
  const skillQuery = skill?.trim().toLowerCase();
  const results = opportunities.filter((item) =>
    (!type || item.type === type)
    && (!source || item.source === source)
    && (!skillQuery || item.required_skills.some((name) => name.toLowerCase() === skillQuery))
    && (!query || `${item.title} ${item.description}`.toLowerCase().includes(query)),
  );
  return paginated(results, page, page_size);
}

export async function getOpportunity(id) {
  await wait();
  const opportunity = opportunities.find((item) => item.id === Number(id));
  if (!opportunity) throw makeError(404, { detail: "Not found." });
  return clone(opportunity);
}
