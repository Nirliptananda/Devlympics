import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { normalizeError } from "../api/errors.js";
import SkillChip from "./SkillChip.jsx";

export default function TagInput({ value = [], onChange, fetchSuggestions, placeholder, min, id, ariaDescribedBy, emoji = "" }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionError, setSuggestionError] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active || !input.trim()) {
      setSuggestions([]);
      setSuggestionError("");
      return undefined;
    }

    let current = true;
    const timeout = window.setTimeout(() => {
      fetchSuggestions(input.trim())
        .then((matches) => {
          if (current) {
            setSuggestions(matches.slice(0, 10));
            setSuggestionError("");
          }
        })
        .catch((error) => {
          if (current) setSuggestionError(normalizeError(error).detail);
        });
    }, 250);

    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [active, fetchSuggestions, input]);

  function addTag(rawValue) {
    const tag = rawValue.trim().slice(0, 60);
    if (!tag || value.some((item) => item.trim().toLowerCase() === tag.toLowerCase())) {
      setInput("");
      setSuggestions([]);
      return;
    }
    onChange([...value, tag]);
    setInput("");
    setSuggestions([]);
  }

  function removeTag(tagToRemove) {
    onChange(value.filter((tag) => tag !== tagToRemove));
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(input);
    } else if (event.key === "Backspace" && !input && value.length) {
      removeTag(value[value.length - 1]);
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setActive(false);
    }
  }

  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-3 py-2 focus-within:ring-4 focus-within:ring-sky/60">
        {value.map((tag) => (
          <span className="inline-flex items-center gap-1" key={tag}>
            <SkillChip label={tag} emoji={emoji} />
            <button
              className="rounded-full p-0.5 hover:bg-black/10"
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          id={id}
          className="min-w-[8rem] flex-1 border-0 bg-transparent text-sm outline-none focus:ring-0"
          type="text"
          value={input}
          placeholder={placeholder}
          maxLength={60}
          aria-label={placeholder}
          aria-describedby={ariaDescribedBy}
          aria-expanded={suggestions.length > 0}
          aria-autocomplete="list"
          onFocus={() => setActive(true)}
          onBlur={() => window.setTimeout(() => setActive(false), 120)}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      {suggestionError && <p className="mt-1 text-xs text-danger" role="status">{suggestionError}</p>}
      {suggestions.length > 0 && active && (
        <ul className="relative z-20 mt-1 max-h-48 overflow-auto rounded-xl border-[3px] border-ink bg-white py-1 shadow-pop-sm" role="listbox">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id ?? suggestion.name}>
              <button
                className="w-full px-3 py-2 text-left text-sm font-medium hover:bg-sun/40"
                type="button"
                role="option"
                aria-selected="false"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTag(suggestion.name)}
              >
                {suggestion.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {min && <p className="mt-1 text-xs text-gray-600">Add at least {min}.</p>}
    </div>
  );
}
