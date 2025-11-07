import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/hooks/useTranslation';
import { useBookmarks } from '@/providers/BookmarkProvider';
import { useCategories } from '@/providers/CategoryProvider';
import CategoryManagement from '@/components/CategoryManagement';
import { ChevronRight, Edit2, Heart, Eye, Cloud, Trash2, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Wallet {
  id: string;
  name: string;
  key: string;
}

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { bookmarks } = useBookmarks();
  const { getTotalVisibleFolderCount } = useCategories();
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([
    { id: '1', name: 'Wallet 1', key: 's***...**k' },
    { id: '2', name: 'Wallet 2', key: 's***...**k' },
    { id: '3', name: 'Wallet 3', key: 's***...**k' },
    { id: '4', name: 'Wallet 4', key: 's***...**k' },
  ]);
  const [importKey, setImportKey] = useState('');

  const handleAddWallet = useCallback(() => {
    const newWalletNumber = wallets.length + 1;
    const newWallet: Wallet = {
      id: Date.now().toString(),
      name: `Wallet ${newWalletNumber}`,
      key: 's***...**k',
    };
    setWallets([...wallets, newWallet]);
    Alert.alert('Success', 'New wallet added');
  }, [wallets]);

  const handleImportWallet = useCallback(() => {
    if (!importKey.trim()) {
      Alert.alert('Error', 'Please enter mnemonic, xprv or private key');
      return;
    }
    const newWalletNumber = wallets.length + 1;
    const newWallet: Wallet = {
      id: Date.now().toString(),
      name: `Wallet ${newWalletNumber}`,
      key: importKey.substring(0, 4) + '...' + importKey.substring(importKey.length - 2),
    };
    setWallets([...wallets, newWallet]);
    setImportKey('');
    Alert.alert('Success', 'Wallet imported successfully');
  }, [importKey, wallets]);

  const handleWalletAction = useCallback((walletId: string, action: 'view' | 'backup' | 'delete') => {
    switch (action) {
      case 'view':
        Alert.alert('View Wallet', `Viewing wallet ${walletId}`);
        break;
      case 'backup':
        Alert.alert('Backup Wallet', `Backing up wallet ${walletId}`);
        break;
      case 'delete':
        Alert.alert(
          'Delete Wallet',
          'Are you sure you want to delete this wallet?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => setWallets(wallets.filter(w => w.id !== walletId)),
            },
          ]
        );
        break;
    }
  }, [wallets]);

  const renderBookmarkItem = useCallback(({ item: bookmark }: { item: any }) => (
    <TouchableOpacity key={bookmark.id} style={styles.bookmarkItem}>
      <View style={styles.bookmarkContent}>
        <Heart size={20} color={Colors.danger} fill={Colors.danger} />
        <View style={[styles.bookmarkInfo, { marginLeft: 12 }]}>
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
        <View style={styles.walletSection}>
          <View style={styles.walletCardOuter}>
            <LinearGradient
              colors={['rgba(232, 28, 255, 0)', 'rgba(232, 28, 255, 0)', '#e81cff', '#40c9ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.35, 0.7, 1]}
              style={styles.walletCardGradient}
            >
              <View style={styles.walletCard}>
                <View style={styles.bitcoinIconContainer}>
                  <View style={styles.bitcoinIcon}>
                    <Text style={styles.bitcoinSymbol}>₿</Text>
                  </View>
                </View>
                <Text style={styles.walletsTitle}>Bitcoin Secure Key</Text>
                <View style={styles.walletList}>
                  {wallets.map((wallet) => (
                <View key={wallet.id} style={styles.walletItem}>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <Text style={styles.walletKey}>{wallet.key}</Text>
                  </View>
                  <View style={styles.walletActions}>
                    <TouchableOpacity
                      style={styles.walletActionButton}
                      onPress={() => handleWalletAction(wallet.id, 'view')}
                      activeOpacity={0.7}
                    >
                      <Eye size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.walletActionButton}
                      onPress={() => handleWalletAction(wallet.id, 'backup')}
                      activeOpacity={0.7}
                    >
                      <Cloud size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.walletActionButton}
                      onPress={() => handleWalletAction(wallet.id, 'delete')}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                </View>
                  ))}
                </View>
                <View style={styles.walletButtonRow}>
                  <TouchableOpacity
                    style={[styles.walletButton, styles.walletButtonAdd]}
                    onPress={handleAddWallet}
                    activeOpacity={0.95}
                  >
                    <Plus size={24} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.walletButtonImportWrapper}
                    onPress={handleImportWallet}
                    activeOpacity={0.95}
                  >
                    <LinearGradient
                      colors={['rgba(232, 28, 255, 0)', 'rgba(232, 28, 255, 0)', '#e81cff', '#40c9ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      locations={[0, 0.35, 0.7, 1]}
                      style={styles.walletButtonImportGradient}
                    >
                      <View style={styles.walletButtonImport}>
                        <Text style={styles.walletButtonText}>Import</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.walletInput}
                  value={importKey}
                  onChangeText={setImportKey}
                  placeholder="Enter mnemonic, xprv or paste private key"
                  placeholderTextColor="#666"
                  multiline
                />
              </View>
            </LinearGradient>
          </View>
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
              <View style={[styles.managementTextContainer, { marginLeft: 12 }]}>
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

      <CategoryManagement
        visible={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
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
  walletSection: {
    padding: 20,
    paddingBottom: 10,
  },
  walletCardOuter: {
    borderRadius: 24,
  },
  walletCardGradient: {
    borderRadius: 24,
    padding: 2,
  },
  walletCard: {
    backgroundColor: '#212121',
    borderRadius: 22,
    padding: 24,
  },
  bitcoinIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bitcoinIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  bitcoinSymbol: {
    fontSize: 48,
    color: '#ff6b35',
    fontWeight: '700' as const,
  },
  walletsTitle: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center' as const,
  },
  walletList: {
    marginBottom: 16,
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#414141',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  walletKey: {
    fontSize: 13,
    color: '#888',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  walletActions: {
    flexDirection: 'row',
  },
  walletActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  walletButtonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  walletButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButtonAdd: {
    backgroundColor: '#313131',
    borderWidth: 1,
    borderColor: '#414141',
    marginRight: 12,
  },
  walletButtonImportWrapper: {
    flex: 1,
    borderRadius: 12,
  },
  walletButtonImportGradient: {
    borderRadius: 12,
    padding: 2,
  },
  walletButtonImport: {
    backgroundColor: '#212121',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#717171',
  },
  walletInput: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#414141',
    minHeight: 96,
    textAlignVertical: 'top',
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
});
