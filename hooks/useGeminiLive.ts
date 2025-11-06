import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { ConnectionState, ConversationTurn } from '@/types';
import { createBlob, decode, decodeAudioData } from '../utils/audio';
import { supabase } from '@/lib/supabaseClient'; // pastikan file ini ada

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

interface LiveSession {
  close: () => void;
  sendRealtimeInput: (input: { media: Blob }) => void;
}

export const useGeminiLive = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
  const [transcriptionHistory, setTranscriptionHistory] = useState<ConversationTurn[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const nextStartTime = useRef(0);
  const audioSources = useRef(new Set<AudioBufferSourceNode>());

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current.onaudioprocess = null;
    }
    mediaStreamSourceRef.current?.disconnect();
    inputAudioContextRef.current?.close().catch(console.error);
    outputAudioContextRef.current?.close().catch(console.error);

    sessionRef.current = null;
    streamRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
  }, []);

  const stopConversation = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      cleanup();
      setConnectionState(ConnectionState.DISCONNECTED);
    }
  }, [cleanup]);

  const startConversation = useCallback(async () => {
    setError(null);
    setConnectionState(ConnectionState.CONNECTING);
    setTranscriptionHistory([]);

    if (!process.env.NEXT_PUBLIC_API_KEY) {
      setError("API key is not set. Please create a .env.local file and add NEXT_PUBLIC_API_KEY.");
      setConnectionState(ConnectionState.ERROR);
      return;
    }

    try {
      // --- Ambil 15 percakapan terakhir dari database ---
      const { data: historyData, error: historyError } = await supabase
        .from('natasha')
        .select('role, text')
        .order('created_at', { ascending: true })
        .limit(15);

      if (historyError) console.error("Error fetching history:", historyError);

      const recentHistory = (historyData || [])
        .map((msg: { role: string; text: string }) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`
        )
        .join("\n");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `
            You are a friendly and helpful assistant.
            Continue the conversation naturally based on this context:
            ${recentHistory}
          `,
        },
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = createBlob(inputData);
              sessionPromise
                .then((session) => session.sendRealtimeInput({ media: pcmBlob }))
                .catch(e => console.error("Error sending audio data:", e));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription)
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;

            if (message.serverContent?.inputTranscription)
              currentInputTranscription.current += message.serverContent.inputTranscription.text;

            if (message.serverContent?.turnComplete) {
              const fullInput = currentInputTranscription.current.trim();
              const fullOutput = currentOutputTranscription.current.trim();

              setTranscriptionHistory(prev => {
                const newHistory = [...prev];
                if (fullInput) newHistory.push({ speaker: 'user', text: fullInput });
                if (fullOutput) newHistory.push({ speaker: 'model', text: fullOutput });
                return newHistory;
              });

              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              nextStartTime.current = Math.max(nextStartTime.current, outputAudioContextRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, OUTPUT_SAMPLE_RATE, 1);
              const sourceNode = outputAudioContextRef.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputAudioContextRef.current.destination);
              sourceNode.addEventListener('ended', () => audioSources.current.delete(sourceNode));
              sourceNode.start(nextStartTime.current);
              nextStartTime.current += audioBuffer.duration;
              audioSources.current.add(sourceNode);
            }

            if (message.serverContent?.interrupted) {
              for (const sourceNode of audioSources.current.values()) {
                sourceNode.stop();
                audioSources.current.delete(sourceNode);
              }
              nextStartTime.current = 0;
            }
          },
          onerror: (e: any) => {
            const errorMessage = e?.message || 'An unknown error occurred';
            console.error('Gemini Live API Error:', e);
            setError(`Connection failed: ${errorMessage}`);
            setConnectionState(ConnectionState.ERROR);
            cleanup();
          },
          onclose: () => {
            cleanup();
            setConnectionState(state => state === ConnectionState.ERROR ? ConnectionState.ERROR : ConnectionState.DISCONNECTED);
          },
        },
      });

      sessionPromise.then(session => {
        sessionRef.current = session;
      }).catch(e => {
        console.error('Failed to establish session:', e);
        setError(`Failed to establish session: ${e.message}`);
        setConnectionState(ConnectionState.ERROR);
        cleanup();
      });

    } catch (err: any) {
      console.error('Failed to start conversation:', err);
      setError(`Failed to start: ${err.message}`);
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [cleanup]);

  return { connectionState, transcriptionHistory, startConversation, stopConversation, error };
};
