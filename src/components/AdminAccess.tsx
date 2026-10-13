import React, { useState } from 'react';
import { useAdminSession, sessionChanged } from '../lib/adminSession';
import { navigateTo } from '../utils/router';
import { useI18n } from '../i18n';

export function AdminAccess({ children }: { children?: React.ReactNode }) {
  const { profile, loading } = useAdminSession();
  const { t, language } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <p className="p-8 text-center">{t.authChecking}</p>;
  if (profile?.role === 'admin') return children || <div className="p-8 text-center"><button className="glass-btn px-4 py-2 rounded-xl" onClick={() => navigateTo({ type: 'admin' })}>{t.navAdmin}</button></div>;
  return (
    <form className="glass-panel rounded-2xl p-6 mx-auto my-12 max-w-md space-y-4" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      try {
        const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const messages: Record<string, [string, string, string]> = {
            INVALID_CREDENTIALS: ['Email hoặc mật khẩu không đúng. Hãy dùng tài khoản trong Supabase Authentication, không phải tài khoản đăng nhập trang Supabase.', 'Invalid email or password. Use the account created in Supabase Authentication.', '邮箱或密码不正确，请使用 Supabase Authentication 中创建的账号。'],
            EMAIL_NOT_CONFIRMED: ['Email chưa được xác nhận. Hãy xác nhận email của tài khoản trong Supabase Authentication.', 'Confirm your account email in Supabase Authentication.', '请先在 Supabase Authentication 中确认邮箱。'],
            ADMIN_ACCESS_DENIED: ['Đăng nhập hợp lệ nhưng tài khoản chưa có quyền quản trị. Thêm email này vào SVG_ADMIN_EMAILS trên Vercel, rồi redeploy.', 'This account is valid but has no admin access. Add its email to SVG_ADMIN_EMAILS on Vercel and redeploy.', '账号有效但没有管理员权限，请在 Vercel 的 SVG_ADMIN_EMAILS 中添加邮箱并重新部署。'],
            ADMIN_NOT_CONFIGURED: ['Chưa cấu hình email quản trị. Điền SVG_ADMIN_EMAILS trong Vercel rồi redeploy.', 'Set SVG_ADMIN_EMAILS in Vercel and redeploy.', '请在 Vercel 中设置 SVG_ADMIN_EMAILS 并重新部署。'],
            AUTH_NOT_CONFIGURED: ['Chưa cấu hình đăng nhập. Kiểm tra SVG_SUPABASE_URL và SVG_SUPABASE_PUBLISHABLE_KEY trong Vercel rồi redeploy.', 'Set SVG_SUPABASE_URL and SVG_SUPABASE_PUBLISHABLE_KEY in Vercel and redeploy.', '请在 Vercel 中设置 SVG_SUPABASE_URL 和 SVG_SUPABASE_PUBLISHABLE_KEY 并重新部署。'],
            AUTH_SERVICE_ERROR: ['Không thể kết nối dịch vụ đăng nhập. Kiểm tra URL và publishable key có thuộc cùng dự án Supabase, rồi redeploy.', 'Sign-in service is unavailable. Check that the URL and publishable key belong to the same Supabase project and redeploy.', '登录服务不可用，请检查 URL 和 publishable key 是否属于同一 Supabase 项目。'],
            AUTH_RATE_LIMITED: ['Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ rồi thử lại.', 'Too many login attempts. Wait before trying again.', '登录尝试过多，请稍后重试。'],
            ORIGIN_REJECTED: ['Yêu cầu đăng nhập bị từ chối do địa chỉ website không khớp. Hãy gửi URL website để kiểm tra cấu hình.', 'The website origin did not match. Check the deployment domain configuration.', '网站来源不匹配，请检查部署域名设置。'],
          };
          const localized = messages[data.code];
          setError(localized ? localized[language === 'vi' ? 0 : language === 'zh' ? 2 : 1] : response.status >= 500 ? t.authUnavailable : t.authDenied);
          return;
        }
        setPassword(''); sessionChanged(); navigateTo({ type: 'admin' });
      } catch { setError(t.authUnavailable); }
      finally { setBusy(false); }
    }}>
      <h1 className="text-xl font-semibold">{t.adminLoginHeading}</h1>
      <p className="text-sm text-neutral-500">{t.adminLoginDescription}</p>
      <label className="block text-sm">{t.authEmail}<input className="block w-full glass-input rounded-lg p-2 mt-1" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className="block text-sm">{t.authPassword}<input className="block w-full glass-input rounded-lg p-2 mt-1" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="glass-btn-primary rounded-lg px-4 py-2 w-full disabled:opacity-50">{busy ? t.authChecking : t.signIn}</button>
    </form>
  );
}
