import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from '../../components/base/icon';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';

const RecordingsScreen = ({ navigation }) => {
  const [isDark] = useState(true);
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

  const [recordings, setRecordings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecordings = async () => {
    try {
      const audioDir = `${RNFS.DocumentDirectoryPath}/recordings`;
      const exists = await RNFS.exists(audioDir);
      
      if (exists) {
        const files = await RNFS.readDir(audioDir);
        const audioFiles = files
          .filter(file => file.name.endsWith('.m4a') || file.name.endsWith('.wav'))
          .map(file => ({
            id: file.name,
            name: file.name.replace(/\.(m4a|wav)$/, ''),
            path: file.path,
            size: file.size,
            createdAt: dayjs(file.mtime).format('YYYY-MM-DD HH:mm'),
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        
        setRecordings(audioFiles);
      }
    } catch (err) {
      console.error('Load recordings error:', err);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecordings();
    setRefreshing(false);
  };

  const deleteRecording = (item) => {
    Alert.alert(
      '删除确认',
      `确定要删除录音 "${item.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await RNFS.unlink(item.path);
              await loadRecordings();
            } catch (err) {
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.recordingItem, { backgroundColor: colors.card }]}
      onPress={() => Alert.alert('播放录音', `正在播放: ${item.name}`)}
      onLongPress={() => deleteRecording(item)}
    >
      <View style={[styles.recordingIcon, { backgroundColor: colors.primary + '20' }]}>
        <Icon name="mic" size={24} color={colors.primary} />
      </View>
      <View style={styles.recordingInfo}>
        <Text style={[styles.recordingName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.recordingMeta}>
          <Text style={[styles.recordingDate, { color: colors.subtext }]}>
            {item.createdAt}
          </Text>
          <Text style={[styles.recordingSize, { color: colors.subtext }]}>
            {formatFileSize(item.size)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => Alert.alert('播放录音', `正在播放: ${item.name}`)}
      >
        <Icon name="play" size={20} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>录音记录</Text>
        <View style={{ width: 40 }} />
      </View>

      {recordings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder" size={64} color={colors.subtext} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>暂无录音</Text>
          <Text style={[styles.emptyHint, { color: colors.subtext }]}>
            点击底部录音按钮开始录制
          </Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {recordings.length > 0 && (
        <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsText, { color: colors.subtext }]}>
            共 {recordings.length} 条录音
          </Text>
          <Text style={[styles.statsText, { color: colors.subtext }]}>
            总计 {formatFileSize(recordings.reduce((sum, r) => sum + r.size, 0))}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  recordingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recordingName: {
    fontSize: 16,
    fontWeight: '500',
  },
  recordingMeta: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  recordingDate: {
    fontSize: 12,
  },
  recordingSize: {
    fontSize: 12,
  },
  playButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 8,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 14,
  },
});

export default RecordingsScreen;
