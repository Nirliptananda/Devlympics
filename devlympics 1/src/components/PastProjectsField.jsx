import { Plus, Trash2 } from "lucide-react";
import FormField from "./FormField.jsx";

export default function PastProjectsField({ value = [], onChange, errors = {} }) {
  function updateProject(index, key, fieldValue) {
    onChange(value.map((project, currentIndex) => currentIndex === index ? { ...project, [key]: fieldValue } : project));
  }

  function addProject() {
    onChange([...value, { title: "", description: "", link: "" }]);
  }

  function removeProject(index) {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="space-y-4">
      {value.map((project, index) => (
        <fieldset className="rounded-2xl border-[3px] border-ink bg-white p-4 shadow-pop-sm" key={index}>
          <legend className="sr-only">Past project {index + 1}</legend>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Project {index + 1}</h3>
            <button
              className="rounded-lg p-2 hover:bg-gray-100"
              type="button"
              aria-label={`Remove project ${index + 1}`}
              onClick={() => removeProject(index)}
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="space-y-4">
            <FormField label="Title" error={errors[`past_projects.${index}.title`]}>
              {(id, errorId) => (
                <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={project.title} aria-describedby={errorId} onChange={(event) => updateProject(index, "title", event.target.value)} />
              )}
            </FormField>
            <FormField label="Description" error={errors[`past_projects.${index}.description`]}>
              {(id, errorId) => (
                <textarea id={id} className="min-h-20 w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" value={project.description} aria-describedby={errorId} onChange={(event) => updateProject(index, "description", event.target.value)} />
              )}
            </FormField>
            <FormField label="Project link" optional error={errors[`past_projects.${index}.link`]}>
              {(id, errorId) => (
                <input id={id} className="w-full rounded-xl border-[3px] border-ink px-3 py-2.5 focus:ring-4 focus:ring-sky/60" type="url" value={project.link} aria-describedby={errorId} onChange={(event) => updateProject(index, "link", event.target.value)} />
              )}
            </FormField>
          </div>
        </fieldset>
      ))}
      <button className="inline-flex items-center gap-2 rounded-xl border-[3px] border-ink bg-white px-4 py-2 text-sm font-extrabold shadow-pop-sm hover:bg-sun" type="button" onClick={addProject}>
        <Plus size={16} /> Add project
      </button>
    </div>
  );
}
