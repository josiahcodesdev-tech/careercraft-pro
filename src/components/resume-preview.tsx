import { Award, BriefcaseBusiness, GraduationCap, Mail, MapPin, Star } from "lucide-react";
import Image from "next/image";

export function ResumePreview() {
  return (
    <div className="relative mx-auto w-full max-w-[480px] pb-12 2xl:max-w-[560px] 2xl:pb-16">
      <div className="absolute -inset-8 -z-10 rounded-full bg-brand/10 blur-3xl" aria-hidden />
      <div className="grid min-h-[500px] grid-cols-[38%_62%] overflow-hidden rounded-[18px] bg-white shadow-[0_28px_80px_rgba(28,38,31,0.16)] ring-1 ring-black/5 sm:min-h-[520px] 2xl:min-h-[720px]">
        <aside className="bg-[#173f31] px-4 py-7 text-white sm:px-6 sm:py-8">
          <Image src="/images/amina-mutua-headshot.png" alt="Amina Mutua" width={96} height={96} priority className="mb-5 h-20 w-20 rounded-full border-4 border-white/20 object-cover sm:h-24 sm:w-24" />
          <h3 className="font-heading text-xl font-extrabold sm:text-2xl">Amina Mutua</h3>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f2c65f]">Product Operations Lead</p>
          <div className="mt-5 space-y-2 text-[8px] text-white/75"><p className="flex items-center gap-2"><Mail className="h-3 w-3" /> amina.mutua@gmail.com</p><p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Nairobi, Kenya</p><p>+254 712 345 678</p><p>linkedin.com/in/aminamutua</p></div>
          <SideSection title="Profile">Operations leader with 7+ years&apos; experience scaling digital products across East Africa. Skilled in process design, team leadership and data-led execution.</SideSection>
          <SideSection title="Languages"><div className="space-y-2.5">{[["English", 5], ["Kiswahili", 5], ["French", 3]].map(([language, level]) => <div key={language} className="flex items-center justify-between"><span>{language}</span><span className="flex gap-1">{Array.from({ length: 5 }).map((_, index) => <i key={index} className={`h-1.5 w-1.5 rounded-full ${index < Number(level) ? "bg-[#f2c65f]" : "bg-white/20"}`} />)}</span></div>)}</div></SideSection>
          <SideSection title="Awards"><p className="font-semibold text-white/90">Operations Excellence Award</p><p className="mt-1">Savannah Digital · 2023</p><p className="mt-3 font-semibold text-white/90">Women in Product Africa Fellow</p><p className="mt-1">2022 Cohort</p></SideSection>
        </aside>
        <div className="px-5 py-7 text-[#27352f] sm:px-7 sm:py-8">
          <MainSection icon={BriefcaseBusiness} title="Work experience">
            <Entry title="Product Operations Lead" meta="Savannah Digital · Jan 2022–Present | Nairobi" bullets={["Lead an 11-person delivery team across Kenya and Uganda.", "Redesigned onboarding workflows, cutting time-to-value by 32% and lifting customer retention by 18%.", "Introduced quarterly planning and performance dashboards used by four business units.", "Partner with product, sales and support leaders to turn customer insights into measurable improvements."]} />
            <Entry title="Senior Business Analyst" meta="Atlas Consulting · Aug 2018–Dec 2021 | Nairobi" bullets={["Delivered research and customer insights for 14 transformation projects across financial services and technology.", "Built reporting models that reduced manual analysis time by 20 hours each month.", "Facilitated discovery workshops with senior stakeholders across East Africa."]} />
          </MainSection>
          <MainSection icon={GraduationCap} title="Education"><Entry title="MBA, Strategic Management" meta="United States International University–Africa · 2020–2022" /><Entry title="BSc. Business & Information Technology" meta="Strathmore University · 2014–2018" /></MainSection>
          <MainSection icon={Award} title="Skills"><ul className="space-y-2 text-[8px] leading-relaxed text-slate-600"><li>• Product operations and process optimisation</li><li>• Cross-functional leadership and stakeholder management</li><li>• Business intelligence, reporting and data analysis</li><li>• Customer experience strategy and service design</li></ul></MainSection>
        </div>
      </div>
      <div className="absolute -bottom-1 -left-2 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-xl sm:-left-10 sm:px-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2c65f] text-sm font-black text-[#173f31]">JK</div><div><p className="text-xs font-bold sm:text-sm">James K.</p><div className="mt-1 flex gap-0.5 text-[#e5a91b]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}</div></div></div></div>
      <div className="absolute -bottom-8 right-0 max-w-[245px] rounded-2xl border border-black/5 bg-white p-4 text-[10px] leading-relaxed text-text-secondary shadow-xl sm:-right-8 sm:text-xs">“I started getting interview calls within two weeks. My CV finally tells my story.”</div>
    </div>
  );
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-7"><h4 className="mb-3 border-b border-white/20 pb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#f2c65f]">{title}</h4><div className="text-[8px] leading-relaxed text-white/70">{children}</div></section>; }
function MainSection({ icon: Icon, title, children }: { icon: typeof BriefcaseBusiness; title: string; children: React.ReactNode }) { return <section className="mb-7"><div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-2 text-[#173f31]"><Icon className="h-3.5 w-3.5" /><h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em]">{title}</h4></div>{children}</section>; }
function Entry({ title, meta, bullets }: { title: string; meta: string; bullets?: string[] }) { return <div className="mb-5"><p className="text-[10px] font-extrabold sm:text-xs">{title}</p><p className="mt-0.5 text-[8px] font-semibold text-brand">{meta}</p>{bullets && <ul className="mt-2 space-y-1 text-[8px] leading-relaxed text-slate-500">{bullets.map((bullet) => <li key={bullet} className="flex gap-1"><span>•</span><span>{bullet}</span></li>)}</ul>}</div>; }
