'use client';

import React, { useState, useRef } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { computeDataHash } from '@/lib/vitalism/crypto';
import { scanCache } from '@/lib/vitalism/cache';
import { useProfileStore } from '@/stores/useProfileStore';

export default function ScanPage() {
  const { profile } = useProfileStore();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImageSrc(base64);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setIsScanning(true);
    setIsCached(false);
    setAnalysisResult(null);

    try {
      // 1. Compute SHA-256 Hash
      const hash = await computeDataHash(base64);

      // 2. Check IndexedDB Cache first
      const cached = await scanCache.get<any>(hash);
      if (cached) {
        setAnalysisResult(cached);
        setIsCached(true);
        setIsScanning(false);
        return;
      }

      // 3. Call AI Vision API
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(profile.customGeminiKey ? { 'x-gemini-key': profile.customGeminiKey } : {}),
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) {
        throw new Error('Échec de l\'analyse visuelle');
      }

      const data = await res.json();
      setAnalysisResult(data.analysis);

      // 4. Save into Cache
      await scanCache.set(hash, data.analysis);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Scanner Vital IA & Analyse de Plats
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Reconnaissance visuelle multimodale HD, charge rénale PRAL, indice NOVA & vitalisme (Gemini 3.7 Flash)
        </p>
      </div>

      {/* Upload / Camera Dropzone */}
      <GlassCard className="p-8 text-center border-dashed border-2 border-emerald-500/40 hover:border-emerald-500 transition-all">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {imageSrc ? (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-xl max-h-72">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageSrc} alt="Repas scanné" className="w-full h-full object-cover" />
              {isCached && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5 animate-in zoom-in-95">
                  <span>⚡ Cache instantané (0s)</span>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="ri-image-edit-line" />
              <span>Changer de photo</span>
            </Button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer space-y-4 py-6"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/10">
              📸
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Prenez une photo ou déposez une image de votre assiette
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                L&apos;IA détectera les ingrédients, la fraîcheur et la compatibilité vitale.
              </p>
            </div>
            <Button variant="primary" size="md">
              <i className="ri-upload-cloud-2-line" />
              <span>Sélectionner une photo</span>
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Loading Analysis Indicator */}
      {isScanning && (
        <GlassCard className="p-6 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-xl animate-spin">
            <i className="ri-loader-4-line" />
          </div>
          <p className="text-xs font-bold text-emerald-400">
            Analyse multimodale en cours avec Gemini 3.7 Flash...
          </p>
        </GlassCard>
      )}

      {/* Analysis Results Card */}
      {analysisResult && (
        <GlassCard className="p-6 space-y-5 animate-in fade-in zoom-in-95">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{analysisResult.emoji || '🍽️'}</span>
              <div>
                <h3 className="text-lg font-black text-white">
                  {analysisResult.mealName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={analysisResult.isElectric ? 'electric' : 'hybrid'}>
                    {analysisResult.isElectric ? '⚡ ÉLECTRIQUE' : '🔀 HYBRIDE'}
                  </Badge>
                  <Badge variant="emerald">
                    NOVA {analysisResult.novaGroup || 1}
                  </Badge>
                  <span className="text-xs font-bold text-emerald-400">
                    PRAL {analysisResult.pralScore > 0 ? `+${analysisResult.pralScore}` : analysisResult.pralScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold">Densité Vitale</div>
              <div className="text-xl font-black text-emerald-400">
                {analysisResult.freshnessScore || 95}%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Analyse Physiologique & Émonctoires
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              {analysisResult.vitalityAnalysis}
            </p>
          </div>

          {analysisResult.identifiedIngredients && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ingrédients Identifiés
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.identifiedIngredients.map((ing: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
