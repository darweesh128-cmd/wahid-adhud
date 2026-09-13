import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/adhud/site-shell";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/adhud/ui";
import {
  BRAND,
  LIFE_CYCLE,
  PRINCIPLES,
  SUCCESS_METRICS,
  TAGLINE,
} from "@/lib/adhud/content";

const VALUE_FLOW = [
  "مساهمات (مال / خبرة / عمل / عين / وصول / تزكية)",
  "وعاء التمويل ← يُغذى بـ ٢٥٪ من الأرباح",
  "مشروع حِرفيّ ← أرباح ← حصة المنصّة",
  "اقتطاع الأيلولة → ملكية للحِرفيّ (خلال ٧ سنوات)",
  "وعاء التوزيع → المشاركون بالنقاط",
  "خرّيج يُعضُد غيره ⟲",
] as const;

export function HomePage() {
  return (
    <SiteShell>
      <PageHero
        brand={BRAND}
        title={TAGLINE}
        lead="كيان تكافلي إنتاجي مملوك للمؤسس: نحوّل طاقة الحِرفيّ الماهر العاجز عن التمويل إلى مشروع قائم يملكه — بمساندة مشاركين يتقاسمون الأثر والعائد. المنصّة أداة، والحِرفيّ هو الغاية."
        actions={
          <>
            <CtaLink to="/craftsman">أنا حِرفيّ</CtaLink>
            <CtaLink to="/participant" variant="secondary">
              أريد أن أشارك
            </CtaLink>
            <CtaLink to="/constitution" variant="ghost">
              اقرأ الدستور
            </CtaLink>
          </>
        }
      />

      <Section>
        <SectionHeading
          kicker="الهوية"
          title="لسنا جمعية خيرية ولا صندوق تبرعات"
          lead="ولا شركة لتشغيل أموال الغير. عَضُد مشاركةٌ في الربح والخسارة، وملكيةٌ تؤول لصاحب الحرفة خلال سبع سنوات كحد أقصى."
        />
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              t: "للحِرفيّ",
              b: "رأس مال + دراسة واقعية + مرافقة + سوق + ملكية في النهاية. يُعامل شريكاً لا محتاجاً.",
            },
            {
              t: "للمشارك",
              b: "أثر حقيقي موثّق + عائد غير مضمون + شفافية ملزمة. وحدات ونقاط — بلا حق إدارة في المنصّة.",
            },
            {
              t: "للمجتمع",
              b: "أعمال صغيرة مستقلة، وتشغيل، وإحياء حِرف — لا طبقة معتمدة على المنح.",
            },
          ].map((item) => (
            <div key={item.t} className="border-s-2 border-accent ps-5">
              <h3 className="font-display text-xl font-bold text-fg">{item.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{item.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          kicker="المبادئ الحاكمة"
          title="مرجع تفسيري لكل عقد"
          lead="هذه المبادئ تحكم الدستور وكل ما يُبرم تحته."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <article key={p.title} className="reveal-card">
              <h3 className="font-display text-lg font-semibold text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading
          kicker="مساران"
          title="اختر دورك بوضوح"
          lead="كل تعارض يُفسَّر لصالح الحِرفيّ ما لم يترتب ظلم بيّن على المشاركين."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to="/craftsman"
            className="group rounded-xl border border-border bg-surface p-8 transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm font-medium text-accent">المادة ٥</p>
            <h3 className="mt-2 font-display text-2xl font-bold">للحِرفيّ الماهر</h3>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              إن كنت تتقن حرفتك وينقصك القارب — لا الفكرة وحدها — هنا مسار الاستكشاف حتى الأيلولة.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-ink group-hover:underline">
              اقرأ المسار ←
            </span>
          </Link>
          <Link
            to="/participant"
            className="group rounded-xl border border-border bg-surface p-8 transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm font-medium text-accent">الباب الرابع</p>
            <h3 className="mt-2 font-display text-2xl font-bold">للمشارك</h3>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              مال أو خبرة أو عمل أو عين أو وصول أو تزكية — تُترجم إلى وحدات عَضُد ونقاط. العائد غير مضمون.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-ink group-hover:underline">
              أنواع المساهمة ←
            </span>
          </Link>
        </div>
      </Section>

      <Section tone="ink">
        <SectionHeading
          light
          kicker="دورة القيمة"
          title="من المساهمة إلى ملكية الحِرفيّ"
          lead="وكل خرّيج يُشجَّع — دون إلزام — أن يعضد غيره. هذه الدورة التي يقوم عليها المشروع."
        />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_FLOW.map((step, i) => (
            <li key={step} className="rounded-lg border border-paper/15 bg-paper/5 p-5">
              <span className="font-display text-2xl text-brass">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 text-sm leading-relaxed text-paper/85">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <CtaLink to="/how" variant="secondary">
            كيف تعمل المشاركة المتناقصة
          </CtaLink>
        </div>
      </Section>

      <Section>
        <SectionHeading
          kicker="دورة حياة المشروع"
          title="سبع مراحل — من الميدان إلى الأيلولة"
        />
        <ol className="grid gap-4 md:grid-cols-2">
          {LIFE_CYCLE.map((s) => (
            <li key={s.n} className="flex gap-4 rounded-lg border border-border bg-bg/50 p-5">
              <span className="font-display text-3xl font-bold text-accent">{s.n}</span>
              <div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted">
        <SectionHeading kicker="مؤشرات النجاح" title="نقاس بالاستقلال لا بربح سنة" />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[28rem] text-start text-sm">
            <thead className="bg-surface text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">المؤشر</th>
                <th className="px-4 py-3 font-medium">القياس</th>
              </tr>
            </thead>
            <tbody>
              {SUCCESS_METRICS.map((row) => (
                <tr key={row.metric} className="border-t border-border">
                  <td className="px-4 py-3 text-fg">{row.metric}</td>
                  <td className="px-4 py-3 text-fg-muted">{row.measure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl border border-border bg-surface px-6 py-10 text-center sm:px-10">
          <p className="font-display text-2xl font-bold text-fg sm:text-3xl">نحن في مرحلة التأسيس</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
            تمويل ذاتي من المؤسس، ثم دائرة مغلقة من مشاركين معروفين شخصياً — بلا طرح عام وبلا وعود أرباح.
            المال الزائد بلا قدرة تشغيل هو أول أسباب انهيار هذه النماذج.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <CtaLink to="/join">طلب انضمام للدائرة</CtaLink>
            <CtaLink to="/governance" variant="secondary">
              الحوكمة والقيود
            </CtaLink>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
