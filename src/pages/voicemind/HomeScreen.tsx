import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useColors } from '../hooks/useColors';
import Icon from '../components/base/icon';
import { Colors } from '../constants/uiConst';
import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

const { VoiceModule } = NativeModules;

const HomeScreen = ({ navigation }) => {
  const colors = useColors();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    checkPermissions();
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
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

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

  const toggleRecording = useCallback(async () => {
    if (!permissionGranted) {
      requestPermissions();
      return;
    }

    try {
      if (isRecording) {
        await VoiceModule?.stopRecording();
        setIsRecording(false);
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
  }, [isRecording, permissionGranted]);

  const navigateToRecordings = () => {
    navigation.navigate('Recordings');
  };

  const navigateToChat = () => {
    navigation.navigate('AIChat');
  };

  const navigateToPersons = () => {
    navigation.navigate('Persons');
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>VoiceMind</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          你的第二大脑
        </Text>
      </View>

      <View style={styles.recordButtonContainer}>
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
              name={isRecording ? 'pause' : 'play'}
              size={40}
              color={Colors.white}
            />
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.recordStatus, { color: colors.subtext }]}>
          {isRecording ? '正在录音...' : '点击开始录音'}
        </Text>
        {isRecording && (
          <Text style={[styles.duration, { color: colors.text }]}>
            {Math.floor(recordingDuration / 60)}:
            {String(recordingDuration % 60).padStart(2, '0')}
          </Text>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card }]}
          onPress={navigateToRecordings}
        >
          <Icon name="folder" size={28} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            录音记录
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card }]}
          onPress={navigateToChat}
        >
          <Icon name="chat" size={28} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            AI 对话
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.card }]}
          onPress={navigateToPersons}
        >
          <Icon name="user" size={28} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.text }]}>
            人物管理
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            最近录音
          </Text>
          <TouchableOpacity onPress={navigateToRecordings}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              查看全部
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Icon name="mic" size={48} color={colors.subtext} />
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            暂无录音记录
          </Text>
          <Text style={[styles.emptyHint, { color: colors.subtext }]}>
            点击上方按钮开始录音
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: colors.card }]}
        onPress={navigateToSettings}
      >
        <Icon name="settings" size={24} color={colors.subtext} />
        <Text style={[styles.settingsText, { color: colors.subtext }]}>
          设置
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  recordButtonContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordButtonOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordStatus: {
    marginTop: 16,
    fontSize: 14,
  },
  duration: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  quickAction: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
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
  },
  emptyState: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyHint: {
    marginTop: 4,
    fontSize: 12,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  settingsText: {
    fontSize: 14,
  },
});

export default HomeScreen;
