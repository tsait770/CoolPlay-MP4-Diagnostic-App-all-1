import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MP4Player from '@/components/MP4Player';
import { Play } from 'lucide-react-native';
import Colors from '@/constants/colors';

const TEST_VIDEOS = [
  {
    name: 'Big Buck Bunny (720p)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    name: 'Elephant Dream',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    name: 'Sintel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    name: 'Tears of Steel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  },
];

export default function MP4TestScreen() {
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');

  const handleLoadVideo = (url: string) => {
    console.log('[MP4Test] Loading video:', url);
    setCurrentVideo(url);
  };

  const handleCustomLoad = () => {
    if (!customUrl.trim()) {
      Alert.alert('錯誤', '請輸入影片URL');
      return;
    }
    handleLoadVideo(customUrl.trim());
  };

  const handleError = (error: string) => {
    console.error('[MP4Test] Player error:', error);
    Alert.alert('播放錯誤', error);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen 
        options={{
          title: 'MP4 播放測試',
          headerStyle: { backgroundColor: Colors.primary.bg },
          headerTintColor: Colors.primary.text,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>MP4 播放器測試</Text>
          <Text style={styles.subtitle}>使用優化的 MP4 播放器進行測試</Text>
        </View>

        {currentVideo ? (
          <View style={styles.playerSection}>
            <MP4Player
              uri={currentVideo}
              onError={handleError}
              onPlaybackStart={() => {
                console.log('[MP4Test] Playback started');
              }}
              autoPlay={true}
            />
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setCurrentVideo('')}
            >
              <Text style={styles.clearButtonText}>清除影片</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Play size={48} color={Colors.primary.textSecondary} />
            <Text style={styles.placeholderText}>選擇測試影片</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>測試影片</Text>
          {TEST_VIDEOS.map((video, index) => (
            <TouchableOpacity
              key={index}
              style={styles.testVideoCard}
              onPress={() => handleLoadVideo(video.url)}
            >
              <Play size={20} color={Colors.accent.primary} />
              <Text style={styles.testVideoName}>{video.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自訂 URL</Text>
          <TextInput
            style={styles.input}
            placeholder="輸入 MP4 影片 URL"
            placeholderTextColor={Colors.primary.textSecondary}
            value={customUrl}
            onChangeText={setCustomUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            style={[styles.loadButton, !customUrl.trim() && styles.loadButtonDisabled]}
            onPress={handleCustomLoad}
            disabled={!customUrl.trim()}
          >
            <Text style={styles.loadButtonText}>載入影片</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>測試說明</Text>
          <Text style={styles.infoText}>1. 點擊測試影片載入</Text>
          <Text style={styles.infoText}>2. 或輸入自訂 MP4 URL</Text>
          <Text style={styles.infoText}>3. 檢查播放是否正常</Text>
          <Text style={styles.infoText}>4. 查看控制台日誌了解詳細信息</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    textAlign: 'center',
  },
  playerSection: {
    marginBottom: 24,
  },
  clearButton: {
    marginTop: 12,
    backgroundColor: Colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    height: 200,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.card.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  testVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondary.bg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  testVideoName: {
    fontSize: 14,
    color: Colors.primary.text,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.primary.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 12,
  },
  loadButton: {
    backgroundColor: Colors.accent.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadButtonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
});
