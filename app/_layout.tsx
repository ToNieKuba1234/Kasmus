import '@/globalTextPatch';

import { Stack } from 'expo-router';
import './globals.css';
import { useFonts } from 'expo-font';
import { AudioPlayerProvider, useAudioPlayer } from './context/AudioPlayerContext';
import MusicPlayer from './components/MusicPlayer';
import { View, Platform } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SFPro: require('../assets/fonts/SF Pro Display Medium.otf'),
    SFProBold: require('../assets/fonts/SF Pro Display Bold.otf'),
  });

  if (!fontsLoaded) return null;

  return (
    <AudioPlayerProvider>
      <View className="flex-1">
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <AudioPlayerWrapper />
      </View>
    </AudioPlayerProvider>
  );
}

function AudioPlayerWrapper() {
  const { currentSong } = useAudioPlayer();

  if (!currentSong) return null;

  return (
    <View className={`absolute left-3 right-3 ${Platform.OS === 'ios' ? 'bottom-24' : 'bottom-20'} rounded-xl justify-center`}>
      <MusicPlayer song={currentSong} />
    </View>
  );
}
