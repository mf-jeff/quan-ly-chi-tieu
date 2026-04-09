import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 lg:ml-0 pt-12 lg:pt-0 pb-20 lg:pb-0 overflow-auto">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
