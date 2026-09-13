import { Link } from "@tanstack/react-router";
import { BRAND, CLOSING, NAV, TAGLINE } from "@/lib/adhud/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-3xl font-bold">{BRAND}</p>
          <p className="max-w-md text-sm leading-relaxed text-paper/75">{TAGLINE}</p>
          <p className="max-w-md font-display text-base leading-relaxed text-brass italic">{CLOSING}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-paper/50 uppercase">التنقّل</p>
            <ul className="space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-paper/80 transition-colors hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/join" className="text-paper/80 transition-colors hover:text-paper">
                  انضم
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-paper/50 uppercase">تنبيه</p>
            <p className="text-sm leading-relaxed text-paper/70">
              لا عائد مضمون. لا دين بفائدة. المنصّة أداة؛ الحِرفيّ هو المستفيد الأول. نحن في مرحلة التأسيس
              (تمويل ذاتي / دائرة مغلقة) وفق مسار التقنين.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-paper/45 sm:px-6">
          © {new Date().getFullYear()} {BRAND} — وثيقة تأسيسية حاكمة · النسخة الأولى (مسوّدة للاعتماد)
        </p>
      </div>
    </footer>
  );
}
