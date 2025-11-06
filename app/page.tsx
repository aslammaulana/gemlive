"use client";

import React, { useEffect, useState } from "react";
import { useGeminiLive } from "../hooks/useGeminiLive";
import { StatusIndicator } from "../components/StatusIndicator";
import { TranscriptionDisplay } from "../components/TranscriptionDisplay";
import { ControlButton } from "../components/ControlButton";
import { ConnectionState } from "@/types";
import { FaMicrophoneAlt, FaStopCircle, FaKey } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";

// Fungsi mendeteksi nomor API key aktif
const detectActiveKey = () => {
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY3) return "K-3";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY2) return "K-2";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY1) return "K-1";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY10) return "K-10";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY4) return "K-4";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY5) return "K-5";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY6) return "K-6";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY7) return "K-7";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY8) return "K-8";
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY9) return "K-9";
  return "K-?";
};

const HomePage: React.FC = () => {
  const {
    connectionState,
    transcriptionHistory,
    startConversation,
    stopConversation,
    error,
  } = useGeminiLive();

  const [historyFromDB, setHistoryFromDB] = useState<any[]>([]);
  const [activeKey, setActiveKey] = useState<string>("K-?");

  const isConversationActive =
    connectionState === ConnectionState.CONNECTED ||
    connectionState === ConnectionState.CONNECTING;

  // Load history dari Supabase
  useEffect(() => {
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("natasha")
        .select("id, role, text, created_at")
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) console.error("Error loading history:", error);
      else setHistoryFromDB((data || []).reverse());
    };

    loadHistory();
  }, []);

  // Deteksi API key aktif saat komponen load
  useEffect(() => {
    setActiveKey(detectActiveKey());
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      {/* HEADER STICKY */}
      <header className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-sm shadow-md p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-teal-400">
            Gemini Live Audio Assistant
          </h1>

          {/* Tombol API Key aktif */}
          <button
            className="flex items-center gap-2 text-xs bg-teal-700 px-3 py-1 rounded-md hover:bg-teal-600 transition"
            title="API Key aktif"
          >
            <FaKey className="text-teal-300" />
            {activeKey}
          </button>
        </div>

        <StatusIndicator state={connectionState} />
      </header>

      <main className="grow flex flex-col p-4 md:p-6 overflow-hidden">
        <TranscriptionDisplay
          history={[
            ...historyFromDB.map((msg) => ({
              speaker: msg.role,
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

      {/* FOOTER */}
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
