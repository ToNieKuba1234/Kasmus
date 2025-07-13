import React, { useState, useRef } from 'react';
import {
  ScrollView, Text, TextInput, TouchableOpacity,
  View, Linking, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';

import getYoutubeLink from '../hooks/useYoutubeSearch';
import Song from '../models/Song';
import addSong from '../utils/storage';
import alert from '../utils/alert';

export default function DownloadScreen() {
  const [searchText, setSearchText] = useState('');
  const isLoadingRef = useRef(false);
  const forceUpdate = useState(0)[1];

  const handleSearch = async () => {
    if (!searchText.trim() || isLoadingRef.current) return;

    isLoadingRef.current = true;
    forceUpdate(n => n + 1);

    const query = searchText.trim();
    setSearchText('');

    const videoLink = await getYoutubeLink(query);
    if (!videoLink) {
      alert("Nie udało się znaleźć linku.");
      isLoadingRef.current = false;
      forceUpdate(n => n + 1);
      return;
    }

    await Clipboard.setStringAsync(videoLink);

    const lastMp3 = await getLatestMp3Info();

    Linking.openURL("https://y2mate.as/");

    waitForNewFile(query, lastMp3).finally(() => {
      isLoadingRef.current = false;
      forceUpdate(n => n + 1);
    });
  };

  const waitForNewFile = async (query: string, previous: Mp3Info | null) => {
    const intervalTime = 1000;
    const maxTime = 30 * intervalTime;
    const startTime = Date.now();

    for (let i = 0; i < maxTime / intervalTime; i++) {
      const current = await getLatestMp3Info();

      if (current && isNewFile(current, previous, startTime)) {

        const [title, artist] = query.split(" - ");
        const duration = await getMp3Duration(current.uri);
        const newSong = new Song(title.trim(), artist.trim(), duration, current.uri);
        await addSong(newSong);
        return;
      }

      await new Promise(res => setTimeout(res, intervalTime));
    }

    alert("Nie wykryto nowej piosenki.");
  };

  type Mp3Info = { id: string, uri: string, modificationTime: number };

  const getLatestMp3Info = async (): Promise<Mp3Info | null> => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return null;

    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.audio,
      sortBy: [MediaLibrary.SortBy.modificationTime],
      first: 10,
    });

    const downloadAssets = assets.filter(asset =>
      asset.uri.toLowerCase().includes('/download/') &&
      asset.filename.toLowerCase().endsWith('.mp3')
    );

    const asset = downloadAssets[0]; 
    if (asset) {
      return {
        id: asset.id,
        uri: asset.uri,
        modificationTime: new Date(asset.modificationTime ?? 0).getTime(),
      };
    }

    return null;
  };

  const isNewFile = (
    current: Mp3Info,
    previous: Mp3Info | null,
    afterTime: number
  ) => {
    return (
      (!previous || current.id !== previous.id) &&
      current.modificationTime > afterTime
    );
  };

  const getMp3Duration = async (uri: string): Promise<number> => {
    const { sound, status } = await Audio.Sound.createAsync({ uri }, {}, null, false);
    const duration = status.isLoaded ? (status.durationMillis ?? 0) : 0;
    await sound.unloadAsync();
    return duration;
  };

  return (
    <ScrollView className="flex-1 px-4 pt-16 bg-black">
      <Text className="mb-4 font-sans text-4xl font-bold text-white">Download</Text>

      <View className="flex-row items-center h-12 px-3 mb-6 rounded-md bg-zinc-900">
        <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 font-sans text-lg text-white"
          placeholder="Enter song name"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <TouchableOpacity
        onPress={handleSearch}
        disabled={isLoadingRef.current}
        className="items-center self-center justify-center w-2/3 p-3 mb-8 rounded-md bg-zinc-900"
      >
        {isLoadingRef.current ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <View className="flex-row items-center">
            <Ionicons name="cloud-download-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
            <Text className="font-sans font-medium text-red-500">Download</Text>
          </View>
        )}
      </TouchableOpacity>

      <View className="p-4 mt-96 rounded-2xl">
        <Text className="mb-3 font-sans text-xl font-bold text-center text-white">HOW TO DOWNLOAD A SONG?</Text>
        <Text className="mb-2 font-sans text-center text-zinc-300">
          1. Enter the <Text className="text-red-400">EXACT</Text> song <Text className="text-red-400">title</Text> and <Text className="text-red-400">artist</Text> like this: &quot;[Title] - [Artist]&quot; then tap <Text className="text-red-400">Download</Text>.
        </Text>
        <Text className="mb-2 font-sans text-center text-zinc-300">
          2. <Text className="text-red-400">Youtube URL</Text> is automatically copied — paste it into the downloading software.
        </Text>
        <Text className="font-sans text-center text-zinc-300">
          3. Enjoy your best <Text className="text-red-400">free</Text> music!
        </Text>
      </View>
    </ScrollView>
  );
}