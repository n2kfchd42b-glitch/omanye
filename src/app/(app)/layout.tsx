// Protected layout — middleware already enforces authentication.
// This layout simply provides a consistent wrapper for app routes.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
