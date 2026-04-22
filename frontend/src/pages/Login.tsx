import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { login } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState } from '@/components/ui/ErrorState';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function Login() {
  const { setAuth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location  = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  if (isAuthenticated) { navigate(from, { replace: true }); }

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: ({ email, password }: FormValues) => login(email, password),
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      navigate(from, { replace: true });
    },
  });

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--c-primary), #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, margin: '0 auto 14px',
              boxShadow: '0 4px 16px rgba(99,102,241,.35)',
            }}
          >
            🎟
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--c-text)' }}>
            Agent Portal
          </h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginTop: 6 }}>
            Sign in to manage support tickets
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 36px' }}>
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="agent@company.com"
              error={errors.email?.message}
              icon={<MailIcon />}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              icon={<LockIcon />}
              {...register('password')}
            />

            {mutation.isError && (
              <div
                style={{
                  background: 'var(--c-danger-light)',
                  border: '1px solid #fca5a5',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                }}
              >
                <ErrorState error={mutation.error} compact />
              </div>
            )}

            <Button type="submit" loading={mutation.isPending} size="lg" style={{ marginTop: 4 }}>
              Sign in
            </Button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--c-text-muted)' }}>
          Need help?{' '}
          <Link to="/" style={{ color: 'var(--c-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Submit a ticket
          </Link>
        </p>
      </div>
    </div>
  );
}

function MailIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function LockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
