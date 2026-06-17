import { Header } from '@/components/header';
import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <div className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-8 py-12 lg:grid-cols-[1fr_.9fr] lg:items-start">
        <div>
          <h1 className="text-4xl font-extrabold text-white">إنشاء حساب</h1>
          <p className="mt-3 max-w-xl text-slate-300">التسجيل مطلوب قبل إنشاء أي جلسة لعب أو حفظ التقدم.</p>
        </div>
        <AuthForm mode="register" />
      </div>
    </main>
  );
}