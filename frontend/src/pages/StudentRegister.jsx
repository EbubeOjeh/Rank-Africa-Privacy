import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthShell, AuthHeader } from '@/components/AuthShell';
import { SuccessModal } from '@/components/SuccessModal';
import { TermsAgreement } from '@/components/TermsAgreement';
import { studentService } from '@/services/student.service';
import { universitiesService } from '@/services/universities.service';
import { useAuth } from '@/hooks/useAuth';
import { NIGERIAN_STATES } from '@/utils/constants';

const empty = {
  name: '',
  email: '',
  password: '',
  university_id: '',
  university_name: '',
  state: '',
  course: '',
  faculty: '',
  gender: '',
  phone_number: '',
};

// Self-registering students are, by default, final-year undergraduates — the
// audience RankAfrica ranks. These are applied automatically (no manual pick).
const DEFAULT_YEAR_OF_STUDY_LABEL = 'Final Year';
const DEFAULT_ACADEMIC_LEVEL_LABEL = 'Undergraduate';
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

export default function StudentRegister() {
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [notListed, setNotListed] = useState(false);

  const { setSession } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    universitiesService
      .list({ page_size: 100 })
      .then((data) => setUniversities(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setUniversities([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!accepted) {
      toast.error('Please agree to the Terms & Conditions to continue.');
      return;
    }
    setSubmitting(true);

    // Send either the picked university id or the free-text name, never both.
    // Year of study / academic level are applied as defaults (Final Year /
    // Undergraduate) and refined later in the profile builder, so they are not
    // collected here.
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      state: form.state || undefined,
      course: form.course,
      faculty: form.faculty || undefined,
      gender: form.gender || undefined,
      phone_number: form.phone_number || undefined,
      accept_terms: true,
    };
    if (notListed) {
      payload.university_name = form.university_name;
    } else {
      payload.university_id = form.university_id;
    }

    try {
      const res = await studentService.register(payload);
      setSession({ user: res.user, tokens: res.tokens });
      // Account created. The popup hands over to the profile builder, which
      // walks the student through the remaining sections and shows the final
      // "Registration Complete!" confirmation at the end.
      setRegistered(true);
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell maxWidth="max-w-xl">
      <AuthHeader
        icon={GraduationCap}
        title="Create your student profile"
        subtitle="Standardize your CGPA, showcase your projects & achievements, and rank across Africa."
      />

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
      >
        <div className="card p-6 space-y-4">
          <div className="rounded-lg bg-gold-400/[0.06] border border-gold-400/15 px-4 py-3 text-xs text-cream/80 flex gap-2">
            <Sparkles className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <div>
              Tell us your course and we’ll match it to a ranking field automatically. You can
              complete the rest of your profile after signing up.
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="field-label">Full name</label>
              <input
                className="input"
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="input"
                minLength={8}
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
                required
              />
            </div>

            {/* University: picker, with a "not listed" escape hatch → university_name */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="field-label">University</label>
                <button
                  type="button"
                  onClick={() => {
                    setNotListed((v) => !v);
                    setForm((f) => ({ ...f, university_id: '', university_name: '' }));
                  }}
                  className="text-[11px] text-gold-300 hover:underline mb-1.5"
                >
                  {notListed ? 'Pick from the list instead' : 'My university isn’t listed'}
                </button>
              </div>
              {notListed ? (
                <input
                  className="input"
                  value={form.university_name}
                  onChange={set('university_name')}
                  placeholder="Type your university name"
                  required
                />
              ) : (
                <select
                  className="input"
                  value={form.university_id}
                  onChange={set('university_id')}
                  required
                >
                  <option value="">Select your university…</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.state ? ` — ${u.state}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="field-label">State</label>
              <select className="input" value={form.state} onChange={set('state')}>
                <option value="">Select state (optional)</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Course / Programme</label>
              <input
                className="input"
                value={form.course}
                onChange={set('course')}
                placeholder="e.g. Computer Science"
                required
              />
            </div>

            <div>
              <label className="field-label">Faculty</label>
              <input
                className="input"
                value={form.faculty}
                onChange={set('faculty')}
                placeholder="e.g. Engineering (optional)"
              />
            </div>
            <div>
              <label className="field-label">Year of study</label>
              <div className="input flex items-center text-cream/80 cursor-default select-none">
                {DEFAULT_YEAR_OF_STUDY_LABEL}
              </div>
            </div>

            <div>
              <label className="field-label">Academic level</label>
              <div className="input flex items-center text-cream/80 cursor-default select-none">
                {DEFAULT_ACADEMIC_LEVEL_LABEL}
              </div>
            </div>
            <div>
              <label className="field-label">Gender</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Prefer not to say</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Phone number</label>
              <input
                className="input"
                value={form.phone_number}
                onChange={set('phone_number')}
                placeholder="e.g. +234… (optional)"
              />
            </div>
          </div>

          {/* Required terms acceptance */}
          <TermsAgreement
            accepted={accepted}
            onChange={setAccepted}
            extra="I confirm the academic information I provide is accurate."
          />

          <button type="submit" disabled={submitting || !accepted} className="btn-primary w-full">
            {submitting ? 'Creating your profile…' : 'Create my profile'}
          </button>

          <p className="text-center text-xs text-cream/60">
            Already have an account?{' '}
            <Link to="/login?as=student" className="text-gold-300 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.form>

      {/* Account created — hand over to the profile builder's first section.
          The final "Registration Complete!" prompt fires there, once every
          section has been completed. */}
      <SuccessModal
        open={registered}
        title="Account created!"
        cta="Continue to my profile"
        social={false}
        note="It only takes a few minutes, and the more complete your profile, the higher you rank."
        onClose={() => navigate('/student/profile', { replace: true })}
      >
        Next, we’ll walk you through your profile one section at a time.
      </SuccessModal>
    </AuthShell>
  );
}
