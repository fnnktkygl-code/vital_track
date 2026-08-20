/**
 * 🎙️ VITALTRACK STUDIO DUBBING & SYNCHRONIZATION ENGINE
 * Moteur audio studio haute fidélité utilisant de véritables voix neurales humaines pré-rendues,
 * basculement instantané VF / VO et synchronisation temporelle sur vidéo.
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
    this.duckedVolume = 0.20;

    this.currentDialogueIndex = -1;
    this.activeAudioClip = null;
    this.isSpeaking = false;

    // Callbacks pour l'UI
    this.onLineChange = null;
    this.onSubtitleUpdate = null;
    this.onDubbingStateChange = null;
  }

  /**
   * Initialise le moteur sur une vidéo donnée
   */
  loadVideo(dubbingData, target = null) {
    this.stopAudio();
    this.dubbingData = dubbingData;
    this.currentDialogueIndex = -1;

    if (target && target.tagName === 'VIDEO') {
      this.videoElement = target;
      this.isYouTube = false;
      this.youtubeIframe = null;
      this.originalVolume = target.volume || 1.0;

      // Si une version vidéo entièrement mixée en français existe et que le doublage est actif
      if (this.isDubbingEnabled && dubbingData && dubbingData.dubbedMediaUrl) {
        if (!target.src.includes(dubbingData.dubbedMediaUrl)) {
          const currentTime = target.currentTime || 0;
          target.src = dubbingData.dubbedMediaUrl;
          target.currentTime = currentTime;
        }
      }
    } else if (target && target.tagName === 'IFRAME') {
      this.youtubeIframe = target;
      this.isYouTube = true;
      this.videoElement = null;
    } else {
      this.videoElement = null;
      this.youtubeIframe = null;
      this.isYouTube = false;
    }

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
    const prev = this.isDubbingEnabled;
    this.isDubbingEnabled = !!enabled;

    // Si on est sur une vidéo locale avec fichier mixé dédié
    if (this.videoElement && this.dubbingData) {
      const currentTime = this.videoElement.currentTime || 0;
      const wasPlaying = !this.videoElement.paused;

      if (this.isDubbingEnabled && this.dubbingData.dubbedMediaUrl) {
        this.videoElement.src = this.dubbingData.dubbedMediaUrl;
      } else if (this.dubbingData.mediaUrl) {
        this.videoElement.src = this.dubbingData.mediaUrl;
      }

      this.videoElement.currentTime = currentTime;
      if (wasPlaying) {
        this.videoElement.play().catch(() => {});
      }
    } else {
      // Pour les iframes YouTube
      if (!this.isDubbingEnabled) {
        this.stopAudio();
        this.restoreAudioDucking();
      }
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

        // Si vidéo YouTube (sans vidéo mixée locale) et doublage actif -> jouer le clip MP3 studio
        if (this.isYouTube && this.isDubbingEnabled) {
          this.playStudioClip(activeLine);
        }

        // Notifier pour le surlignage de l'UI
        if (this.onLineChange) {
          this.onLineChange({
            index: activeIdx,
            line: activeLine,
            speaker: speaker
          });
        }

        // Mettre à jour les sous-titres
        this._renderSubtitle(activeLine, speaker);
      } else {
        // Période hors réplique
        if (this.isYouTube) {
          this.stopAudio();
          this.restoreAudioDucking();
        }
        if (this.onSubtitleUpdate) {
          this.onSubtitleUpdate(null);
        }
      }
    }
  }

  /**
   * Joue le clip MP3 studio haute fidélité d'une réplique
   */
  playStudioClip(line) {
    this.stopAudio();
    const clipUrl = line.clipUrl || `/videos/dubbing/clips/${line.id}.mp3`;

    try {
      const audio = new Audio(clipUrl);
      this.activeAudioClip = audio;
      this.isSpeaking = true;
      this.applyAudioDucking();

      audio.onended = () => {
        this.isSpeaking = false;
        this.restoreAudioDucking();
        this.activeAudioClip = null;
      };

      audio.onerror = () => {
        this.isSpeaking = false;
        this.restoreAudioDucking();
        this.activeAudioClip = null;
      };

      audio.play().catch(() => {});
    } catch (e) {
      this.restoreAudioDucking();
    }
  }

  /**
   * Teste la voix humaine réelle d'un locuteur avec un extrait studio
   */
  testSpeakerVoice(speakerId) {
    this.stopAudio();
    if (!this.dubbingData || !this.dubbingData.dialogues) return;

    // Trouver la première réplique de ce locuteur
    const sampleLine = this.dubbingData.dialogues.find(d => d.speaker === speakerId) || this.dubbingData.dialogues[0];
    if (sampleLine) {
      const clipUrl = `/videos/dubbing/clips/${sampleLine.id}.mp3`;
      const audio = new Audio(clipUrl);
      this.activeAudioClip = audio;
      audio.play().catch(() => {});
    }
  }

  applyAudioDucking() {
    if (this.videoElement) {
      try {
        this.videoElement.volume = this.duckedVolume;
      } catch (e) {}
    } else if (this.isYouTube && this.youtubeIframe && this.youtubeIframe.contentWindow) {
      try {
        this.youtubeIframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [20] }),
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

  stopAudio() {
    if (this.activeAudioClip) {
      try {
        this.activeAudioClip.pause();
        this.activeAudioClip.currentTime = 0;
      } catch (e) {}
      this.activeAudioClip = null;
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
    this.stopAudio();
    this.restoreAudioDucking();
  }

  onVideoSeek() {
    this.stopAudio();
    this.currentDialogueIndex = -1;
  }

  destroy() {
    this.stopAudio();
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
