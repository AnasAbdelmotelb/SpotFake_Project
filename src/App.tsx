import { useState, useEffect, useRef } from "react";
import { Toaster } from "sonner";
import { Menu, X } from "lucide-react";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import ContactPage from "./components/ContactPage";
import AnalyzePage from "./components/AnalyzePage";
import TrainingPage from "./components/TrainingPage";
import HistoryPage from "./components/HistoryPage";
import EvaluationPage from "./components/EvaluationPage";

type Page = "home" | "about" | "contact" | "analyze" | "training" | "history" | "evaluation";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === "#/training") setCurrentPage("training");
      else if (hash === "#/history") setCurrentPage("history");
      else if (hash === "#/evaluation") setCurrentPage("evaluation");
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1">
        {currentPage === "home" && <HomePage setCurrentPage={setCurrentPage} />}
        {currentPage === "about" && <AboutPage />}
        {currentPage === "contact" && <ContactPage />}
        {currentPage === "analyze" && <AnalyzePage />}
        {currentPage === "training" && <TrainingPage />}
        {currentPage === "history" && <HistoryPage />}
        {currentPage === "evaluation" && <EvaluationPage />}
      </main>
      <Footer setCurrentPage={setCurrentPage} />
      <Toaster />
    </div>
  );
}

function Header({ currentPage, setCurrentPage }: { currentPage: Page; setCurrentPage: (page: Page) => void }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => setCurrentPage("home")}
            className="flex items-center space-x-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">SF</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SpotFake
            </span>
          </button>

          <nav className="hidden md:flex space-x-8">
            <NavLink active={currentPage === "home"} onClick={() => setCurrentPage("home")}>Home</NavLink>
            <NavLink active={currentPage === "about"} onClick={() => setCurrentPage("about")}>About</NavLink>
            <NavLink active={currentPage === "history"} onClick={() => setCurrentPage("history")}>History</NavLink>
            <NavLink active={currentPage === "contact"} onClick={() => setCurrentPage("contact")}>Contact</NavLink>
          </nav>

          <button
            onClick={() => setCurrentPage("analyze")}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Analyze Now
          </button>
        </div>
      </div>
    </header>
  );
}

function NavLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium transition-colors relative ${
        active ? "text-blue-600" : "text-gray-600 hover:text-blue-600"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
      )}
    </button>
  );
}

function Footer({ setCurrentPage }: { setCurrentPage: (page: Page) => void }) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">SF</span>
              </div>
              <span className="text-2xl font-bold">SpotFake</span>
            </div>
            <p className="text-gray-400 max-w-md">
              Advanced AI-powered multimodal fake news detection. Analyze text and extract text from images via OCR to verify authenticity with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><button onClick={() => setCurrentPage("home")} className="text-gray-400 hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => setCurrentPage("about")} className="text-gray-400 hover:text-white transition-colors">About</button></li>
              <li><button onClick={() => setCurrentPage("analyze")} className="text-gray-400 hover:text-white transition-colors">Analyze</button></li>
              <li><button onClick={() => setCurrentPage("history")} className="text-gray-400 hover:text-white transition-colors">History</button></li>
              <li><button onClick={() => setCurrentPage("contact")} className="text-gray-400 hover:text-white transition-colors">Contact</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Research</h3>
            <ul className="space-y-2">
              <li className="text-gray-400 text-sm">TF-IDF + Logistic Regression</li>
              <li className="text-gray-400 text-sm">Tesseract.js OCR Integration</li>
              <li className="text-gray-400 text-sm">Unified Text Analytics</li>
              <li className="text-gray-400 text-sm">SGD with L2 Regularization</li>
              <li className="text-gray-400 text-sm">80/20 Train/Test Split</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} SpotFake. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
