// =============================================
// PLANAC ERP - Auth Layout (Login, etc)
// =============================================


interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

export default AuthLayout;
