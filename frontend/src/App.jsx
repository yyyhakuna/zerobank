import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import DepositPage from "./modules/deposit";
import VaultPage from "./modules/vault";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DepositPage />} />
          <Route path="vault" element={<VaultPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
