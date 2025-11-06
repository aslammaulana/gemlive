"use client";

import React, { useEffect, useState } from "react";
import { useGeminiLive } from "../hooks/useGeminiLive";
import { StatusIndicator } from "../components/StatusIndicator";
import { TranscriptionDisplay } from "../components/TranscriptionDisplay";
import { ControlButton } from "../components/ControlButton";
import { ConnectionState } from "@/types";
import { FaMicrophoneAlt, FaStopCircle } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient"; // pastikan file ini ada

const HomePage: React.FC = () => {
  const {
    connectionState,
    transcriptionHistory,
    startConversation,
    stopConversation,
    error,
  } = useGeminiLive();

  const [historyFromDB, setHistoryFromDB] = useState<any[]>([]);
  const isConversationActive =
    connectionState === ConnectionState.CONNECTED ||
    connectionState === ConnectionState.CONNECTING;

  // Load history dari Supabase sebelum sesi dimulai
  useEffect(() => {
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("natasha")
        .select("id, role, text, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading history:", error);
      } else {
        setHistoryFromDB(data || []);
      }
    };

    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-md p-4 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-xl md:text-2xl font-bold text-teal-400">
          Gemini Live Audio Assistant
        </h1>
        <StatusIndicator state={connectionState} />
      </header>

      <main className="grow flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Gabungkan history dari database dan sesi live */}
        <TranscriptionDisplay
  history={[
    ...historyFromDB.map((msg) => ({
      speaker: msg.role, // ubah key dari role → speaker
      text: msg.text,
    })),
    ...transcriptionHistory,
  ].slice(-15)}
/>



        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-center">
            <p className="font-semibold">An error occurred:</p>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700 p-4 sticky bottom-0">
        <div className="flex items-center justify-center space-x-4">
          <ControlButton
            onClick={startConversation}
            disabled={isConversationActive}
            className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <FaMicrophoneAlt />
            {connectionState === ConnectionState.CONNECTING
              ? "Connecting..."
              : "Start Conversation"}
          </ControlButton>
          <ControlButton
            onClick={stopConversation}
            disabled={!isConversationActive}
            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <FaStopCircle />
            Stop
          </ControlButton>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
