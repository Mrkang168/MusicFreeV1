import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Icon from '../../components/base/icon';
import MMKV from '../../utils/getOrCreateMMKV';

const storage = MMKV.getMMKV();

const SettingsScreen = ({ navigation }) => {
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

  const [settings, setSettings] = useState({
    autoRecord: false,
    noiseReduction: true,
    cloudSync: false,
    notifications: true,
  });
  const [storageUsed, setStorageUsed] = useState('0 MB');

  useEffect(() => {
    loadSettings();
    calculateStorage();
  }, []);

  const loadSettings = () => {
    try {
      const stored = storage.getString('voicemind_settings');
      if (stored) {
        setSettings({ ...settings, ...JSON.parse(stored) });
      }
    } catch (err) {
      console.error('Load settings error:', err);
    }
  };

  const saveSettings = (newSettings) => {
    try {
      storage.set('voicemind_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const calculateStorage = async () => {
    try {
      const { default: RNFS } = require('react-native-fs');
      const audioDir = `${RNFS.DocumentDirectoryPath}/recordings`;
      const exists = await RNFS.exists(audioDir);
      
      if (exists) {
        const files = await RNFS.readDir(audioDir);
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        setStorageUsed(formatBytes(totalSize));
      }
    } catch (err) {
      console.error('Calculate storage error:', err);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearAllData = () => {
    Alert.alert(
      '清除所有数据',
      '确定要清除所有录音记录和设置吗？此操作不可撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { default: RNFS } = require('react-native-fs');
              const audioDir = `${RNFS.DocumentDirectoryPath}/recordings`;
              const exists = await RNFS.exists(audioDir);
              
              if (exists) {
                await RNFS.unlink(audioDir);
                await RNFS.mkdir(audioDir);
              }
              
              storage.delete('voicemind_persons');
              storage.delete('voicemind_settings');
              
              Alert.alert('成功', '所有数据已清除');
              calculateStorage();
            } catch (err) {
              console.error('Clear data error:', err);
              Alert.alert('错误', '清除数据失败');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.subtext }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent || (onPress && (
        <Icon name="chevron-right" size={20} color={colors.subtext} />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>设置</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>录音设置</Text>
          
          <SettingItem
            icon="waveform"
            title="自动录音"
            subtitle="检测到声音时自动开始录音"
            rightComponent={
              <Switch
                value={settings.autoRecord}
                onValueChange={(value) => saveSettings({ ...settings, autoRecord: value })}
                trackColor={{ false: colors.subtext + '40', true: colors.primary + '80' }}
                thumbColor={settings.autoRecord ? colors.primary : '#f4f3f4'}
              />
            }
          />

          <SettingItem
            icon="waveform"
            title="降噪处理"
            subtitle="自动过滤环境噪音"
            rightComponent={
              <Switch
                value={settings.noiseReduction}
                onValueChange={(value) => saveSettings({ ...settings, noiseReduction: value })}
                trackColor={{ false: colors.subtext + '40', true: colors.primary + '80' }}
                thumbColor={settings.noiseReduction ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>隐私与安全</Text>
          
          <SettingItem
            icon="lock"
            title="本地存储"
            subtitle="所有数据仅存储在本地设备"
            rightComponent={
              <Icon name="check" size={20} color={colors.primary} />
            }
          />

          <SettingItem
            icon="cloud-off"
            title="云同步"
            subtitle="暂未开放"
            rightComponent={
              <Switch
                value={settings.cloudSync}
                onValueChange={(value) => {
                  if (value) {
                    Alert.alert('提示', '云同步功能正在开发中，敬请期待');
                  }
                  saveSettings({ ...settings, cloudSync: false });
                }}
                trackColor={{ false: colors.subtext + '40', true: colors.primary + '80' }}
                thumbColor={settings.cloudSync ? colors.primary : '#f4f3f4'}
                disabled
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>通知</Text>
          
          <SettingItem
            icon="bell"
            title="提醒通知"
            subtitle="待办事项和定时提醒"
            rightComponent={
              <Switch
                value={settings.notifications}
                onValueChange={(value) => saveSettings({ ...settings, notifications: value })}
                trackColor={{ false: colors.subtext + '40', true: colors.primary + '80' }}
                thumbColor={settings.notifications ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>外观</Text>
          
          <SettingItem
            icon="moon"
            title="深色模式"
            subtitle="切换应用外观"
            rightComponent={
              <Switch
                value={isDark}
                onValueChange={() => setIsDark(!isDark)}
                trackColor={{ false: colors.subtext + '40', true: colors.primary + '80' }}
                thumbColor={isDark ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>存储</Text>
          
          <SettingItem
            icon="database"
            title="存储使用"
            subtitle={storageUsed}
          />

          <SettingItem
            icon="trash"
            title="清除所有数据"
            subtitle="删除所有录音和设置"
            onPress={clearAllData}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>关于</Text>
          
          <SettingItem
            icon="info"
            title="版本"
            subtitle="1.0.0"
          />

          <SettingItem
            icon="document"
            title="用户协议"
            onPress={() => Alert.alert('提示', '用户协议页面开发中')}
          />

          <SettingItem
            icon="shield"
            title="隐私政策"
            onPress={() => Alert.alert('提示', '隐私政策页面开发中')}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            VoiceMind - 你的第二大脑
          </Text>
          <Text style={[styles.footerText, { color: colors.subtext }]}>
            隐私优先 · 本地存储 · 智能分析
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 16, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  footer: { alignItems: 'center', padding: 30 },
  footerText: { fontSize: 12, marginBottom: 4 },
});

export default SettingsScreen;
