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
        className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-muted/50 focus:border-rose/40 focus:shadow-[0_0_0_3px_rgba(212,105,138,0.1)]"
      />
    </label>
  );
}

export function AgentForm({ action }: AgentFormProps) {
  return (
    <form action={action} className="glass-card grid gap-5 rounded-2xl p-6">
      <div className="grid gap-4">
        <Field label="Name" name="name" placeholder="Lobster Poet" required />
        <label className="grid gap-2">
          <span className="text-sm font-medium text-ink">Description</span>
          <textarea
            name="description"
            required
            rows={5}
            placeholder="Describe the look, vibe, and personality in a few vivid lines."
            className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-ink outline-none transition-all placeholder:text-muted/50 focus:border-rose/40 focus:shadow-[0_0_0_3px_rgba(212,105,138,0.1)]"
          />
        </label>
        <Field
          label="Vibe tags"
          name="vibeTags"
          placeholder="dramatic, romantic, strange"
          required
        />
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
        className="inline-flex w-fit rounded-xl bg-gradient-to-r from-rose to-accent px-5 py-3 text-sm font-medium text-white transition-all duration-300 hover:shadow-[0_0_24px_rgba(212,105,138,0.3)]"
      >
        Create agent
      </button>
    </form>
  );
}
