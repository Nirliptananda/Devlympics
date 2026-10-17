const disciplineStyles = {
  hardware: { bg: "bg-orange", text: "text-ink", emoji: "🔧", label: "Hardware" },
  software: { bg: "bg-sky", text: "text-ink", emoji: "💻", label: "Software" },
  design: { bg: "bg-pink", text: "text-ink", emoji: "🎨", label: "Design" },
  business: { bg: "bg-sun", text: "text-ink", emoji: "📈", label: "Business" },
  data_ai: { bg: "bg-violet", text: "text-white", emoji: "🧠", label: "Data & AI" },
  research: { bg: "bg-blue", text: "text-white", emoji: "🔬", label: "Research" },
  other: { bg: "bg-mist", text: "text-ink", emoji: "✨", label: "Other" },
};

export function getDisciplineStyle(value) {
  return disciplineStyles[value] || disciplineStyles.other;
}
