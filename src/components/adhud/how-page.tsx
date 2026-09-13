import { SiteShell } from "@/components/adhud/site-shell";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/adhud/ui";
import { LAUNCH_PHASES, WATERFALL } from "@/lib/adhud/content";

export function HowPage() {
  return (
    <SiteShell>
      <PageHero
        title="كيف يعمل عَضُد"
        lead="مشاركة متناقصة: المنصّة تملك حصة رأس المال، والحِرفيّ يملك حصة العمل والمهارة، ويشتري حصة المنصّة تدريجياً من نصيبه في الأرباح حتى تؤول إليه كاملة."
        actions={<CtaLink to="/constitution">نص الدستور</CtaLink>}
      />

      <Section>
        <SectionHeading kicker="عقد الحِرفيّ" title="توزيع ربح المشروع (افتراضي)" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { t: "٥٠٪ للحِرفيّ", b: "تشغيلاً وربحاً لعمله — ويزيد سنة بعد سنة كلما تناقصت حصة المنصّة." },
            { t: "٣٠٪ ربح استثماري", b: "يذهب لوعاء التوزيع عبر حصة المنصّة." },
            { t: "٢٠٪ اقتطاع أيلولة", b: "يُخصم من قيمة حصة المنصّة حتى تنتقل الملكية." },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="font-display text-lg font-bold">{x.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{x.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          kicker="سقف حصين"
          title="الأيلولة ليست استرقاقاً مالياً"
          lead="قيمة الأيلولة = رأس المال المستثمر + التكاليف المباشرة. يجوز رفع سنوي بحد أقصى ٥٪. لا يتجاوز إجمالي ما يدفعه الحِرفيّ ضعف رأس المال الأصلي. الزيادة السوقية (شهرة، عملاء، توسّع) ملك للحِرفيّ وحده."
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "سبع سنوات من تاريخ التشغيل كحد أقصى",
            "إن سُدّد ٧٠٪ فأكثر ← تنتقل الملكية ويُجدول الباقي بلا زيادة (حتى ٣ سنوات)",
            "الخسارة يتحملها رأس المال؛ الحِرفيّ يخسر جهده — أصل المشاركة",
            "صندوق تكافل يغطي المرض والوفاة والحريق والكوارث وتقلبات السوق الحادة",
          ].map((t) => (
            <li key={t} className="rounded-lg border border-border bg-bg px-4 py-3 text-sm leading-relaxed">
              {t}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading kicker="شلّال التوزيع" title="أين تذهب أرباح المنصّة" />
        <div className="flex flex-col gap-3">
          {WATERFALL.map((w) => (
            <div
              key={w.label}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-5 py-4"
            >
              <div>
                <p className="font-medium text-fg">{w.label}</p>
                <p className="text-sm text-fg-muted">{w.goal}</p>
              </div>
              <p className="font-display text-2xl font-bold text-accent">{w.pct}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="ink">
        <SectionHeading light kicker="خطة الإطلاق" title="النمو بقدر القدرة التشغيلية" />
        <div className="grid gap-6 md:grid-cols-2">
          {LAUNCH_PHASES.map((phase) => (
            <article key={phase.title} className="rounded-lg border border-paper/15 bg-paper/5 p-5">
              <p className="text-sm text-brass">{phase.span}</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-paper">{phase.title}</h3>
              <ul className="mt-3 space-y-2 text-sm text-paper/75">
                {phase.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm leading-relaxed text-paper/70">
          قاعدة النمو: لا تُقبل مساهمات جديدة تفوق قدرة المشروع على الدراسة والتمويل والمتابعة. المال الزائد بلا
          قدرة تشغيل هو أول أسباب انهيار هذه النماذج.
        </p>
      </Section>
    </SiteShell>
  );
}
