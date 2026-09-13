import { SiteShell } from "@/components/adhud/site-shell";
import { CtaLink, PageHero, Section, SectionHeading } from "@/components/adhud/ui";
import { CONTRIBUTION_TYPES, DURATION_FACTORS, WATERFALL } from "@/lib/adhud/content";

export function ParticipantPage() {
  return (
    <SiteShell>
      <PageHero
        title="للمشارك"
        lead="المشارك من قبل المؤسس مساهمته ووقّع وثيقة الانضمام وقُيّد في سجل عَضُد. مساهمتك تنشئ حقاً في العائد — لا في ملكية المنصّة ولا في إدارتها ولا في الاعتراض على قراراتها."
        actions={
          <>
            <CtaLink to="/join">طلب انضمام للدائرة</CtaLink>
            <CtaLink to="/governance" variant="secondary">
              الشفافية والقيود
            </CtaLink>
          </>
        }
      />

      <Section>
        <SectionHeading
          kicker="تنبيه ملزم"
          title="لا ضمان للربح ولا لرأس المال"
          lead="العائد ممكن والخسارة واردة. من ضمن الربح فقد باع وهماً. لا عائد ثابت، ولا وعد بأرباح محددة في أي مادة تعريفية."
        />
      </Section>

      <Section tone="muted">
        <SectionHeading kicker="أنواع المساهمة" title="ست قنوات — تُترجم إلى وحدات عَضُد" />
        <div className="overflow-x-auto rounded-lg border border-border bg-bg">
          <table className="w-full min-w-[36rem] text-start text-sm">
            <thead className="bg-surface text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">الوصف</th>
                <th className="px-4 py-3 font-medium">مثال</th>
              </tr>
            </thead>
            <tbody>
              {CONTRIBUTION_TYPES.map((row) => (
                <tr key={row.type} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-fg">{row.type}</td>
                  <td className="px-4 py-3 text-fg-muted">{row.desc}</td>
                  <td className="px-4 py-3 text-fg-muted">{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeading
          kicker="النقاط"
          title="نقاط عَضُد = الوحدات × معامل المدة × معامل النوع"
          lead="معامل النوع ١٫٠ للمال والعين، و١٫١٥ للخبرة والعمل المستمر. حصتك من الموزَّع = (نقاطك ÷ مجموع النقاط) × وعاء التوزيع."
        />
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[20rem] text-start text-sm">
            <thead className="bg-surface text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">مدة بقاء المساهمة</th>
                <th className="px-4 py-3 font-medium">المعامل</th>
              </tr>
            </thead>
            <tbody>
              {DURATION_FACTORS.map((row) => (
                <tr key={row.span} className="border-t border-border">
                  <td className="px-4 py-3">{row.span}</td>
                  <td className="px-4 py-3 font-mono">{row.factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading
          kicker="شلّال التوزيع"
          title="من صافي الربح السنوي بعد المصروفات"
          lead="لا يُعدَّل الشلّال بأثر رجعي على سنة مالية بدأ توزيعها. لا توزيع في السنتين الأوليين."
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WATERFALL.map((w) => (
            <li key={w.label} className="rounded-lg border border-border bg-bg p-5">
              <p className="font-display text-2xl font-bold text-accent">{w.pct}</p>
              <p className="mt-1 font-medium text-fg">{w.label}</p>
              <p className="mt-1 text-sm text-fg-muted">{w.goal}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading kicker="حقوقك وواجباتك" title="شراكة واضحة الحدود" />
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-display text-lg font-semibold">حقوق</h3>
            <ul className="mt-3 space-y-2 text-sm text-fg-muted">
              <li>حصة من صافي الربح الموزَّع وفق النقاط</li>
              <li>الاطّلاع على التقارير والحساب الختامي</li>
              <li>معرفة المشاريع المموّلة ونتائجها</li>
              <li>الخروج بإشعار ١٨٠ يوماً ورد من صافي أصول الوعاء</li>
              <li>نسب الأثر في المشاريع التي نجحت في مدتك</li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold">واجبات</h3>
            <ul className="mt-3 space-y-2 text-sm text-fg-muted">
              <li>الصدق في مصدر المال وبيان الخبرة</li>
              <li>عدم التدخل في إدارة المنصّة أو اختيار مشاريعها</li>
              <li>حفظ أسرار المشاريع والمستفيدين</li>
              <li>عدم استخدام الصفة لمنفعة شخصية أو ترويج</li>
              <li>قبول أن العائد غير مضمون وأن الخسارة واردة</li>
            </ul>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
