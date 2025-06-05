// Sound effect utility for the simulation game

// Use a class to manage sound effects with a singleton pattern
class SoundManager {
  private static instance: SoundManager;
  private sounds: Record<string, HTMLAudioElement> = {};
  private muted = false;

  // Sound URLs - using short, subtle sounds
  private soundUrls = {
    click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Soft click
    upload: 'https://assets.mixkit.co/active_storage/sfx/2007/2007-preview.mp3', // Soft whoosh
    process: 'https://assets.mixkit.co/active_storage/sfx/488/488-preview.mp3', // Processing sound
    complete: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3', // Complete sound
    success: 'https://assets.mixkit.co/active_storage/sfx/2039/2039-preview.mp3', // Success sound
    reveal: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Reveal sound
  };

  private constructor() {
    // Only run in browser
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      Object.entries(this.soundUrls).forEach(([key, url]) => {
        const audio = new Audio(url);
        audio.volume = 0.3;
        this.sounds[key] = audio;
      });

      try {
        const savedMuted = localStorage.getItem('soundMuted');
        if (savedMuted !== null) {
          this.muted = savedMuted === 'true';
        }
      } catch (e) {
        console.warn('Could not access localStorage for sound preferences');
      }
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public play(sound: keyof typeof this.soundUrls): void {
    if (this.muted) return;

    // Clone the audio to allow overlapping sounds
    const audio = this.sounds[sound];
    if (!audio) return;

    // Create a clone for overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = audio.volume;

    // Play with catch for browsers that block autoplay
    const playPromise = clone.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.warn('Audio playback was prevented:', error);
      });
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;

    // Save preference to localStorage
    try {
      localStorage.setItem('soundMuted', this.muted.toString());
    } catch (e) {
      console.warn('Could not save sound preference to localStorage');
    }

    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Preload sounds to reduce latency
  public preloadSounds(): void {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    Object.values(this.sounds).forEach(audio => {
      audio.load();
    });
  }
}

// Export a singleton instance
export const soundManager = SoundManager.getInstance();

// Helper functions for common sounds
export const playClickSound = () => soundManager.play('click');
export const playUploadSound = () => soundManager.play('upload');
export const playProcessSound = () => soundManager.play('process');
export const playCompleteSound = () => soundManager.play('complete');
export const playSuccessSound = () => soundManager.play('success');
export const playRevealSound = () => soundManager.play('reveal');
