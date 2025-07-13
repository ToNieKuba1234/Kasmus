import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import Song from '../models/Song';
import { loadSongsFromFile } from '../utils/storage';

type AudioPlayerContextType = {
  isPlaying: boolean;
  currentSong: Song | null;
  playSong: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  isPlaying: false,
  currentSong: null,
  playSong: async () => {},
  pause: async () => {},
  resume: async () => {},
  playNext: async () => {},
  playPrevious: async () => {},
});

export const AudioPlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const currentIndex = useRef<number>(-1);

  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      await loadPlaylist();
    })();
  }, []);

  const loadPlaylist = async () => {
    const songs = await loadSongsFromFile();
    setPlaylist(songs);
  };

  const onPlaybackStatusUpdate = async (status: any) => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      await playNext();
    } else {
      setIsPlaying(status.isPlaying);
    }
  };

  const playSong = async (song: Song) => {
    if (sound) {
      await sound.unloadAsync();
    }

    if (playlist.length === 0) {
      await loadPlaylist();
    }

    const index = playlist.findIndex((s) => s.uri === song.uri);
    if (index === -1) {
      currentIndex.current = 0;
    } else {
      currentIndex.current = index;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.uri },
      { shouldPlay: true }
    );

    newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

    setSound(newSound);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const pause = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resume = async () => {
    if (sound && !isPlaying) {
      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const playNext = async () => {
    if (playlist.length === 0) {
      await loadPlaylist();
      return;
    }
    if (currentIndex.current === -1) {
      currentIndex.current = 0;
    } else {
      currentIndex.current = (currentIndex.current + 1) % playlist.length;
    }
    const nextSong = playlist[currentIndex.current];
    await playSong(nextSong);
  };

  const playPrevious = async () => {
    if (playlist.length === 0) {
      await loadPlaylist();
      return;
    }
    if (currentIndex.current === -1) {
      currentIndex.current = 0;
    } else {
      currentIndex.current = (currentIndex.current - 1 + playlist.length) % playlist.length;
    }
    const prevSong = playlist[currentIndex.current];
    await playSong(prevSong);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        currentSong,
        playSong,
        pause,
        resume,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);