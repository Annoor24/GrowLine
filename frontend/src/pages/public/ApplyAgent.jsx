import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/index.js";
import Button from "../../components/Button.jsx";
import FormField from "../../components/FormField.jsx";
import PublicLayout from "../../layouts/PublicLayout.jsx";
import { isEmail, isNigerianPhone } from "../../utils/validate.js";
import StepTabs from "../../components/StepTabs.jsx";
import { STATES, choose } from "./options.js";

const STEPS = ["01 About you", "02 Your farmers", "03 Motivation and consent"];
const CONTACT_METHODS = ["Phone call", "SMS", "WhatsApp", "Email"];
const APPLYING_AS = ["Farmer", "Cooperative", "NGO", "Government", "Other"];
const REACH = ["Under 10", "10–30", "31–100", "Over 100"];
const TOMATO_SHARE = ["None", "A few", "About half", "Most"];
const EXPERIENCE = ["Under 1 year", "1–3 years", "4–10 years", "Over 10 years"];
const DEVICE = ["Yes", "No", "Sometimes"];

const HEADINGS = [
  { title: "Tell us about yourself.", text: "Applying does not create an account. GrowLine reviews applications before granting access." },
  { title: "Tell us about the farmers you reach.", text: "We want to understand your existing relationships with farmers." },
  { title: "Why do you want to join GrowLine?", text: "A short, honest explanation is enough. Our team will review your application." },
];

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  contactMethod: "",
  applyingAs: "",
  organisation: "",
  role: "",
  states: [],
  areas: "",
  reach: "",
  tomatoShare: "",
  experience: "",
  howReach: "",
  device: "",
  motivation: "",
  extra: "",
  confirmTrue: false,
  protectData: false,
};

function validate(step, form) {
  const e = {};
  if (step === 0) {
    if (!form.name.trim()) e.name = "Enter your full name.";
    if (!isNigerianPhone(form.phone)) e.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
    if (!isEmail(form.email)) e.email = "Enter a valid email address.";
    if (!form.contactMethod) e.contactMethod = "Choose how we should contact you.";
    if (!form.applyingAs) e.applyingAs = "Choose what you are applying as.";
  } else if (step === 1) {
    if (form.states.length === 0) e.states = "Choose at least one state.";
    if (!form.areas.trim()) e.areas = "Enter the areas where you work.";
    if (!form.reach) e.reach = "Choose how many farmers you can reach.";
    if (!form.tomatoShare) e.tomatoShare = "Choose how many grow tomatoes.";
    if (!form.experience) e.experience = "Choose how long you have worked with farmers.";
    if (!form.howReach.trim()) e.howReach = "Tell us how you reach these farmers today.";
  } else {
    if (!form.device) e.device = "Choose an answer.";
    if (!form.motivation.trim()) e.motivation = "Tell us why you would like to join.";
    if (!form.confirmTrue) e.confirmTrue = "Tick this box to confirm.";
    if (!form.protectData) e.protectData = "Tick this box to agree.";
  }
  return e;
}

export default function ApplyAgent() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (key) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm({ ...form, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: "" });
  };
  const toggleState = (state) => {
    const states = form.states.includes(state) ? form.states.filter((s) => s !== state) : [...form.states, state];
    setForm({ ...form, states });
    if (errors.states) setErrors({ ...errors, states: "" });
  };

  async function next(event) {
    event.preventDefault();
    const found = validate(step, form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.applyAgent(form);
      setDone(true);
      window.scrollTo(0, 0);
    } catch {
      setSubmitError("We could not send your application. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <PublicLayout>
        <div className="public-inner form-page">
          <div className="result-card">
            <div className="result-icon">✓</div>
            <h1>Application received</h1>
            <p>Thank you for applying to GrowLine. Our team will review your details. If shortlisted, we will contact you.</p>
            <p className="small muted">Your application is under review. This is not an approved agent account.</p>
            <Button as={Link} to="/">
              Return to homepage
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="public-inner form-page">
        <p className="eyebrow">Extension agent application</p>
        <h1>{HEADINGS[step].title}</h1>
        <p className="section-text">{HEADINGS[step].text}</p>
        <StepTabs steps={STEPS} current={step} />
        <form className="form-card" onSubmit={next} noValidate>
          {step === 0 ? (
            <>
              <div className="form-grid">
                <FormField label="Full name" placeholder="Your full name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
                <FormField label="Phone number" type="tel" placeholder="0803 123 4567" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
                <FormField label="Email address" type="email" placeholder="name@example.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
                <FormField label="Preferred contact method" kind="select" value={form.contactMethod} onChange={set("contactMethod")} options={choose("Phone / SMS / WhatsApp / Email", CONTACT_METHODS)} error={errors.contactMethod} />
                <FormField label="I am applying as" kind="select" value={form.applyingAs} onChange={set("applyingAs")} options={choose("Farmer / Cooperative / NGO / Government / Other", APPLYING_AS)} error={errors.applyingAs} />
                <FormField label="Organisation / cooperative / agency" placeholder="If applicable" value={form.organisation} onChange={set("organisation")} />
                <FormField label="Your role or position" placeholder="If applicable" value={form.role} onChange={set("role")} />
              </div>
              <div className="notice notice-success">
                Who can apply? Trusted people or organisations with genuine access to farming communities.
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <div className="form-grid">
              <fieldset className="field check-group">
                <legend>State(s) where you work</legend>
                <div className="row">
                  {STATES.map((state) => (
                    <label key={state} className="check">
                      <input type="checkbox" checked={form.states.includes(state)} onChange={() => toggleState(state)} />
                      <span>{state}</span>
                    </label>
                  ))}
                </div>
                {errors.states ? <span className="error-text">{errors.states}</span> : null}
              </fieldset>
              <FormField label="LGA(s) and towns" placeholder="Enter areas where you work" value={form.areas} onChange={set("areas")} error={errors.areas} />
              <FormField label="How many farmers can you reach?" kind="select" value={form.reach} onChange={set("reach")} options={choose("Under 10 / 10–30 / 31–100 / Over 100", REACH)} error={errors.reach} />
              <FormField label="How many grow tomatoes?" kind="select" value={form.tomatoShare} onChange={set("tomatoShare")} options={choose("None / A few / About half / Most", TOMATO_SHARE)} error={errors.tomatoShare} />
              <FormField label="How long have you worked with farmers?" kind="select" value={form.experience} onChange={set("experience")} options={choose("Under 1 year / 1–3 / 4–10 / Over 10", EXPERIENCE)} error={errors.experience} />
              <FormField label="How do you reach these farmers today?" kind="textarea" rows={3} placeholder="Meetings, visits, phone, WhatsApp, etc." value={form.howReach} onChange={set("howReach")} error={errors.howReach} />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="stack">
              <div className="form-grid">
                <FormField label="Device with internet for dashboard?" kind="select" value={form.device} onChange={set("device")} options={choose("Yes / No / Sometimes", DEVICE)} error={errors.device} />
              </div>
              <FormField label="Why would you like to join GrowLine?" kind="textarea" rows={4} placeholder="Tell us about your motivation and how you hope to support farmers…" value={form.motivation} onChange={set("motivation")} error={errors.motivation} />
              <FormField label="Anything else we should know? (optional)" kind="textarea" rows={3} placeholder="Website, social page, reference, or other relevant information…" value={form.extra} onChange={set("extra")} />
              <label className="check">
                <input type="checkbox" checked={form.confirmTrue} onChange={set("confirmTrue")} />
                <span>I confirm the information above is true and agree to be contacted.</span>
              </label>
              {errors.confirmTrue ? <span className="error-text">{errors.confirmTrue}</span> : null}
              <label className="check">
                <input type="checkbox" checked={form.protectData} onChange={set("protectData")} />
                <span>If approved, I agree to protect farmers' information and use it only for GrowLine.</span>
              </label>
              {errors.protectData ? <span className="error-text">{errors.protectData}</span> : null}
            </div>
          ) : null}

          {Object.values(errors).some(Boolean) ? (
            <p className="notice notice-danger">Application needs correction. Check the highlighted fields and try again.</p>
          ) : null}
          {submitError ? <p className="notice notice-danger">{submitError}</p> : null}

          <div className={`form-actions ${step > 0 ? "spread" : "end"}`}>
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                ‹ Back
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {step < 2 ? "Continue" : submitting ? "Submitting…" : "Submit my application"}
            </Button>
          </div>
        </form>
      </div>
    </PublicLayout>
  );
}
