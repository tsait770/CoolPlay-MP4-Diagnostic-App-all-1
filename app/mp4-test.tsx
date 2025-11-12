import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import MP4Player from '@/components/MP4Player';
import { Play, TestTube2, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { testVideoUrl, formatTestResult, type VideoUrlTestResult } from '@/utils/videoUrlTester';

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
  const router = useRouter();
  const params = useLocalSearchParams();
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [testResult, setTestResult] = useState<VideoUrlTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (params.url && typeof params.url === 'string') {
      const decodedUrl = decodeURIComponent(params.url);
      setCustomUrl(decodedUrl);
      handleLoadVideo(decodedUrl);
    }
  }, [params.url]);

  const handleLoadVideo = (url: string) => {
    console.log('[MP4Test] Loading video:', url);
    setCurrentVideo(url);
  };

  const handleTestUrl = async () => {
    if (!customUrl.trim()) {
      Alert.alert('錯誤', '請輸入影片URL');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testVideoUrl(customUrl.trim());
      setTestResult(result);

      if (!result.accessible) {
        Alert.alert(
          '無法訪問視頻',
          `${result.error}\n\n請檢查：\n1. URL是否正確\n2. 網絡連接\n3. 視頻是否存在`,
          [{ text: '確定' }]
        );
      } else {
        Alert.alert(
          '測試成功',
          formatTestResult(result),
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '載入視頻', 
              onPress: () => handleLoadVideo(customUrl.trim())
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('測試失敗', error instanceof Error ? error.message : String(error));
    } finally {
      setIsTesting(false);
    }
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
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ marginLeft: 12, padding: 8 }}
            >
              <ArrowLeft size={24} color={Colors.primary.text} />
            </TouchableOpacity>
          ),
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
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.testButton, !customUrl.trim() && styles.buttonDisabled]}
              onPress={handleTestUrl}
              disabled={!customUrl.trim() || isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <TestTube2 size={20} color="#fff" />
              )}
              <Text style={styles.buttonText}>測試</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loadButton, !customUrl.trim() && styles.buttonDisabled]}
              onPress={handleCustomLoad}
              disabled={!customUrl.trim()}
            >
              <Play size={20} color="#fff" />
              <Text style={styles.buttonText}>載入影片</Text>
            </TouchableOpacity>
          </View>

          {testResult && (
            <View style={[
              styles.testResultCard,
              testResult.accessible ? styles.testResultSuccess : styles.testResultError
            ]}>
              <Text style={styles.testResultText}>
                {formatTestResult(testResult)}
              </Text>
            </View>
          )}
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  loadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: Colors.primary.textSecondary,
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testResultCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  testResultSuccess: {
    backgroundColor: '#10b98120',
    borderColor: '#10b981',
  },
  testResultError: {
    backgroundColor: '#ef444420',
    borderColor: '#ef4444',
  },
  testResultText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary.text,
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
