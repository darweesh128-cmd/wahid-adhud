import { SiteShell } from "@/components/adhud/site-shell";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/adhud/ui";
import { CLOSING, CONSTITUTION_CHAPTERS, GLOSSARY } from "@/lib/adhud/content";

export function ConstitutionPage() {
  return (
    <SiteShell>
      <PageHero
        title="دستور مشروع عَضُد"
        lead="وثيقة تأسيسية حاكمة — النسخة الأولى (مسوّدة للاعتماد). يُسلَّم لكل مشارك وكل حِرفيّ قبل التعاقد."
        actions={<CtaLink to="/join">طلب انضمام بعد القراءة</CtaLink>}
      />

      <Section>
        <p className="max-w-3xl font-display text-xl leading-relaxed text-fg sm:text-2xl">
          «عَضُد»: من قولهم <em>عَضَدَ الرجلُ أخاه</em> أي شدّ من أزره وقوّاه، و<em>العضيد</em> المُعين الذي لا
          يُستغنى عنه.
        </p>
      </Section>

      {CONSTITUTION_CHAPTERS.map((chapter) => (
        <Section key={chapter.id} tone={chapter.id === "principles" ? "muted" : "default"} id={chapter.id}>
          <SectionHeading title={chapter.title} />
          <div className="space-y-6">
            {chapter.articles.map((article) => (
              <article key={article.id} className="border-s-2 border-accent/60 ps-5">
                <h3 className="font-display text-base font-semibold text-fg sm:text-lg">
                  <span className="text-accent">المادة {article.id}</span>
                  <span className="mx-2 text-fg-muted">—</span>
                  {article.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted sm:text-base">{article.body}</p>
              </article>
            ))}
          </div>
        </Section>
      ))}

      <Section tone="muted">
        <SectionHeading kicker="ملحق" title="مسرد" />
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full min-w-[24rem] text-start text-sm">
            <thead className="bg-surface text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">المصطلح</th>
                <th className="px-4 py-3 font-medium">المعنى</th>
              </tr>
            </thead>
            <tbody>
              {GLOSSARY.map((row) => (
                <tr key={row.term} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{row.term}</td>
                  <td className="px-4 py-3 text-fg-muted">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="ink">
        <p className="font-display text-center text-xl leading-relaxed text-brass sm:text-2xl">{CLOSING}</p>
      </Section>
    </SiteShell>
  );
}
