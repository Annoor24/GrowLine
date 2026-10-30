import { Link } from "react-router-dom";
import Button from "../../components/Button.jsx";
import PublicLayout from "../../layouts/PublicLayout.jsx";

const MISSION = [
  { title: "Farm-level forecasts", text: "Rain, wind and humidity at the farm location." },
  { title: "Practical instructions", text: "Clear spray timing advice and confidence levels." },
  { title: "Accessible by SMS", text: "No smartphone or data plan needed to receive advice." },
];

const STEPS = [
  { title: "Read the weather", text: "GrowLine uses farm GPS coordinates to check weather conditions." },
  { title: "Turn data into advice", text: "Clear spray or wait instructions with a time window and confidence." },
  { title: "Send an SMS", text: "The farmer receives an actionable text on any SMS phone." },
  { title: "Support from agents", text: "Trusted agents help onboard farmers and collect feedback." },
];

const FARMER_STEPS = [
  { title: "About you", text: "Full name, SMS phone number, state, LGA, town or village and SMS language." },
  { title: "Mark your farm", text: "Stand near the centre of the farm, allow location access and confirm the GPS point." },
  { title: "Farm size", text: "Enter estimated plots, acres or hectares; add additional farms if needed." },
  { title: "Permission", text: "Agree to GrowLine using your details for farm weather advice, then submit." },
];

// DRAFT COPY: the Figma text for this section was too small to read; check with the designer.
const AGENT_DUTIES = [
  "Onboard farmers and mark their farms",
  "Explain the messages and support farmers' decisions",
  "Collect feedback on each advisory",
  "Raise issues with the GrowLine team",
];
const AGENT_RECEIVES = [
  "A dashboard for your farmers and farms",
  "Farm-specific spray advisories",
  "Training and support from GrowLine",
  "Tools to record farmer feedback",
];

const APPLY_STEPS = [
  { title: "Apply", text: "Submit an application with your background and farmer outreach." },
  { title: "Review", text: "GrowLine assesses eligibility and fit." },
  { title: "Contact", text: "Shortlisted applicants receive a call or email." },
  { title: "Access", text: "Approved applicants receive an agent login." },
];

const FAQS = [
  { q: "Do I need a smartphone to receive advice?", a: "No. A basic phone that receives SMS works. A smartphone with internet is needed for registration." },
  { q: "Why does GrowLine need my farm location?", a: "Weather differs from place to place. GPS helps GrowLine check conditions at your farm." },
  { q: "Can an agent register me?", a: "Yes. An approved extension agent can help you onboard." },
  { q: "Who can become an Extension Agent?", a: "Trusted farmers, cooperatives, NGO workers, government staff and other people who work with farmers." },
  { q: "Can I apply from outside Southwest Nigeria?", a: "The initial focus is Lagos, Ogun, Oyo, Osun, Ondo and Ekiti. Expansion eligibility needs confirmation." },
  { q: "Is there a fee or payment for agents?", a: "Fees, compensation and benefits must be confirmed by the GrowLine team before publication." },
];

// Stands in for the hero photo: the kind of SMS a farmer receives.
function SmsPreview() {
  return (
    <div className="sms-preview" aria-hidden="true">
      <div className="sms-phone">
        <div className="sms-phone-top">GrowLine</div>
        <div className="sms-bubble">
          GrowLine: SAFE TO SPRAY today 7am–10am at North Plot. Low rain chance, light wind. Confidence: HIGH.
        </div>
        <div className="sms-bubble">Reply 1 if this advice was accurate, 2 if not.</div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <PublicLayout>
      <section className="hero">
        <div className="public-inner hero-grid">
          <div className="hero-copy">
            <p className="eyebrow eyebrow-light">Weather intelligence for farmers</p>
            <h1>Farming with the weather, not against it.</h1>
            <p className="hero-text">
              GrowLine turns weather science into simple text messages that help tomato farmers know when to spray and
              when to wait.
            </p>
            <div className="row">
              <Button as={Link} to="/register" className="btn-lime">
                Register my farm →
              </Button>
              <Button as={Link} to="/apply" variant="secondary">
                Apply as an Extension Agent →
              </Button>
            </div>
          </div>
          <SmsPreview />
        </div>
      </section>

      <section id="about" className="public-section">
        <div className="public-inner">
          <p className="eyebrow">Our mission</p>
          <h2>Fewer lost harvests. More yield. For every farmer.</h2>
          <p className="section-text">
            Millions of smallholder farmers make important decisions without weather information they can actually use.
            GrowLine turns agro-meteorological data into practical advice delivered by SMS.
          </p>
          <div className="public-cards cols-3">
            {MISSION.map((item, index) => (
              <div key={item.title} className="public-card">
                <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section tinted">
        <div className="public-inner split">
          <div>
            <p className="eyebrow">Where we started</p>
            <h2>Tomatoes and the spray window</h2>
            <p className="section-text">
              Rain after spraying can wash chemicals away. Wind can carry spray off target. GrowLine helps farmers choose
              when to spray or wait.
            </p>
            <Button as={Link} to="/register">
              Register my farm
            </Button>
          </div>
          <div className="window-card">
            <strong>Today at North Plot</strong>
            <div className="window-row">
              <span>7am – 10am</span>
              <span className="pill pill-success">Safe to spray</span>
            </div>
            <div className="window-row">
              <span>11am – 3pm</span>
              <span className="pill pill-warning">Spray with caution</span>
            </div>
            <div className="window-row">
              <span>4pm – 7pm</span>
              <span className="pill pill-danger">Do not spray</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="public-section">
        <div className="public-inner">
          <p className="eyebrow">How it works</p>
          <h2>Four steps from forecast to farm.</h2>
          <div className="public-cards cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="public-card">
                <span className="step-badge">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section tinted">
        <div className="public-inner">
          <p className="eyebrow">Choose your path</p>
          <h2>Which one are you?</h2>
          <div className="public-cards cols-2">
            <div className="public-card">
              <h3>I am a farmer</h3>
              <p>I grow tomatoes and want spray advice by SMS. I can register myself or ask an agent to help.</p>
              <Button as={Link} to="/register">
                Register my farm
              </Button>
            </div>
            <div className="public-card">
              <h3>I work with farmers</h3>
              <p>I support farmers through a cooperative, NGO, government agency or community network.</p>
              <Button as={Link} to="/apply">
                Apply to join
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="farmers" className="public-section">
        <div className="public-inner">
          <p className="eyebrow">For farmers</p>
          <h2>Register your farm in about 3 minutes.</h2>
          <p className="section-text">
            Have your phone number ready. Use a smartphone with internet for this one-time registration, and complete the
            GPS step while physically at your farm.
          </p>
          <div className="public-card">
            <div className="public-cards cols-2 flat">
              {FARMER_STEPS.map((step, index) => (
                <div key={step.title}>
                  <h3>
                    {String(index + 1).padStart(2, "0")} · {step.title}
                  </h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
            <div>
              <Button as={Link} to="/register">
                Open farmer registration
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="agents" className="public-section tinted">
        <div className="public-inner split">
          <div>
            <p className="eyebrow">Extension agents</p>
            <h2>Help farmers farm better. Be the person they trust.</h2>
            <p className="section-text">
              Agents are trusted people in farming communities who help farmers join GrowLine and act on its advice.
            </p>
            <ul className="tick-list">
              {AGENT_DUTIES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="public-card">
            <h3>What agents receive</h3>
            <ul className="tick-list">
              {AGENT_RECEIVES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="public-section">
        <div className="public-inner">
          <p className="eyebrow">Joining GrowLine</p>
          <h2>Applications are reviewed before access is granted.</h2>
          <div className="public-cards cols-4">
            {APPLY_STEPS.map((step, index) => (
              <div key={step.title} className="public-card">
                <h3>
                  {index + 1}. {step.title}
                </h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Button as={Link} to="/apply">
              Apply to become an agent
            </Button>
          </div>
        </div>
      </section>

      <section id="faqs" className="public-section">
        <div className="public-inner">
          <p className="eyebrow">Frequently asked questions</p>
          <h2>Answers before you get started.</h2>
          <div className="faq-list">
            {FAQS.map((item) => (
              <div key={item.q} className="faq">
                <h3>{item.q}</h3>
                <p>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="closing">
        <div className="public-inner">
          <h2>Be part of making farming less of a gamble.</h2>
          <p>Register your tomato farm or apply to support farmers as an Extension Agent.</p>
          <div className="row">
            <Button as={Link} to="/register" className="btn-lime">
              Register my farm
            </Button>
            <Button as={Link} to="/apply" variant="secondary">
              Apply as an agent
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
