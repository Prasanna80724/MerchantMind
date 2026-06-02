import { useSidebar } from "../../context/SidebarContext";
import { cn } from "../../utils/cn";
import PageTransition from "./PageTransition";
import Sidebar from "../Sidebar/Sidebar";

export default function AppLayout({ children }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <main
        className={cn(
          "min-h-screen transition-[margin] duration-250 ease-out",
          collapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        <PageTransition>
          <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</div>
        </PageTransition>
      </main>
    </div>
  );
}
