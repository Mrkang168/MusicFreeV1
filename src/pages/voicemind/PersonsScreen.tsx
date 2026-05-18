import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import Icon from '../../components/base/icon';
import MMKV from '../../utils/getOrCreateMMKV';

const storage = MMKV.getMMKV();

interface Person {
  id: string;
  name: string;
  role: string;
  company?: string;
  notes?: string;
  createdAt: string;
  lastSeen?: string;
  conversationCount: number;
}

const PersonsScreen = ({ navigation }) => {
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

  const [persons, setPersons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = () => {
    try {
      const stored = storage.getString('voicemind_persons');
      if (stored) {
        setPersons(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Load persons error:', err);
    }
  };

  const savePersons = (newPersons) => {
    try {
      storage.set('voicemind_persons', JSON.stringify(newPersons));
      setPersons(newPersons);
    } catch (err) {
      console.error('Save persons error:', err);
    }
  };

  const addPerson = () => {
    setEditingPerson(null);
    setFormData({ name: '', role: '', company: '', notes: '' });
    setModalVisible(true);
  };

  const editPerson = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      role: person.role,
      company: person.company || '',
      notes: person.notes || '',
    });
    setModalVisible(true);
  };

  const deletePerson = (person) => {
    Alert.alert(
      '删除确认',
      `确定要删除联系人 "${person.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const newPersons = persons.filter(p => p.id !== person.id);
            savePersons(newPersons);
          },
        },
      ]
    );
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('错误', '请输入姓名');
      return;
    }

    if (editingPerson) {
      const newPersons = persons.map(p =>
        p.id === editingPerson.id
          ? { ...p, ...formData, lastSeen: new Date().toISOString() }
          : p
      );
      savePersons(newPersons);
    } else {
      const newPerson = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        conversationCount: 0,
      };
      savePersons([...persons, newPerson]);
    }
    setModalVisible(false);
  };

  const filteredPersons = persons.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.company && person.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderPerson = ({ item }) => (
    <TouchableOpacity
      style={[styles.personCard, { backgroundColor: colors.card }]}
      onPress={() => editPerson(item)}
      onLongPress={() => deletePerson(item)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.personRole, { color: colors.subtext }]}>
          {item.role || '未分类'}
          {item.company && ` · ${item.company}`}
        </Text>
        <Text style={[styles.personStats, { color: colors.subtext }]}>
          {item.conversationCount} 次对话
          {item.lastSeen && ` · 最近: ${new Date(item.lastSeen).toLocaleDateString()}`}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={colors.subtext} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>人物管理</Text>
        <TouchableOpacity onPress={addPerson} style={styles.addButton}>
          <Icon name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Icon name="search" size={20} color={colors.subtext} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="搜索联系人..."
          placeholderTextColor={colors.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={colors.subtext} />
          </TouchableOpacity>
        )}
      </View>

      {filteredPersons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="users" size={64} color={colors.subtext} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? '未找到联系人' : '暂无联系人'}
          </Text>
          <Text style={[styles.emptyHint, { color: colors.subtext }]}>
            {searchQuery ? '尝试其他关键词' : '录音中的人物信息会自动添加到这里'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPersons}
          keyExtractor={(item) => item.id}
          renderItem={renderPerson}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={addPerson}
      >
        <Icon name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingPerson ? '编辑联系人' : '新增联系人'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>姓名 *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="输入姓名"
                placeholderTextColor={colors.subtext}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>身份/角色</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.role}
                onChangeText={(text) => setFormData({ ...formData, role: text })}
                placeholder="如：客户、同事、朋友"
                placeholderTextColor={colors.subtext}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>公司/组织</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.company}
                onChangeText={(text) => setFormData({ ...formData, company: text })}
                placeholder="输入公司名称"
                placeholderTextColor={colors.subtext}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.subtext }]}>备注</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="添加备注..."
                placeholderTextColor={colors.subtext}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: { padding: 8 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { padding: 16 },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  personInfo: { flex: 1, marginLeft: 12 },
  personName: { fontSize: 16, fontWeight: '600' },
  personRole: { fontSize: 13, marginTop: 2 },
  personStats: { fontSize: 11, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyHint: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, marginBottom: 6 },
  input: { padding: 12, borderRadius: 10, fontSize: 15 },
  textArea: { height: 80 },
  saveButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default PersonsScreen;
