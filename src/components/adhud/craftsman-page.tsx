import { SiteShell } from "@/components/adhud/site-shell";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/adhud/ui";
import { LIFE_CYCLE } from "@/lib/adhud/content";

export function CraftsmanPage() {
  return (
    <SiteShell>
      <PageHero
        title="للحِرفيّ الماهر"
        lead="المستفيد الأول من عَضُد هو الحِرفيّ. المنصّة أداة، والمشارك شريك في الأثر والعائد — وكل تعارض يُفسَّر لصالحك ما لم يترتب ظلم بيّن على المشاركين."
        actions={
          <>
            <CtaLink to="/join">قدّم طلباً للاستكشاف</CtaLink>
            <CtaLink to="/how" variant="secondary">
              المشاركة المتناقصة
            </CtaLink>
          </>
        }
      />

      <Section>
        <SectionHeading
          kicker="ماذا تحصل"
          title="رأس مال + دراسة + مرافقة + سوق + ملكية"
          lead="لست متبرَّعاً عليه. أنت شريك عمل ومهارة، وتشتري حصة المنصّة تدريجياً حتى تؤول إليك كاملة."
        />
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            "تمويل مرتبط بالإنجاز لا دفعة واحدة",
            "دخل معيشي معقول من أول يوم قبل احتساب الأرباح",
            "جدوى واقعية بثلاثة سيناريوهات — لا وردية",
            "مرافقة فنّية ومحاسبية وتدريب إدارة مالية",
            "أيلولة الملكية خلال سبع سنوات كحد أقصى",
            "سقف حصين: لا تدفع أكثر من ضعف رأس المال الأصلي",
          ].map((item) => (
            <li key={item} className="rounded-lg border border-border bg-surface/80 px-5 py-4 text-sm leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="muted">
        <SectionHeading kicker="المسار" title="سبع مراحل حتى الأيلولة" />
        <ol className="space-y-4">
          {LIFE_CYCLE.map((s) => (
            <li key={s.n} className="flex gap-4 border-s-2 border-accent ps-5">
              <span className="font-display text-2xl font-bold text-accent">{s.n}</span>
              <div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-fg-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <SectionHeading
          kicker="الكرامة"
          title="لا استعراض مذلّ"
          lead="يُمنع نشر اسمك أو صورتك أو تفاصيل حاجتك دون إذن خطّي منك. تُعامل شريكاً لا محتاجاً."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border p-6">
            <h3 className="font-display text-lg font-semibold">ما نبحث عنه</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              من يمارس حرفته فعلاً ويتقنها وينقصه رأس المال — لا من لديه فكرة فقط بلا مهارة مثبتة.
            </p>
          </div>
          <div className="rounded-xl border border-border p-6">
            <h3 className="font-display text-lg font-semibold">ما بعد الأيلولة</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              تبقى في شبكة عَضُد طوعاً: شراء وتسويق مشترك، وتشجيع — دون إلزام — على عضد غيرك مالاً أو تدريباً أو استيعاب متدرّب.
            </p>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
