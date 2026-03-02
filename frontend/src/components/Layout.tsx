import { Outlet } from "react-router-dom";
import { Header } from "../modules/deposit/components/Header";

export const Layout = () => {
  return (
    <div className="min-h-screen bg-[#050511] text-white selection:bg-purple-500/30">
      <Header />
      <Outlet />
    </div>
  );
};
