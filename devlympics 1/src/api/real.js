import client from "./client.js";

function queryString(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function register(payload) {
  return (await client.post("/auth/register/", payload)).data;
}

export async function login({ email, password }) {
  return (await client.post("/auth/login/", { email, password })).data;
}

export async function logout() {
  await client.post("/auth/logout/");
}

export async function getMe() {
  return (await client.get("/auth/me/")).data;
}

export async function getMyProfile() {
  return (await client.get("/profiles/me/")).data;
}

export async function updateMyProfile(partial) {
  return (await client.patch("/profiles/me/", partial)).data;
}

export async function getProfile(id) {
  return (await client.get(`/profiles/${encodeURIComponent(id)}/`)).data;
}

export async function getDisciplines() {
  return (await client.get("/meta/disciplines/")).data;
}

export async function getExperienceLevels() {
  return (await client.get("/meta/experience-levels/")).data;
}

export async function searchSkills(search, limit = 10) {
  return (await client.get(`/skills/${queryString({ search, limit })}`)).data;
}

export async function searchInterests(search, limit = 10) {
  return (await client.get(`/interests/${queryString({ search, limit })}`)).data;
}

export async function getRecommendedProfiles({ discipline, page, page_size } = {}) {
  return (await client.get(`/recommendations/profiles/${queryString({ discipline, page, page_size })}`)).data;
}

export async function getRecommendedOpportunities({ type, page, page_size } = {}) {
  return (await client.get(`/recommendations/opportunities/${queryString({ type, page, page_size })}`)).data;
}

export async function getPairOpportunities(profileId, { page, page_size } = {}) {
  const id = encodeURIComponent(profileId);
  return (await client.get(`/recommendations/pair/${id}/opportunities/${queryString({ page, page_size })}`)).data;
}

export async function listOpportunities({ type, source, skill, search, page, page_size } = {}) {
  return (await client.get(`/opportunities/${queryString({ type, source, skill, search, page, page_size })}`)).data;
}

export async function getOpportunity(id) {
  return (await client.get(`/opportunities/${encodeURIComponent(id)}/`)).data;
}
