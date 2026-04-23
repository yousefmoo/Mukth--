// ── Register Page ────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useT, useLocale } from '../lib/i18n';
import { registerSchema, validate } from '../lib/validators';
import { C } from '../components/shared/tokens';
import IslamicPattern from '../components/shared/IslamicPattern';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ROLES = [
  { value: 'student', icon: '📖' },
  { value: 'teacher', icon: '🎓' },
];

export default function RegisterPage() {
  const t = useT();
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const notify = useNotificationStore();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'student' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: null }));
  };

  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const register = useAuthStore((s) => s.register);

  useEffect(() => {
    if (user && role) {
      const path = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
      navigate(path);
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(registerSchema, form);
    if (!v.success) { setErrors(v.errors); return; }

    setLoading(true);
    try {
      // If role is teacher, we still register but might show a different message
      const isTeacher = form.role === 'teacher';
      
      await register(form.email, form.password, { 
        full_name: form.name, 
        phone_number: form.phone, 
        role: form.role 
      });

      if (isTeacher) {
        notify.success(
          locale === 'ar' ? 'طلب انضمام!' : 'Request Sent!', 
          locale === 'ar' 
            ? 'تم إنشاء الحساب. سيقوم المدير بمراجعة طلبك كمعلم قريباً.' 
            : 'Account created. The admin will review your teacher request shortly.'
        );
      } else {
        notify.success(
          locale === 'ar' ? 'مرحباً بك!' : 'Welcome!', 
          locale === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully'
        );
      }
      
      // Navigate to login after successful registration to avoid auto-login without role sync
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      let msg = err.message;
      if (msg.includes('User already registered')) {
        msg = locale === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email is already registered.';
      }
      notify.error(locale === 'ar' ? 'خطأ في التسجيل' : 'Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div dir={dir} style={{
      minHeight: '100vh', display: 'flex',
      background: `linear-gradient(155deg, ${C.g900} 0%, ${C.g850} 40%, ${C.g800} 100%)`,
      position: 'relative', overflow: 'hidden',
      padding: '2rem 1rem',
      direction: dir,
    }}>
      <IslamicPattern opacity={0.05} />

      <div style={{
        margin: 'auto', width: '100%', maxWidth: '480px',
        position: 'relative', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px ${C.gold}40`,
            }}>
              <span style={{ fontSize: '1.3rem', color: C.g900, fontWeight: 900, fontFamily: locale === 'ar' ? "'IBM Plex Sans Arabic'" : "'Inter', sans-serif" }}>
                {locale === 'ar' ? 'م' : 'M'}
              </span>
            </div>
            <span style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', fontFamily: locale === 'ar' ? "'IBM Plex Sans Arabic'" : "'Inter', sans-serif" }}>
              {t.appName}
            </span>
          </Link>
        </div>

        {/* Form */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: '1.5rem',
          padding: '2.25rem 2rem', boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          border: `1px solid ${C.gold}18`,
          textAlign: locale === 'ar' ? 'right' : 'left',
        }}>
          <h1 style={{
            fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)',
            fontFamily: locale === 'ar' ? "'IBM Plex Sans Arabic', sans-serif" : "'Inter', sans-serif",
            margin: '0 0 0.3rem', textAlign: 'center',
          }}>
            {t.registerTitle}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem' }}>
            {t.registerSub}
          </p>

          {/* Role picker */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setForm((f) => ({ ...f, role: r.value })); setErrors((er) => ({ ...er, role: null })); }}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: '0.7rem',
                  border: `2px solid ${form.role === r.value ? C.g600 : 'var(--border-secondary)'}`,
                  background: form.role === r.value ? `${C.g800}10` : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                  fontSize: '0.88rem', color: form.role === r.value ? C.g800 : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
              >
                {r.icon} {r.value === 'student' ? (locale === 'ar' ? 'طالب' : 'Student') : (locale === 'ar' ? 'معلم' : 'Teacher')}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <Input label={t.fullName} name="name" placeholder={locale === 'ar' ? 'محمد أحمد' : 'Mohammed Ahmed'} value={form.name} onChange={handleChange} error={errors.name} required dir={dir} icon="👤" />
            <Input label={t.email} name="email" type="email" placeholder="example@mukth.com" value={form.email} onChange={handleChange} error={errors.email} required dir={dir} icon="📧" />
            <Input label={t.phone} name="phone" type="tel" placeholder="+20 1XX XXX XXXX" value={form.phone} onChange={handleChange} error={errors.phone} required dir={dir} icon="📱" />
            <Input label={t.password} name="password" type="password" placeholder="••••••" value={form.password} onChange={handleChange} error={errors.password} required dir={dir} icon="🔒" />
            <Input label={t.confirmPassword} name="confirmPassword" type="password" placeholder="••••••" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required dir={dir} icon="🔒" />

            <Button type="submit" variant="gold" fullWidth loading={loading} size="lg" style={{ marginTop: '0.5rem' }}>
              {t.register} {locale === 'ar' ? '←' : '→'}
            </Button>
          </form>

          <p style={{ textAlign: 'center', margin: '1.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t.hasAccount}{' '}
            <Link to="/login" style={{ color: C.gold, fontWeight: 700, textDecoration: 'none' }}>
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
