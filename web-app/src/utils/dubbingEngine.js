/**
 * 🎙️ VITALTRACK MULTI-SPEAKER DUBBING & SYNCHRONIZATION ENGINE
 * Moteur de lecture synchronisée, attribution de voix françaises distinctes et audio ducking.
 */

class DubbingEngine {
  constructor() {
    this.dubbingData = null;
    this.videoElement = null;
    this.isYouTube = false;
    this.youtubeIframe = null;

    this.isDubbingEnabled = true;
    this.subtitleMode = 'fr'; // 'fr', 'en', 'off'
    this.originalVolume = 1.0;
    this.duckedVolume = 0.15;

    this.currentDialogueIndex = -1;
    this.currentUtterance = null;
    this.isSpeaking = false;

    this.frenchVoices = [];
    this.speakerVoiceAssignments = new Map();

    // Callbacks pour l'UI
    this.onLineChange = null;
    this.onSubtitleUpdate = null;
    this.onDubbingStateChange = null;

    this._initVoices();
  }

  _initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices() || [];
      this.frenchVoices = allVoices.filter(v => 
        v.lang && (v.lang.startsWith('fr') || v.lang.startsWith('FR'))
      );
      this._assignSpeakerVoices();
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  _assignSpeakerVoices() {
    if (!this.dubbingData || !this.dubbingData.speakers) return;

    const speakerIds = Object.keys(this.dubbingData.speakers);
    this.speakerVoiceAssignments.clear();

    speakerIds.forEach((id, idx) => {
      const speaker = this.dubbingData.speakers[id];
      const settings = speaker.voiceSettings || {};

      // Si plusieurs voix françaises réelles existent, on en attribue une différente à chaque locuteur
      let voice = null;
      if (this.frenchVoices.length > 0) {
        voice = this.frenchVoices[idx % this.frenchVoices.length];
      }

      this.speakerVoiceAssignments.set(id, {
        voice: voice,
        pitch: settings.pitch || (idx === 0 ? 1.05 : 0.86),
        rate: settings.rate || 0.96
      });
    });
  }

  /**
   * Initialise le moteur sur une vidéo donnée
   */
  loadVideo(dubbingData, target = null) {
    this.stopSpeech();
    this.dubbingData = dubbingData;
    this.currentDialogueIndex = -1;

    if (target && target.tagName === 'VIDEO') {
      this.videoElement = target;
      this.isYouTube = false;
      this.youtubeIframe = null;
      this.originalVolume = target.volume || 1.0;
    } else if (target && target.tagName === 'IFRAME') {
      this.youtubeIframe = target;
      this.isYouTube = true;
      this.videoElement = null;
    } else {
      this.videoElement = null;
      this.youtubeIframe = null;
      this.isYouTube = false;
    }

    this._assignSpeakerVoices();
    if (this.onDubbingStateChange) {
      this.onDubbingStateChange({
        hasDubbing: !!(dubbingData && dubbingData.dialogues && dubbingData.dialogues.length > 0),
        isDubbingEnabled: this.isDubbingEnabled,
        subtitleMode: this.subtitleMode,
        speakers: dubbingData ? dubbingData.speakers : {}
      });
    }
  }

  setDubbingEnabled(enabled) {
    this.isDubbingEnabled = !!enabled;
    if (!this.isDubbingEnabled) {
      this.stopSpeech();
      this.restoreAudioDucking();
    }
    if (this.onDubbingStateChange) {
      this.onDubbingStateChange({
        isDubbingEnabled: this.isDubbingEnabled,
        subtitleMode: this.subtitleMode
      });
    }
  }

  setSubtitleMode(mode) {
    this.subtitleMode = mode; // 'fr', 'en', 'off'
    this._updateSubtitlesAtCurrentLine();
  }

  /**
   * Synchronisation temporelle sur timeupdate
   */
  onTimeUpdate(currentTimeSeconds) {
    if (!this.dubbingData || !this.dubbingData.dialogues) return;

    const time = Number(currentTimeSeconds) || 0;
    const dialogues = this.dubbingData.dialogues;

    // Recherche de la réplique correspondante
    let activeIdx = -1;
    for (let i = 0; i < dialogues.length; i++) {
      const d = dialogues[i];
      if (time >= d.start && time <= d.end) {
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== this.currentDialogueIndex) {
      this.currentDialogueIndex = activeIdx;
      
      if (activeIdx !== -1) {
        const activeLine = dialogues[activeIdx];
        const speaker = this.dubbingData.speakers[activeLine.speaker] || { name: activeLine.speaker, color: '#38bdf8' };

        // 1. Déclencher le doublage vocal si activé
        if (this.isDubbingEnabled) {
          this.speakDialogueLine(activeLine);
        }

        // 2. Notifier pour le surlignage de l'UI
        if (this.onLineChange) {
          this.onLineChange({
            index: activeIdx,
            line: activeLine,
            speaker: speaker
          });
        }

        // 3. Mettre à jour les sous-titres
        this._renderSubtitle(activeLine, speaker);
      } else {
        // Période de silence ou hors dialogue
        this.stopSpeech();
        this.restoreAudioDucking();
        if (this.onSubtitleUpdate) {
          this.onSubtitleUpdate(null);
        }
      }
    }
  }

  speakDialogueLine(line) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    this.stopSpeech();

    // Re-verify voices if not loaded initially
    if (this.frenchVoices.length === 0) {
      const allVoices = window.speechSynthesis.getVoices() || [];
      this.frenchVoices = allVoices.filter(v => v.lang && (v.lang.startsWith('fr') || v.lang.startsWith('FR')));
      if (this.frenchVoices.length > 0) this._assignSpeakerVoices();
    }

    const config = this.speakerVoiceAssignments.get(line.speaker) || { pitch: 1.0, rate: 0.96, voice: null };

    const utterance = new SpeechSynthesisUtterance(line.textFr);
    utterance.lang = 'fr-FR';
    if (config.voice) utterance.voice = config.voice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.applyAudioDucking();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.restoreAudioDucking();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.restoreAudioDucking();
    };

    this.currentUtterance = utterance;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }

  testSpeakerVoice(speakerId) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.stopSpeech();
    const speaker = this.dubbingData?.speakers?.[speakerId] || { name: speakerId };
    const config = this.speakerVoiceAssignments.get(speakerId) || { pitch: 1.0, rate: 0.96, voice: null };
    const utterance = new SpeechSynthesisUtterance(`Bonjour, je suis la voix française de ${speaker.name}. Le doublage est actif.`);
    utterance.lang = 'fr-FR';
    if (config.voice) utterance.voice = config.voice;
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }

  applyAudioDucking() {
    if (this.videoElement) {
      try {
        this.videoElement.volume = this.duckedVolume;
      } catch (e) {}
    } else if (this.isYouTube && this.youtubeIframe && this.youtubeIframe.contentWindow) {
      try {
        this.youtubeIframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [15] }),
          '*'
        );
      } catch (e) {}
    }
  }

  restoreAudioDucking() {
    if (this.videoElement) {
      try {
        this.videoElement.volume = this.originalVolume;
      } catch (e) {}
    } else if (this.isYouTube && this.youtubeIframe && this.youtubeIframe.contentWindow) {
      try {
        this.youtubeIframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
          '*'
        );
      } catch (e) {}
    }
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
  }

  _renderSubtitle(line, speaker) {
    if (!this.onSubtitleUpdate) return;
    if (this.subtitleMode === 'off') {
      this.onSubtitleUpdate(null);
      return;
    }

    const text = this.subtitleMode === 'en' ? line.textEn : line.textFr;
    this.onSubtitleUpdate({
      speakerName: speaker.name,
      speakerRole: speaker.role || '',
      speakerColor: speaker.color || '#38bdf8',
      speakerAvatar: speaker.avatar || '🎙️',
      text: text,
      lang: this.subtitleMode
    });
  }

  _updateSubtitlesAtCurrentLine() {
    if (!this.dubbingData || this.currentDialogueIndex === -1) {
      if (this.onSubtitleUpdate) this.onSubtitleUpdate(null);
      return;
    }
    const line = this.dubbingData.dialogues[this.currentDialogueIndex];
    if (line) {
      const speaker = this.dubbingData.speakers[line.speaker] || { name: line.speaker };
      this._renderSubtitle(line, speaker);
    }
  }

  onVideoPause() {
    this.stopSpeech();
    this.restoreAudioDucking();
  }

  onVideoSeek() {
    this.stopSpeech();
    this.currentDialogueIndex = -1;
  }

  destroy() {
    this.stopSpeech();
    this.restoreAudioDucking();
    this.dubbingData = null;
    this.videoElement = null;
    this.youtubeIframe = null;
  }
}

export const dubbingEngine = new DubbingEngine();
if (typeof window !== 'undefined') {
  window.dubbingEngine = dubbingEngine;
}
