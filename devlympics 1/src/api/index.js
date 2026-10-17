import * as real from "./real.js";
import * as mock from "./mock.js";

const api = import.meta.env.VITE_USE_MOCKS === "true" ? mock : real;

export const {
  register,
  login,
  logout,
  getMe,
  getMyProfile,
  updateMyProfile,
  getProfile,
  getDisciplines,
  getExperienceLevels,
  searchSkills,
  searchInterests,
  getRecommendedProfiles,
  getRecommendedOpportunities,
  getPairOpportunities,
  listOpportunities,
  getOpportunity,
} = api;

export const usingMocks = import.meta.env.VITE_USE_MOCKS === "true";
