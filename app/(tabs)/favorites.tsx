import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { useTranslation } from '@/hooks/useTranslation';
import { useBookmarks } from '@/providers/BookmarkProvider';
import { useCategories } from '@/providers/CategoryProvider';
import { useBitcoinWallet } from '@/providers/BitcoinWalletProvider';
import CategoryManagement from '@/components/CategoryManagement';
import BitcoinWalletCard from '@/components/BitcoinWalletCard';
import CreateWalletModal from '@/components/CreateWalletModal';
import ImportWalletModal from '@/components/ImportWalletModal';
import { Folder, ChevronRight, Trash2, FolderPlus, Edit2, Heart, BookOpen, Plus, Upload } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { bookmarks, addFolder, deleteFolder, editFolder, deleteAllFolders, getFoldersByCategory, getBookmarksByFolder } = useBookmarks();
  const { categories, getVisibleCategories, getTotalVisibleFolderCount } = useCategories();
  const { wallets, loading: walletsLoading } = useBitcoinWallet();
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [addFolderCategory, setAddFolderCategory] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showImportWallet, setShowImportWallet] = useState(false);
  
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 768;

  const visibleCategories = useMemo(() => getVisibleCategories(), [getVisibleCategories]);

  const categoryFolderData = useMemo(() => {
    return visibleCategories.map(category => {
      const categoryFolders = getFoldersByCategory(category.id);
      const bookmarkCount = categoryFolders.reduce((total: number, folder: any) => {
        return total + getBookmarksByFolder(folder.id).length;
      }, 0);
      
      return {
        ...category,
        folders: categoryFolders,
        folderCount: categoryFolders.length,
        bookmarkCount,
      };
    });
  }, [visibleCategories, getFoldersByCategory, getBookmarksByFolder]);

  const handleFolderPress = useCallback((folderId: string) => {
    setSelectedFolder(folderId);
    console.log(`Selected folder: ${folderId}`);
  }, []);

  const handleAddFolder = useCallback(() => {
    if (!newFolderName.trim() || !addFolderCategory) {
      Alert.alert(t('error'), t('folder_name_required'));
      return;
    }

    const category = categories.find(c => c.id === addFolderCategory);
    if (!category) return;

    const result = addFolder(addFolderCategory, newFolderName);
    if (result) {
      setNewFolderName('');
      setShowAddFolderModal(false);
      setAddFolderCategory(null);
    }
  }, [newFolderName, addFolderCategory, categories, addFolder, t]);

  const handleEditFolder = useCallback(() => {
    if (!editingFolderName.trim() || !editingFolderId) {
      Alert.alert(t('error'), t('folder_name_required'));
      return;
    }

    editFolder(editingFolderId, editingFolderName);
    setEditingFolderName('');
    setEditingFolderId(null);
    setShowEditFolderModal(false);
  }, [editingFolderName, editingFolderId, editFolder, t]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    Alert.alert(
      t('confirm_delete'),
      t('confirm_delete_folder_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => deleteFolder(folderId)
        }
      ]
    );
  }, [deleteFolder, t]);

  const handleDeleteAllFolders = useCallback(() => {
    Alert.alert(
      t('confirm_delete_all'),
      t('confirm_delete_all_folders_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete_all'), 
          style: 'destructive',
          onPress: () => deleteAllFolders()
        }
      ]
    );
  }, [deleteAllFolders, t]);

  const openEditModal = useCallback((folderId: string, folderName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(folderName);
    setShowEditFolderModal(true);
  }, []);

  const handleExportFolder = useCallback(async (folderId: string, folderName: string, format: 'html' | 'json') => {
    console.log(`Export folder ${folderId} as ${format}`);
    Alert.alert(t('info'), `Export ${folderName} as ${format} - Feature coming soon!`);
  }, [t]);

  const showFolderOptions = useCallback((folder: any) => {
    Alert.alert(
      t('folder_options'),
      '',
      [
        { text: t('edit'), onPress: () => openEditModal(folder.id, folder.name) },
        { text: 'Export HTML', onPress: () => handleExportFolder(folder.id, folder.name, 'html') },
        { text: 'Export JSON', onPress: () => handleExportFolder(folder.id, folder.name, 'json') },
        { text: t('delete'), style: 'destructive', onPress: () => handleDeleteFolder(folder.id) },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  }, [openEditModal, handleExportFolder, handleDeleteFolder, t]);

  const renderFolderItem = useCallback(({ item: folder }: { item: any }) => {
    const bookmarkCount = getBookmarksByFolder(folder.id).length;
    return (
      <TouchableOpacity
        key={folder.id}
        style={styles.folderItem}
        onPress={() => handleFolderPress(folder.id)}
        onLongPress={() => showFolderOptions(folder)}
        activeOpacity={0.7}
      >
        <View style={styles.folderContent}>
          <Folder size={20} color={Colors.primary.accent} />
          <Text style={styles.folderName}>{folder.name}</Text>
        </View>
        <View style={styles.folderRight}>
          <Text style={styles.folderCount}>{bookmarkCount}</Text>
          <ChevronRight size={20} color={Colors.primary.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  }, [getBookmarksByFolder, handleFolderPress, showFolderOptions]);

  const renderBookmarkItem = useCallback(({ item: bookmark }: { item: any }) => (
    <TouchableOpacity key={bookmark.id} style={styles.bookmarkItem}>
      <View style={styles.bookmarkContent}>
        <Heart size={20} color={Colors.danger} fill={Colors.danger} />
        <View style={styles.bookmarkInfo}>
          <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
          <Text style={styles.bookmarkUrl} numberOfLines={1}>{bookmark.url}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.primary.textSecondary} />
    </TouchableOpacity>
  ), []);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bitcoinSection}>
          <View style={styles.bitcoinHeader}>
            <View style={styles.bitcoinTitleRow}>
              <Text style={styles.bitcoinTitle}>{t('bitcoin_wallets')}</Text>
              <View style={styles.bitcoinBadge}>
                <Text style={styles.bitcoinBadgeText}>₿</Text>
              </View>
            </View>
            <Text style={styles.bitcoinSubtitle}>{t('secure_key_management')}</Text>
          </View>

          {walletsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : wallets.length > 0 ? (
            <View style={styles.walletsContainer}>
              {wallets.map((wallet) => (
                <BitcoinWalletCard key={wallet.id} wallet={wallet} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyWalletsContainer}>
              <Text style={styles.emptyWalletsText}>{t('no_wallets_yet')}</Text>
              <Text style={styles.emptyWalletsSubtext}>{t('create_or_import_wallet')}</Text>
            </View>
          )}

          <View style={styles.bitcoinActions}>
            <TouchableOpacity
              style={styles.bitcoinActionButton}
              onPress={() => setShowCreateWallet(true)}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#212121" />
              <Text style={styles.bitcoinActionText}>{t('create_wallet')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bitcoinActionButton, styles.bitcoinActionButtonSecondary]}
              onPress={() => setShowImportWallet(true)}
              activeOpacity={0.7}
            >
              <Upload size={20} color="#fff" />
              <Text style={[styles.bitcoinActionText, styles.bitcoinActionTextSecondary]}>{t('import_wallet')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>{t('bookmark_folders')}</Text>
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={() => {
                console.log('[Favorites] Delete all button pressed');
                handleDeleteAllFolders();
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={16} color={Colors.danger} />
              <Text style={styles.deleteAllText}>{t('delete_all')}</Text>
            </TouchableOpacity>
          </View>
          
          {categoryFolderData.map(category => (
            <View key={category.id} style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryTitleContainer}>
                  <BookOpen size={18} color={Colors.primary.accent} />
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  <Text style={styles.categoryBadge}>{category.folderCount}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    console.log('[Favorites] Add folder button pressed for category:', category.id);
                    setAddFolderCategory(category.id);
                    setShowAddFolderModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <FolderPlus size={18} color={Colors.primary.accent} />
                </TouchableOpacity>
              </View>
              
              {category.folders.length > 0 ? (
                <FlatList
                  data={category.folders}
                  renderItem={renderFolderItem}
                  keyExtractor={(folder) => folder.id}
                  scrollEnabled={false}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={3}
                  windowSize={2}
                  initialNumToRender={3}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('no_folders_yet')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('favorite_bookmarks')}</Text>
          {bookmarks.filter(b => b.favorite).length > 0 ? (
            <FlatList
              data={bookmarks.filter(b => b.favorite)}
              renderItem={renderBookmarkItem}
              keyExtractor={(bookmark) => bookmark.id}
              scrollEnabled={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              windowSize={2}
              initialNumToRender={5}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('no_favorites')}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('management')}</Text>
          <TouchableOpacity
            style={styles.managementItem}
            onPress={() => {
              console.log('[Favorites] Category management button pressed');
              setShowCategoryManagement(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.managementContent}>
              <Edit2 size={20} color={Colors.primary.accent} />
              <View style={styles.managementTextContainer}>
                <Text style={styles.managementText}>{t('manage_categories')}</Text>
                <Text style={styles.managementSubtext}>
                  {getTotalVisibleFolderCount()} {t('categories')}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showAddFolderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddFolderModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowAddFolderModal(false);
              setNewFolderName('');
              setAddFolderCategory(null);
            }}
          >
            <View style={[styles.modalContent, isTablet && styles.modalContentTablet]} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>{t('add_new_folder')}</Text>
              
              <TextInput
                style={styles.input}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder={t('folder_name')}
                placeholderTextColor="#999"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={handleAddFolder}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>{t('add')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowAddFolderModal(false);
                    setNewFolderName('');
                    setAddFolderCategory(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditFolderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditFolderModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowEditFolderModal(false);
              setEditingFolderName('');
              setEditingFolderId(null);
            }}
          >
            <View style={[styles.modalContent, isTablet && styles.modalContentTablet]} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>{t('edit_folder')}</Text>
              
              <TextInput
                style={styles.input}
                value={editingFolderName}
                onChangeText={setEditingFolderName}
                placeholder={t('folder_name')}
                placeholderTextColor="#999"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={handleEditFolder}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>{t('save')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowEditFolderModal(false);
                    setEditingFolderName('');
                    setEditingFolderId(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <CategoryManagement
        visible={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
      />

      <CreateWalletModal
        visible={showCreateWallet}
        onClose={() => setShowCreateWallet(false)}
      />

      <ImportWalletModal
        visible={showImportWallet}
        onClose={() => setShowImportWallet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
  },
  bitcoinSection: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#0a0a0a',
  },
  bitcoinHeader: {
    marginBottom: 20,
  },
  bitcoinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bitcoinTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginRight: 12,
  },
  bitcoinBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F57C4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bitcoinBadgeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  bitcoinSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  walletsContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
  emptyWalletsContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#323232',
    borderStyle: 'dashed',
  },
  emptyWalletsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#999',
    marginBottom: 8,
  },
  emptyWalletsSubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center' as const,
  },
  bitcoinActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bitcoinActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  bitcoinActionButtonSecondary: {
    backgroundColor: '#323232',
    borderWidth: 1,
    borderColor: '#414141',
  },
  bitcoinActionText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#212121',
  },
  bitcoinActionTextSecondary: {
    color: '#fff',
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 6,
  },
  deleteAllText: {
    color: Colors.danger,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500' as const,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.secondary.bg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.primary.accent,
    color: Colors.primary.bg,
    fontSize: 12,
    fontWeight: '600' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center' as const,
  },
  addButton: {
    padding: 4,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  folderName: {
    fontSize: 15,
    color: Colors.primary.text,
    flex: 1,
  },
  folderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  folderCount: {
    fontSize: 14,
    color: Colors.primary.textSecondary,
    backgroundColor: 'rgba(108, 212, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  bookmarkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    color: Colors.primary.text,
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  bookmarkUrl: {
    color: Colors.primary.textSecondary,
    fontSize: 13,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondary.bg,
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  managementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  managementTextContainer: {
    flex: 1,
  },
  managementText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary.text,
  },
  managementSubtext: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    backgroundColor: Colors.secondary.bg,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.primary.textSecondary,
    fontSize: 14,
    fontStyle: 'italic' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  modalContentTablet: {
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary.text,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  input: {
    backgroundColor: Colors.primary.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.primary.text,
    borderWidth: 1,
    borderColor: Colors.card.border,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  modalButtonText: {
    color: Colors.primary.bg,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  modalCancelButton: {
    backgroundColor: Colors.card.border,
  },
  modalCancelText: {
    color: Colors.primary.text,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
});
