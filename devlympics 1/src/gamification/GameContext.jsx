import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getEligibleBadgeIds, getLevel, getProfileXp, badgeDefinitions } from "./rules.js";
import { getDailyQuests } from "./quests.js";
import ConfettiBurst from "../components/ConfettiBurst.jsx";
import XPPop from "../components/XPPop.jsx";

const GameContext = createContext(null);

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function blankGame() {
  return {
    activityXp: 0,
    seenProfiles: [],
    seenOpportunities: [],
    todayProfiles: [],
    todayOpportunities: [],
    viewedDisciplines: [],
    streak: 0,
    lastVisit: "",
    questDate: localDateKey(),
    completedQuests: [],
    unlockedBadges: [],
    dreamTeamViewed: false,
  };
}

function readGame(profileId) {
  if (profileId === null || profileId === undefined) return blankGame();
  const key = `sparkmatch_game_${profileId}`;
  try {
    const serialized = window.localStorage.getItem(key);
    if (!serialized) return blankGame();
    const saved = JSON.parse(serialized);
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) throw new Error("Saved Sparkmatch progress has an invalid shape.");
    const defaults = blankGame();
    return {
      ...defaults,
      ...saved,
      activityXp: Number.isFinite(saved.activityXp) ? Math.max(0, saved.activityXp) : 0,
      streak: Number.isFinite(saved.streak) ? Math.max(0, saved.streak) : 0,
      seenProfiles: Array.isArray(saved.seenProfiles) ? saved.seenProfiles : [],
      seenOpportunities: Array.isArray(saved.seenOpportunities) ? saved.seenOpportunities : [],
      todayProfiles: Array.isArray(saved.todayProfiles) ? saved.todayProfiles : [],
      todayOpportunities: Array.isArray(saved.todayOpportunities) ? saved.todayOpportunities : [],
      viewedDisciplines: Array.isArray(saved.viewedDisciplines) ? saved.viewedDisciplines : [],
      completedQuests: Array.isArray(saved.completedQuests) ? saved.completedQuests : [],
      unlockedBadges: Array.isArray(saved.unlockedBadges) ? saved.unlockedBadges : [],
      dreamTeamViewed: Boolean(saved.dreamTeamViewed),
    };
  } catch (error) {
    console.error("Unable to load Sparkmatch game progress.", error);
    return blankGame();
  }
}

export function GameProvider({ children }) {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const storageKey = profileId === undefined || profileId === null ? null : `sparkmatch_game_${profileId}`;
  const [gameState, setGameState] = useState(() => ({ profileId, data: readGame(profileId) }));
  const game = gameState.profileId === profileId ? gameState.data : blankGame();
  const setGame = useCallback((updater) => {
    setGameState((current) => {
      const previous = current.profileId === profileId ? current.data : readGame(profileId);
      const data = typeof updater === "function" ? updater(previous) : updater;
      return { profileId, data };
    });
  }, [profileId]);
  const [xpPop, setXpPop] = useState(null);
  const [confettiId, setConfettiId] = useState(0);
  const [badgeNotice, setBadgeNotice] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const [welcomeName, setWelcomeName] = useState("");
  const [progressOpen, setProgressOpen] = useState(false);
  const previousLevel = useRef(null);
  const celebratedBadges = useRef(new Set());
  const rewardedQuests = useRef(new Set());
  const profileXp = getProfileXp(profile);
  const totalXp = profileXp + game.activityXp;
  const level = getLevel(totalXp);

  useEffect(() => {
    setGameState({ profileId, data: readGame(profileId) });
    previousLevel.current = null;
  }, [profileId]);

  useEffect(() => {
    if (!storageKey || gameState.profileId !== profileId) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(gameState.data));
    } catch (error) {
      console.error("Unable to save Sparkmatch game progress.", error);
    }
  }, [gameState, profileId, storageKey]);

  useEffect(() => {
    if (!xpPop) return undefined;
    const timeout = window.setTimeout(() => setXpPop(null), 1100);
    return () => window.clearTimeout(timeout);
  }, [xpPop]);

  useEffect(() => {
    if (profileId === undefined || profileId === null) return;
    if (gameState.profileId !== profileId) return;
    const today = localDateKey();
    if (game.lastVisit === today) return;
    setGame((current) => {
      if (current.lastVisit === today) return current;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const streak = current.lastVisit === localDateKey(yesterday) ? current.streak + 1 : 1;
      const reset = current.questDate !== today;
      return {
        ...current,
        activityXp: current.activityXp + 10,
        streak,
        lastVisit: today,
        questDate: today,
        completedQuests: reset ? [] : current.completedQuests,
        todayProfiles: reset ? [] : current.todayProfiles,
        todayOpportunities: reset ? [] : current.todayOpportunities,
      };
    });
    setXpPop({ id: Date.now(), amount: 10 });
  }, [profileId, game.lastVisit, gameState.profileId]);

  useEffect(() => {
    if (profileId === undefined || profileId === null || gameState.profileId !== profileId) return;
    const eligible = getEligibleBadgeIds(profile, game);
    const newlyUnlocked = eligible.filter((badgeId) => !game.unlockedBadges.includes(badgeId));
    if (!newlyUnlocked.length) return;
    setGame((current) => {
      const actualUnlocks = eligible.filter((badgeId) => !current.unlockedBadges.includes(badgeId));
      if (!actualUnlocks.length) return current;
      return {
        ...current,
        activityXp: current.activityXp + actualUnlocks.length * 10,
        unlockedBadges: [...new Set([...current.unlockedBadges, ...actualUnlocks])],
      };
    });
    const awaitingCelebration = newlyUnlocked.filter((badgeId) => {
      const key = `${profileId}:${badgeId}`;
      if (celebratedBadges.current.has(key)) return false;
      celebratedBadges.current.add(key);
      return true;
    });
    if (!awaitingCelebration.length) return;
    const badge = badgeDefinitions.find((item) => item.id === awaitingCelebration[0]);
    setBadgeNotice(badge);
    setXpPop({ id: Date.now(), amount: awaitingCelebration.length * 10 });
    setConfettiId((current) => current + 1);
  }, [game, gameState.profileId, profile, profileId]);

  useEffect(() => {
    if (gameState.profileId !== profileId) return;
    const newlyCompleted = getDailyQuests(profileXp, game)
      .filter((quest) => quest.complete && !game.completedQuests.includes(quest.id));
    if (!newlyCompleted.length) return;
    const awaitingReward = newlyCompleted.filter((quest) => {
      const key = `${profileId}:${game.questDate}:${quest.id}`;
      if (rewardedQuests.current.has(key)) return false;
      rewardedQuests.current.add(key);
      return true;
    });
    if (!awaitingReward.length) return;
    setGame((current) => {
      const actual = getDailyQuests(profileXp, current)
        .filter((quest) => quest.complete && !current.completedQuests.includes(quest.id));
      if (!actual.length) return current;
      return {
        ...current,
        activityXp: current.activityXp + actual.length * 20,
        completedQuests: [...new Set([...current.completedQuests, ...actual.map((quest) => quest.id)])],
      };
    });
    setXpPop({ id: Date.now(), amount: awaitingReward.length * 20 });
  }, [game, gameState.profileId, profileId, profileXp]);

  useEffect(() => {
    if (gameState.profileId !== profileId) {
      previousLevel.current = null;
      return;
    }
    const oldLevel = previousLevel.current;
    if (oldLevel !== null && level.level > oldLevel) {
      setLevelUp(level);
      setConfettiId((current) => current + 1);
    }
    previousLevel.current = level.level;
  }, [gameState.profileId, level, profileId]);

  const celebrate = useCallback(() => setConfettiId((current) => current + 1), []);
  const showXp = useCallback((amount) => setXpPop({ id: Date.now(), amount }), []);

  const trackProfileView = useCallback((viewedProfile) => {
    const id = viewedProfile?.id;
    if (id === undefined || id === null) return;
    const isNewEver = !game.seenProfiles.includes(id);
    const isNewToday = !game.todayProfiles.includes(id);
    if (!isNewEver && !isNewToday) return;
    setGame((current) => {
      const today = localDateKey();
      const questDate = current.questDate === today ? current : {
        ...current,
        questDate: today,
        completedQuests: [],
        todayProfiles: [],
        todayOpportunities: [],
      };
      const alreadySeen = questDate.seenProfiles.includes(id);
      if (questDate.todayProfiles.includes(id) && alreadySeen) return questDate;
      const next = {
        ...questDate,
        activityXp: questDate.activityXp + (alreadySeen ? 0 : 5),
        seenProfiles: alreadySeen ? questDate.seenProfiles : [...questDate.seenProfiles, id],
        todayProfiles: questDate.todayProfiles.includes(id) ? questDate.todayProfiles : [...questDate.todayProfiles, id],
      };
      if (viewedProfile.discipline && !next.viewedDisciplines.includes(viewedProfile.discipline)) {
        next.viewedDisciplines = [...next.viewedDisciplines, viewedProfile.discipline];
      }
      return next;
    });
    if (isNewEver) setXpPop({ id: Date.now(), amount: 5 });
  }, [game, setGame]);

  const trackOpportunity = useCallback((opportunityId) => {
    if (opportunityId === undefined || opportunityId === null) return;
    const isNewEver = !game.seenOpportunities.includes(opportunityId);
    const isNewToday = !game.todayOpportunities.includes(opportunityId);
    if (!isNewEver && !isNewToday) return;
    setGame((current) => {
      const today = localDateKey();
      const questDate = current.questDate === today ? current : {
        ...current,
        questDate: today,
        completedQuests: [],
        todayProfiles: [],
        todayOpportunities: [],
      };
      const alreadySeen = questDate.seenOpportunities.includes(opportunityId);
      if (questDate.todayOpportunities.includes(opportunityId) && alreadySeen) return questDate;
      return {
        ...questDate,
        activityXp: questDate.activityXp + (alreadySeen ? 0 : 5),
        seenOpportunities: alreadySeen ? questDate.seenOpportunities : [...questDate.seenOpportunities, opportunityId],
        todayOpportunities: questDate.todayOpportunities.includes(opportunityId) ? questDate.todayOpportunities : [...questDate.todayOpportunities, opportunityId],
      };
    });
    if (isNewEver) setXpPop({ id: Date.now(), amount: 5 });
  }, [game, setGame]);

  const trackPairOpportunity = useCallback((match_score) => {
    if (match_score !== 100) return;
    setGame((current) => current.dreamTeamViewed ? current : { ...current, dreamTeamViewed: true });
  }, []);

  const quests = useMemo(() => getDailyQuests(profileXp, game), [game, profileXp]);
  const value = useMemo(() => ({
    profileXp,
    totalXp,
    activityXp: game.activityXp,
    level,
    streak: game.streak,
    quests,
    unlockedBadges: game.unlockedBadges,
    badgeNotice,
    setBadgeNotice,
    levelUp,
    setLevelUp,
    welcomeName,
    setWelcomeName,
    progressOpen,
    setProgressOpen,
    xpPop,
    confettiId,
    celebrate,
    showXp,
    trackProfileView,
    trackOpportunity,
    trackPairOpportunity,
  }), [profileXp, totalXp, game, level, quests, badgeNotice, levelUp, welcomeName, progressOpen, xpPop, confettiId, celebrate, showXp, trackProfileView, trackOpportunity, trackPairOpportunity]);

  return (
    <GameContext.Provider value={value}>
      {children}
      <ConfettiBurst burstId={confettiId} />
      <XPPop event={xpPop} />
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
