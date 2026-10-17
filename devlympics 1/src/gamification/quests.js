export function getDailyQuests(profileXp, game) {
  const peopleProgress = Math.min(game.todayProfiles?.length || 0, 3);
  const opportunityProgress = Math.min(game.todayOpportunities?.length || 0, 2);
  const profileComplete = profileXp >= 265;
  const profileProgress = profileComplete ? 1 : Math.min(99, Math.round((profileXp / 265) * 100));
  return [
    {
      id: "meet-people",
      title: "Meet 3 new people",
      emoji: "🧑‍🤝‍🧑",
      progress: peopleProgress,
      target: 3,
      complete: peopleProgress >= 3 || game.completedQuests?.includes("meet-people"),
    },
    {
      id: "scout-competitions",
      title: "Scout 2 competitions",
      emoji: "🏁",
      progress: opportunityProgress,
      target: 2,
      complete: opportunityProgress >= 2 || game.completedQuests?.includes("scout-competitions"),
    },
    {
      id: "level-profile",
      title: profileComplete ? "Profile maxed 🎉" : "Level up your profile",
      emoji: "✨",
      progress: profileComplete ? 1 : profileProgress,
      target: profileComplete ? 1 : 100,
      complete: profileComplete || game.completedQuests?.includes("level-profile"),
      percent: !profileComplete,
    },
  ];
}
