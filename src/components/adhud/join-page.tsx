import { useState, type FormEvent } from "react";
import { SiteShell } from "@/components/adhud/site-shell";
import { PageHero, Section, SectionHeading } from "@/components/adhud/ui";

type Role = "craftsman" | "participant" | "";

export function JoinPage() {
  const [role, setRole] = useState<Role>("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role || !name.trim() || !contact.trim()) return;
    const subject = encodeURIComponent(`طلب انضمام عَضُد — ${role === "craftsman" ? "حِرفيّ" : "مشارك"}`);
    const body = encodeURIComponent(
      [
        `الدور: ${role === "craftsman" ? "حِرفيّ" : "مشارك"}`,
        `الاسم: ${name.trim()}`,
        `التواصل: ${contact.trim()}`,
        "",
        message.trim() || "(بدون تفاصيل إضافية)",
        "",
        "— أقرّ بأنني قرأت أن العائد غير مضمون، وأن المرحلة الحالية تمويل ذاتي / دائرة مغلقة.",
      ].join("\n"),
    );
    window.location.href = `mailto:join@adhud.xyz?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <SiteShell>
      <PageHero
        title="انضم إلى الدائرة"
        lead="لسنا في طرح عام. المرحلة الحالية: تمويل ذاتي من المؤسس، ثم دائرة مغلقة من أشخاص معروفين بعقود مكتوبة — بلا دعوة عامة وبلا وعد بأرباح."
      />

      <Section>
        <SectionHeading
          kicker="قبل أن تراسلنا"
          title="إقرارات ملزمة"
          lead="بالطلب، تقرّ بأنك قرأت مبادئ الدستور: لا ضمان ربح، لا حق إدارة للمنصّة من المساهمة، والشراكة لا الإقراض."
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            "لا عائد مضمون",
            "لا طرح عام في هذه المرحلة",
            "الحِرفيّ هو المستفيد الأول",
          ].map((t) => (
            <li key={t} className="rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm font-medium">
              {t}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted">
        <SectionHeading title="نموذج طلب" lead="يُفتح بريدك بصيغة جاهزة. لا يُجمع مال عبر هذا النموذج." />
        <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5 rounded-xl border border-border bg-bg p-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">الدور</legend>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ["craftsman", "حِرفيّ"],
                  ["participant", "مشارك"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-md border px-4 py-2 text-sm ${
                    role === value ? "border-ink bg-ink text-paper" : "border-border bg-surface text-fg"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    className="sr-only"
                    checked={role === value}
                    onChange={() => setRole(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">الاسم</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-fg outline-none ring-accent focus:ring-2"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">وسيلة تواصل (بريد أو هاتف)</span>
            <input
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-fg outline-none ring-accent focus:ring-2"
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">نبذة مختصرة</span>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="حرفتك أو نوع مساهمتك، ومدينتك…"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-fg outline-none ring-accent focus:ring-2"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink/90"
          >
            إرسال عبر البريد
          </button>
          {sent ? (
            <p className="text-center text-sm text-fg-muted">
              إن لم يُفتح بريدك، راسل مباشرة: join@adhud.xyz
            </p>
          ) : null}
        </form>
      </Section>
    </SiteShell>
  );
}
