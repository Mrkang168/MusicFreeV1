import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/uiConst';
import Icon from '../../components/base/icon';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';

const { VoiceModule } = NativeModules;

const VoiceMindHome = ({ navigation }) => {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    subtext: '#B3B3B3',
    primary: '#1DB954',
    error: '#FF4444',
  } : {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1A1A1A',
    subtext: '#666666',
    primary: '#1DB954',
    error: '#FF4444',
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recentRecordings, setRecentRecordings] = useState([]);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    checkPermissions();
    loadRecentRecordings();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const colors_theme = useColors();

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const audioPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        const storagePermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (audioPermission && storagePermission) {
          setPermissionGranted(true);
        }
      } else {
        setPermissionGranted(true);
      }
    } catch (err) {
      console.error('Permission check error:', err);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        if (
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          setPermissionGranted(true);
          Alert.alert('权限授予成功', '现在可以使用录音功能了');
        } else {
          Alert.alert(
            '权限不足',
            '请在设置中开启录音和存储权限',
            [
              { text: '取消', style: 'cancel' },
              { text: '去设置', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    } catch (err) {
      console.error('Permission request error:', err);
    }
  };

  const loadRecentRecordings = async () => {
    try {
      const audioDir = `${RNFS.DocumentDirectoryPath}/recordings`;
      const exists = await RNFS.exists(audioDir);
      
      if (exists) {
        const files = await RNFS.readDir(audioDir);
        const audioFiles = files
          .filter(file => file.name.endsWith('.m4a') || file.name.endsWith('.wav'))
          .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime())
          .slice(0, 3)
          .map(file => ({
            id: file.name,
            name: file.name.replace(/\.(m4a|wav)$/, ''),
            path: file.path,
            time: dayjs(file.mtime).format('MM-DD HH:mm'),
            size: file.size,
          }));
        
        setRecentRecordings(audioFiles);
      }
    } catch (err) {
      console.error('Load recordings error:', err);
    }
  };

  const toggleRecording = async () => {
    if (!permissionGranted) {
      requestPermissions();
      return;
    }

    try {
      if (isRecording) {
        await VoiceModule?.stopRecording();
        setIsRecording(false);
        setRecordingDuration(0);
        loadRecentRecordings();
      } else {
        const audioDir = `${RNFS.DocumentDirectoryPath}/recordings`;
        const dirExists = await RNFS.exists(audioDir);
        if (!dirExists) {
          await RNFS.mkdir(audioDir);
        }

        const timestamp = new Date().getTime();
        const filePath = `${audioDir}/recording_${timestamp}.m4a`;

        await VoiceModule?.startRecording(filePath);
        setIsRecording(true);
        setRecordingDuration(0);
      }
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('录音失败', '无法启动录音，请检查权限设置');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>VoiceMind</Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              你的第二大脑
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: colors.card }]}
            onPress={() => setIsDark(!isDark)}
          >
            <Icon
              name={isDark ? 'moon' : 'sun'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.recordSection}>
          <Animated.View
            style={[
              styles.recordButtonOuter,
              {
                backgroundColor: isRecording ? colors.error : colors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.recordButton,
                {
                  backgroundColor: isRecording ? colors.error : colors.primary,
                },
              ]}
              onPress={toggleRecording}
              activeOpacity={0.8}
            >
              <Icon
                name={isRecording ? 'pause' : 'mic'}
                size={48}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={[styles.recordStatus, { color: colors.subtext }]}>
            {isRecording ? '正在录音...' : '点击开始录音'}
          </Text>
          
          {isRecording && (
            <View style={[styles.durationBadge, { backgroundColor: colors.card }]}>
              <Icon name="clock" size={16} color={colors.error} />
              <Text style={[styles.duration, { color: colors.text }]}>
                {formatDuration(recordingDuration)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('recordings')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="folder" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>录音记录</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('ai-chat')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="chat" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>AI 对话</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('persons')}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="user" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>人物管理</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              最近录音
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('recordings')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                查看全部
              </Text>
            </TouchableOpacity>
          </View>

          {recentRecordings.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Icon name="mic" size={48} color={colors.subtext} />
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                暂无录音记录
              </Text>
              <Text style={[styles.emptyHint, { color: colors.subtext }]}>
                点击上方按钮开始录音
              </Text>
            </View>
          ) : (
            recentRecordings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.recordingItem, { backgroundColor: colors.card }]}
                onPress={() => Alert.alert('播放', `正在播放: ${item.name}`)}
              >
                <View style={[styles.recordingIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name="mic" size={20} color={colors.primary} />
                </View>
                <View style={styles.recordingInfo}>
                  <Text style={[styles.recordingName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.recordingMeta}>
                    <Text style={[styles.recordingTime, { color: colors.subtext }]}>
                      {item.time}
                    </Text>
                    <Text style={[styles.recordingSize, { color: colors.subtext }]}>
                      {formatFileSize(item.size)}
                    </Text>
                  </View>
                </View>
                <Icon name="play" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              快捷功能
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('ai-chat')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="chat" size={24} color="#2196F3" />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                智能问答
              </Text>
              <Text style={[styles.featureDesc, { color: colors.subtext }]}>
                基于录音内容回答问题
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('persons')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="user" size={24} color="#FF9800" />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                人物分析
              </Text>
              <Text style={[styles.featureDesc, { color: colors.subtext }]}>
                自动提取对话中的人物信息
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('settings')}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="settings" size={24} color="#4CAF50" />
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                设置中心
              </Text>
              <Text style={[styles.featureDesc, { color: colors.subtext }]}>
                自定义录音和隐私设置
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.settingsFab, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('settings')}
      >
        <Icon name="settings" size={20} color={colors.subtext} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const useColors = () => {
  const [isDark] = useState(true);
  return isDark ? {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    subtext: '#B3B3B3',
    primary: '#1DB954',
    error: '#FF4444',
  } : {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#1A1A1A',
    subtext: '#666666',
    primary: '#1DB954',
    error: '#FF4444',
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordButtonOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordStatus: {
    marginTop: 20,
    fontSize: 16,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  duration: {
    fontSize: 18,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    minWidth: 90,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  recordingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recordingName: {
    fontSize: 15,
    fontWeight: '500',
  },
  recordingMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  recordingTime: {
    fontSize: 12,
  },
  recordingSize: {
    fontSize: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  featureDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  settingsFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default VoiceMindHome;
