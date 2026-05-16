import Sidebar from '@/components/Sidebar';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-[#f8fafc] min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-0">
        {children}
      </main>
    </div>
  );
}
