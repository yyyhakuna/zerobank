import { Header } from "./components/Header";
import { DepositCard } from "./components/DepositCard";
import { PositionsTable } from "./components/PositionsTable";

const DepositPage = () => {
  return (
    <div className="min-h-screen bg-[#050511] text-white selection:bg-purple-500/30">
      <Header />

      <main className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Deposit/Borrow Form */}
          <div className="lg:col-span-4 xl:col-span-4">
            <DepositCard />
          </div>

          {/* Right Column: Positions Table */}
          <div className="lg:col-span-8 xl:col-span-8">
            <PositionsTable />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepositPage;
