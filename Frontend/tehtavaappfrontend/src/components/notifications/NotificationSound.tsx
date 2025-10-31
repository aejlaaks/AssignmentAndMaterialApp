import { type FC, useRef, useEffect } from 'react';
import { NotificationPriority } from '../../types';

interface NotificationSoundProps {
  play: boolean;
  priority?: NotificationPriority;
  volume?: number;
  onEnded?: () => void;
}

const soundMap: Record<string, string> = {
  [NotificationPriority.High]: '/sounds/notification-high.mp3',
  [NotificationPriority.Medium]: '/sounds/notification-medium.mp3',
  [NotificationPriority.Low]: '/sounds/notification-low.mp3',
};

export const NotificationSound: FC<NotificationSoundProps> = ({
  play,
  priority = NotificationPriority.Low,
  volume = 0.5,
  onEnded,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundMap[priority]);
      audioRef.current.volume = Math.min(Math.max(volume, 0), 1);
      
      if (onEnded) {
        audioRef.current.addEventListener('ended', onEnded);
      }
    }

    return () => {
      if (audioRef.current && onEnded) {
        audioRef.current.removeEventListener('ended', onEnded);
      }
    };
  }, [priority, volume, onEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (play) {
      // Reset the audio to start if it's already playing
      audio.currentTime = 0;
      
      // Play the sound and handle any errors
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing notification sound:', error);
        });
      }
    } else {
      // Stop the sound if play is false
      audio.pause();
      audio.currentTime = 0;
    }
  }, [play]);

  // This component doesn't render anything
  return null;
};

// Preload sounds for better performance
Object.values(soundMap).forEach((soundUrl) => {
  const audio = new Audio(soundUrl);
  audio.preload = 'auto';
});
