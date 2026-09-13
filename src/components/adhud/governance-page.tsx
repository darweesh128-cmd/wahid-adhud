import { SiteShell } from "@/components/adhud/site-shell";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/adhud/ui";
import { FOUNDER_LIMITS, FORTIFIED, PROHIBITIONS } from "@/lib/adhud/content";

export function GovernancePage() {
  return (
    <SiteShell>
      <PageHero
        title="الحوكمة والشفافية"
        lead="عَضُد مملوك بالكامل للمؤسس ملكية مفردة. السلطة أمانة مقيَّدة بقيود مكتوبة، وشفافية ملزمة، ومواد حصينة لا تُنقَض."
        actions={<CtaLink to="/constitution">المواد الحصينة في الدستور</CtaLink>}
      />

      <Section>
        <SectionHeading
          kicker="قيود المؤسس على نفسه"
          title="مقابل الثقة التامة"
          lead="التزاماً بأن السلطة أمانة — ولا يجوز نقض هذه القيود:"
        />
        <ol className="grid gap-3 sm:grid-cols-2">
          {FOUNDER_LIMITS.map((item, i) => (
            <li key={item} className="flex gap-3 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed">
              <span className="font-display text-lg font-bold text-accent">{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="muted">
        <SectionHeading kicker="التقارير" title="حق دائم لكل مشارك" />
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full min-w-[28rem] text-start text-sm">
            <thead className="bg-surface text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">التقرير</th>
                <th className="px-4 py-3 font-medium">الدورية</th>
                <th className="px-4 py-3 font-medium">الجمهور</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["موجز المشاريع والأثر", "ربع سنوي", "كل المشاركين"],
                ["كشف حساب المشارك", "نصف سنوي", "المشارك نفسه"],
                ["القوائم المالية المراجعة", "سنوي", "كل المشاركين"],
                ["تقرير الأثر السنوي", "سنوي", "عام"],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-t border-border">
                  <td className="px-4 py-3">{a}</td>
                  <td className="px-4 py-3 text-fg-muted">{b}</td>
                  <td className="px-4 py-3 text-fg-muted">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-fg-muted">
          سجل عَضُد إلكتروني دائم: كل مشارك ومساهمة ونقطة ومشروع وصرف وتوزيع. غير قابل للحذف؛ التعديل بقيد مضاد
          موثّق. ثلاثة حسابات بنكية منفصلة على الأقل: وعاء التمويل، التشغيل، صندوق المخاطر.
        </p>
      </Section>

      <Section>
        <SectionHeading kicker="المواد الحصينة" title="لا تعديل ولا إلغاء — ولو من المؤسس" />
        <ul className="space-y-2">
          {FORTIFIED.map((item) => (
            <li key={item} className="rounded-md border border-border px-4 py-3 text-sm">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-fg-muted">من نقض واحدةً منها فقد نقض المشروع لا المادة.</p>
      </Section>

      <Section tone="ink">
        <SectionHeading light kicker="محظورات مطلقة" title="خطوط حمراء" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {PROHIBITIONS.map((item) => (
            <li key={item} className="rounded-lg border border-paper/15 bg-paper/5 px-4 py-3 text-sm text-paper/85">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          kicker="مسار التقنين"
          title="الجوهر لا الاسم"
          lead="استقبال أموال من الجمهور بغرض استثمارها نشاط منظَّم. لذلك: تمويل ذاتي → دائرة مغلقة بعقود صريحة → شركة شخص واحد يملكها المؤسس ١٠٠٪ فوقها قنوات مرخّصة → وقف اختياري للديمومة."
        />
        <CtaLink to="/join">نحن الآن في مرحلة التأسيس / الدائرة المغلقة</CtaLink>
      </Section>
    </SiteShell>
  );
}
