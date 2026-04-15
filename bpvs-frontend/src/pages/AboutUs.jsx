import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import aboutData from "../static-data/aboutData.json";

const {
  termLabel,
  about: ABOUT_PARAGRAPHS,
  team: TEAM,
  pillars: PILLARS,
  mentor: MENTOR,
} = aboutData;

const HR = () => (
  <div className="w-full border-t border-gray-100 my-6 lg:my-7" />
);

// ── Shared content blocks (used in both layouts) ──────────────────────────────
const AboutText = () => (
  <section>
    <h2 className="text-base font-bold text-gray-900 mb-3 lg:text-base">
      About BPVS
    </h2>
    <div className="text-sm text-gray-700 leading-relaxed flex flex-col gap-4">
      {ABOUT_PARAGRAPHS.map((para, i) => (
        <p key={i}>
          {para.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </div>
  </section>
);

const TeamSection = () => (
  <section>
    <h2 className="font-bold text-gray-900 mb-4 tracking-wide text-sm">
      {termLabel}
    </h2>
    <div className="flex flex-col gap-4">
      {TEAM.map(({ role, name, location }) => (
        <div key={role}>
          <p className="text-[11px] font-bold text-gray-800 tracking-wide uppercase">
            {role} :
          </p>
          <p className="font-bold text-[#C94621] mt-0.5 leading-snug text-sm">
            {name}
          </p>
          <p className="text-[11.5px] text-gray-500 mt-0.5 font-medium tracking-wide">
            {location}
          </p>
        </div>
      ))}
    </div>
  </section>
);

const PillarsSection = () => (
  <section className="flex flex-col gap-5">
    {PILLARS.map(({ title, text }) => (
      <div key={title}>
        <p className="font-extrabold text-gray-900 mb-1 text-[13px]">{title}</p>
        <p className="text-[#C94621] font-semibold leading-relaxed text-[13px] lg:font-normal">
          {text}
        </p>
      </div>
    ))}
  </section>
);

const MentorSection = ({ maxW = "max-w-xs sm:max-w-sm" }) => (
  <section>
    <h2 className="font-bold text-gray-900 mb-4 text-base">Our Mentor</h2>
    <div className="flex justify-center items-center">
      <div
        className={`relative w-full overflow-hidden rounded-2xl aspect-3/4 max-w-120`}
      >
        <img
          src={MENTOR.image}
          alt="Mentor"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-4 py-4">
          <div className="bg-[#1A2D5A] text-white px-5 py-2.5 rounded-xl text-center">
            <p className="text-sm font-bold tracking-wide leading-snug">
              {MENTOR.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AboutBPVS() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white lg:bg-stone-50">
      {/* ── Sticky header — shared across all sizes ── */}
      <div
        className="sticky top-0 z-10 bg-white border-b border-stone-100
        flex items-center justify-center relative
        px-4 py-4 sm:px-8 sm:py-5 lg:px-8 lg:py-5"
      >
        <button className="absolute left-4 sm:left-8 p-1 text-gray-800">
          <ArrowLeft onClick={() => navigate(-1)} size={21} strokeWidth={2.2} />
        </button>
        <h1 className="text-[15px] sm:text-base lg:text-xl font-semibold lg:font-bold text-gray-900">
          About BPVS
        </h1>
      </div>

      {/* ══ MOBILE / TABLET (< lg) — single column stacked ══════════════════ */}
      <div className="lg:hidden w-full sm:max-w-2xl sm:mx-auto px-4 py-6 sm:px-8 sm:py-8 flex flex-col">
        <AboutText />
        <HR />
        <TeamSection />
        <HR />
        <PillarsSection />
        <HR />
        <MentorSection maxW="max-w-xs sm:max-w-sm" />
      </div>

      {/* ══ DESKTOP (lg+) — two-column card ══════════════════════════════════ */}
      <div className="hidden lg:block w-full max-w-337.5 mx-auto px-8 py-8">
        <div className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 gap-x-12 px-10 py-8 items-start divide-x divide-stone-100">
            {/* Left */}
            <div className="pr-10 flex flex-col">
              <AboutText />
              <HR />
              <TeamSection />
            </div>

            {/* Right */}
            <div className="pl-10 flex flex-col">
              <PillarsSection />
              <HR />
              <MentorSection maxW="max-w-[280px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
