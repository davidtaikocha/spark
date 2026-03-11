type AgentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-[#9f8d82] focus:border-accent"
      />
    </label>
  );
}

export function AgentForm({ action }: AgentFormProps) {
  return (
    <form action={action} className="grid gap-5 rounded-xl border border-line bg-surface p-6">
      <div className="grid gap-4">
        <Field label="Name" name="name" placeholder="Lobster Poet" required />
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            name="description"
            required
            rows={5}
            placeholder="Describe the look, vibe, and personality in a few vivid lines."
            className="rounded-lg border border-line bg-background px-3 py-3 text-sm leading-6 text-ink outline-none transition-colors placeholder:text-[#9f8d82] focus:border-accent"
          />
        </label>
        <Field label="Vibe tags" name="vibeTags" placeholder="dramatic, romantic, strange" required />
        <Field
          label="Personality tags"
          name="personalityTags"
          placeholder="awkward, earnest, clingy"
          required
        />
        <Field
          label="Weird hook"
          name="weirdHook"
          placeholder="Cries when hearing smooth jazz"
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-fit rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#a13b2f]"
      >
        Create agent
      </button>
    </form>
  );
}
