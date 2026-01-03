import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/MainLayout";

import Mindmap from "./pages/Mindmap";
import SectionPage from "./pages/SectionPage";
import TopicPage from "./pages/TopicPage";
import ClozePractice from "./pages/ClozePractice";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import FlashcardsAll from "./pages/FlashcardsAll";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Mindmap />} />
        <Route path="/section/:sectionSlug" element={<SectionPage />} />
        <Route path="/section/:sectionSlug/:topicSlug" element={<TopicPage />} />
        <Route path="/practice/:sectionSlug/:topicSlug" element={<ClozePractice />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/flashcards" element={<FlashcardsAll />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}
