'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/stores/useProfileStore';
import type { ChatMessage } from '@/types';

export default function ChatPage() {
  const { profile } = useProfileStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ${profile.name} ! 🌿 Je suis votre Coach Vital IA. Je suis à votre écoute pour concevoir vos protocoles de jeûne, équilibrer votre PRAL, analyser vos combinaisons alimentaires ou vous guider sur les plantes de la pharmacopée amazonienne. De quoi avez-vous besoin aujourd'hui ?`,
      createdAt: Date.now(),
      modelUsed: 'gemini-3.6-flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBioContextOpen, setIsBioContextOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const userContextString = `[BIO-CONTEXTE VITALTRACK]
Identité: ${profile.name} (${profile.age} ans, ${profile.currentWeight}kg, objectif: ${profile.targetWeight}kg)
Biorégion: ${profile.bioregion} | Pays: ${profile.country} | Ville: ${profile.city}
Protocole Actif: ${profile.protocol}
Restrictions: ${profile.restrictions || 'Aucune'}
Mémoires: ${profile.memories || 'Aucune'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(profile.customGeminiKey ? { 'x-gemini-key': profile.customGeminiKey } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userContext: userContextString,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la réponse IA');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.content,
        createdAt: data.timestamp || Date.now(),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Une erreur est survenue : ${err.message || 'Impossible de joindre le coach IA.'}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300">
      {/* Header & Bio-Context Inspector Toggle */}
      <GlassCard className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Coach Vital IA · Intelligence Hygiéniste
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Raisonnement clinique profond & régénération cellulaire (Gemini 3.7 & 3.6 Flash)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsBioContextOpen(!isBioContextOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white hover:border-emerald-500 transition-all cursor-pointer"
        >
          <i className="ri-terminal-box-fill text-emerald-400 text-sm" />
          <span>Console de Transparence</span>
          <i className={`ri-arrow-down-s-line transition-transform ${isBioContextOpen ? 'rotate-180' : ''}`} />
        </button>
      </GlassCard>

      {/* Bio-Context Live Inspector Box */}
      {isBioContextOpen && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-2">
            <span className="text-emerald-400 flex items-center gap-2">
              <i className="ri-shield-check-line" /> Bio-Contexte IA Actif en Arrière-Plan
            </span>
            <span className="text-[10px] text-slate-500">Injecté en direct</span>
          </div>
          <pre className="font-mono text-[11px] leading-relaxed text-emerald-400/90 whitespace-pre-wrap overflow-x-auto p-3 bg-black/50 rounded-xl border border-emerald-500/20">
            {userContextString}
          </pre>
        </div>
      )}

      {/* Conversation Thread */}
      <GlassCard className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-emerald-400'
              }`}
            >
              {msg.role === 'user' ? '👤' : '🌿'}
            </div>

            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.modelUsed && (
                <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>⚡ Modèle : {msg.modelUsed}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center text-sm">
              🌿
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-emerald-400 text-xs flex items-center gap-2">
              <i className="ri-loader-4-line animate-spin text-base" />
              <span>Le Coach Vital IA synthétise les connaissances physiologiques...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </GlassCard>

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question (ex: Comment préparer ma rupture de jeûne ? Quel est le PRAL du persil ?)"
          className="flex-1 px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500 shadow-sm"
          disabled={isLoading}
        />
        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
          <i className="ri-send-plane-fill text-base" />
          <span className="hidden sm:inline">Envoyer</span>
        </Button>
      </form>
    </div>
  );
}
