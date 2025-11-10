import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  FlatList,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import {
  Bookmark,
  Search,
  Globe,
  Folder,
  Star,
  Copy,
  ExternalLink,
  Trash2,
  Plus,
  MoreVertical,
  Edit2,
  FileInput,
  FileEdit,
  Sparkles,
  Trash,
  Check,
  X,
  ChevronRight,
  Clock,
  TrendingUp,
  Home as HomeIcon,
  Play,
  FolderPlus,
  Move,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Crown,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { DesignTokens } from "@/constants/designTokens";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useBookmarks } from "@/providers/BookmarkProvider";
import { useReferral } from "@/providers/ReferralProvider";
import { useCategories } from "@/providers/CategoryProvider";
import { useMembership } from "@/providers/MembershipProvider";
import ReferralCodeModal from "@/components/ReferralCodeModal";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { useStorage } from "@/providers/StorageProvider";
import { 
  getScreenType, 
  getResponsiveFontSize, 
  getResponsivePadding, 
  getMaxWidth,
  getColumnCount,
  responsiveValue 
} from "@/utils/responsive";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const maxWidth = getMaxWidth();
const screenType = getScreenType();

// Helper to get cache directory safely
const getCacheDirectory = () => {
  try {
    // For web, we can't use file system
    if (Platform.OS === 'web') {
      return null;
    }
    // Use the FileSystem API
    return FileSystem.cacheDirectory || null;
  } catch (error) {
    console.error('Error getting cache directory:', error);
    return null;
  }
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userData } = useReferral();
  const { categories, getTotalVisibleFolderCount } = useCategories();
  const { getItem, setItem } = useStorage();
  const { tier, getRemainingUsage } = useMembership();
  const remainingUsage = getRemainingUsage();
  const {
    bookmarks,
    folders,
    currentFolder,
    searchQuery,
    isLoading,
    setCurrentFolder,
    setSearchQuery,
    addBookmark,
    deleteBookmark,
    toggleFavorite,
    addFolder,
    deleteFolder,
    editFolder,
    moveBookmarkToFolder,
    smartCategorize,
    restoreOriginalBookmarks,
    cleanupBookmarks,
    importBookmarks,
    exportBookmarks,
    getFilteredBookmarks,
    getStats,
    originalBookmarks,
    exportFolderBookmarks,
  } = useBookmarks();

  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [hasCheckedReferralModal, setHasCheckedReferralModal] = useState(false);
  const [hasShownFirstTimeModal, setHasShownFirstTimeModal] = useState(false);

  // Animation values (reduced for performance)
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const stats = useMemo(() => {
    const baseStats = getStats();
    return {
      ...baseStats,
      totalFolders: getTotalVisibleFolderCount(),
    };
  }, [getStats, getTotalVisibleFolderCount]);
  
  const filteredBookmarks = useMemo(() => getFilteredBookmarks(), [getFilteredBookmarks]);

  useEffect(() => {
    // Reduced animation for better performance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Check if we should show referral modal on first login (only once per app install)
    const checkReferralModal = async () => {
      if (!hasCheckedReferralModal) {
        setHasCheckedReferralModal(true);
        
        // Check if we've already shown the first-time modal
        try {
          const hasShown = await getItem('@coolplay_first_time_modal_shown');
          if (!hasShown && !userData.hasUsedReferralCode) {
            const timer = setTimeout(() => {
              setShowReferralModal(true);
              setHasShownFirstTimeModal(true);
              // Mark as shown so it won't appear again
              setItem('@coolplay_first_time_modal_shown', 'true');
            }, 2000); // Show after 2 seconds
            return () => clearTimeout(timer);
          }
        } catch (error) {
          console.error('Error checking first-time modal status:', error);
        }
      }
    };
    
    checkReferralModal();
  }, [userData.hasUsedReferralCode, hasCheckedReferralModal]);

  const handleImportBookmarks = async () => {
    try {
      console.log('[Home] Starting bookmark import');
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/html", "application/json", "text/*", "*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        console.log('[Home] Selected file:', file.name, 'Type:', file.mimeType);
        
        let content: string;
        try {
          // Use the new FileSystem API
          content = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'utf8',
          });
          console.log('[Home] File content length:', content.length);
        } catch (readError) {
          console.error('[Home] Error reading file:', readError);
          throw new Error('Failed to read file. Please try again.');
        }
        
        const { importBookmarksFromFile } = require('@/utils/bookmarkImporter');
        
        // Auto-detect format
        const importResult = await importBookmarksFromFile(content, 'auto');
        console.log('[Home] Import result:', importResult);
        
        if (importResult.success && importResult.bookmarks.length > 0) {
          importBookmarks(importResult.bookmarks);
          Alert.alert(
            t("success"), 
            `${t("import_success").replace("{count}", importResult.imported.toString())}\n\n` +
            `${t("imported")}: ${importResult.imported}\n` +
            `${t("failed")}: ${importResult.failed}\n` +
            `${t("skipped")}: ${importResult.skipped}`
          );
        } else {
          const errorMsg = importResult.errors.length > 0 
            ? importResult.errors[0].reason 
            : t("import_failed");
          Alert.alert(t("error"), errorMsg);
        }
      }
    } catch (error) {
      console.error('[Home] Import error:', error);
      Alert.alert(t("error"), error instanceof Error ? error.message : t("import_failed"));
    }
  };

  const handleExportBookmarks = async () => {
    try {
      const html = exportBookmarks("html");
      
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'bookmarks.html';
        link.click();
        URL.revokeObjectURL(url);
        Alert.alert(t("success"), t("export_bookmarks"));
        return;
      }
      
      // For native platforms
      const cacheDir = getCacheDirectory();
      if (!cacheDir) {
        Alert.alert(t("error"), "File system not available");
        return;
      }
      const fileUri = cacheDir + "bookmarks.html";
      await FileSystem.writeAsStringAsync(fileUri, html, {
        encoding: 'utf8',
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(t("success"), t("export_bookmarks"));
      }
    } catch (error) {
      Alert.alert(t("error"), "Failed to export bookmarks");
    }
  };

  const handleSmartCategorize = () => {
    Alert.alert(
      t("smart_category"),
      t("feature_smart_category_desc"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("confirm"),
          onPress: () => {
            smartCategorize();
            Alert.alert(t("success"), t("smart_category_success"));
          },
        },
      ]
    );
  };

  const handleCleanupBookmarks = () => {
    const duplicatesCount = stats.duplicates;
    if (duplicatesCount === 0) {
      Alert.alert(t("info"), t("no_duplicates"));
      return;
    }

    Alert.alert(
      t("cleanup_bookmarks"),
      t("duplicates_found").replace("{count}", duplicatesCount.toString()),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("cleanup_now"),
          onPress: () => {
            const removed = cleanupBookmarks();
            Alert.alert(t("success"), t("cleanup_success").replace("{count}", removed.toString()));
          },
        },
      ]
    );
  };

  const handleAddFolder = useCallback(() => {
    const trimmedName = newFolderName.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      Alert.alert(t("error"), t("folder_name_required"));
      return;
    }

    // Normalize for comparison to handle emoji and special characters
    const normalizedName = trimmedName.normalize('NFC');
    const exists = folders.some(
      (f) => f.name.normalize('NFC').toLowerCase() === normalizedName.toLowerCase()
    );
    if (exists) {
      Alert.alert(t("error"), t("folder_exists"));
      return;
    }

    const result = addFolder('general', trimmedName);
    if (result) {
      setNewFolderName("");
      setShowAddFolderModal(false);
    }
  }, [newFolderName, folders, addFolder, t]);

  const handleEditFolder = useCallback(() => {
    if (!editingFolder) return;

    const trimmedName = newFolderName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      Alert.alert(t("error"), t("folder_name_required"));
      return;
    }

    editFolder(editingFolder.id, trimmedName);
    setNewFolderName("");
    setEditingFolder(null);
    setShowEditFolderModal(false);
  }, [editingFolder, newFolderName, editFolder, t]);

  const handleDeleteFolder = (folder: any) => {
    Alert.alert(
      t("delete_folder"),
      `${t("delete_folder")} "${folder.name}"?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => deleteFolder(folder.id),
        },
      ]
    );
  };

  const handleCopyUrl = async (url: string) => {
    await Clipboard.setStringAsync(url);
    Alert.alert(t("success"), t("copy"));
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url);
  };

  const handleToggleFavorite = useCallback((itemId: string) => {
    toggleFavorite(itemId);
  }, [toggleFavorite]);

  const BookmarkCard = React.memo(({ item, isSelected, onPress, onLongPress, onToggleFavorite, onDelete, onCopy }: { 
    item: any; 
    isSelected: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onToggleFavorite: () => void;
    onDelete: () => void;
    onCopy: () => void;
  }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleToggleFavorite = useCallback(() => {
      if (isProcessing) return;
      setIsProcessing(true);
      onToggleFavorite();
      setTimeout(() => setIsProcessing(false), 300);
    }, [isProcessing, onToggleFavorite]);
    
    return (
      <TouchableOpacity
        style={[styles.bookmarkCard, isSelected && styles.bookmarkCardSelected]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.bookmarkContent}>
          <View style={styles.bookmarkIcon}>
            <Globe size={24} color={Colors.primary.accent} />
          </View>
          <View style={styles.bookmarkInfo}>
            <Text style={styles.bookmarkTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.bookmarkUrl} numberOfLines={1}>
              {item.url}
            </Text>
          </View>
        </View>
        <View style={styles.bookmarkActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onCopy}
            activeOpacity={0.6}
          >
            <Copy size={16} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleFavorite}
            activeOpacity={0.6}
            disabled={isProcessing}
          >
            <Star
              size={16}
              color={item.favorite ? Colors.primary.accent : Colors.primary.textSecondary}
              fill={item.favorite ? Colors.primary.accent : "transparent"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
            activeOpacity={0.6}
          >
            <Trash2 size={16} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, (prevProps, nextProps) => {
    return prevProps.item.id === nextProps.item.id && 
           prevProps.item.title === nextProps.item.title &&
           prevProps.item.url === nextProps.item.url &&
           prevProps.item.favorite === nextProps.item.favorite &&
           prevProps.isSelected === nextProps.isSelected;
  });

  const handleBookmarkPress = useCallback((itemId: string, itemUrl: string) => {
    if (isSelectionMode) {
      setSelectedBookmarks(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(itemId)) {
          newSelection.delete(itemId);
        } else {
          newSelection.add(itemId);
        }
        return newSelection;
      });
    } else {
      handleOpenUrl(itemUrl);
    }
  }, [isSelectionMode, handleOpenUrl]);

  const handleBookmarkLongPress = useCallback((itemId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedBookmarks(new Set([itemId]));
    }
  }, [isSelectionMode]);

  const renderBookmarkCard = useCallback(({ item }: { item: any }) => {
    const isSelected = selectedBookmarks.has(item.id);
    return (
      <BookmarkCard 
        item={item} 
        isSelected={isSelected}
        onPress={() => handleBookmarkPress(item.id, item.url)}
        onLongPress={() => handleBookmarkLongPress(item.id)}
        onToggleFavorite={() => handleToggleFavorite(item.id)}
        onDelete={() => deleteBookmark(item.id)}
        onCopy={() => handleCopyUrl(item.url)}
      />
    );
  }, [selectedBookmarks, isSelectionMode, handleBookmarkPress, handleBookmarkLongPress, handleToggleFavorite, deleteBookmark, handleCopyUrl]);

  const renderFolder = useCallback(({ item }: { item: any }) => {
    const bookmarkCount = item.id === "all" 
      ? bookmarks.length 
      : item.id === "favorites"
      ? bookmarks.filter(b => b.favorite).length
      : item.bookmarks.length;

    // Check if this folder should be visible based on category settings
    let categoryVisible = true;
    const targetCategoryId = item.builtIn ? item.id : (item.categoryId ?? "");
    if (targetCategoryId && targetCategoryId !== "all" && targetCategoryId !== "favorites") {
      const cat = categories.find(c => c.id === targetCategoryId);
      if (cat && cat.isVisible === false) {
        categoryVisible = false;
      }
    }

    if (!categoryVisible) {
      return null;
    }

    return (
      <View
        style={[
          styles.folderItem,
          currentFolder === item.id && styles.folderItemActive,
        ]}
      >
        <TouchableOpacity
          style={styles.folderTouchable}
          onPress={() => setCurrentFolder(item.id)}
          onLongPress={async () => {
            try {
              if (Platform.OS === 'web') {
                Alert.alert(t('info'), 'Long press export not available on web');
                return;
              }
              
              const html = exportFolderBookmarks(item.id, 'html');
              const json = exportFolderBookmarks(item.id, 'json');
              const cacheDir = getCacheDirectory();
              if (!cacheDir) {
                Alert.alert(t("error"), "File system not available");
                return;
              }
              const htmlUri = cacheDir + `bookmarks_${item.id}.html`;
              const jsonUri = cacheDir + `bookmarks_${item.id}.json`;
              await FileSystem.writeAsStringAsync(htmlUri, html, {
                encoding: 'utf8',
              });
              await FileSystem.writeAsStringAsync(jsonUri, json, {
                encoding: 'utf8',
              });
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(htmlUri);
              } else {
                Alert.alert(t('success'), t('export_bookmarks'));
              }
            } catch (e) {
              Alert.alert(t('error'), t('import_failed'));
            }
          }}
          delayLongPress={300}
          testID={`folderItem-${item.id}`}
          activeOpacity={0.7}
        >
          <View style={styles.folderContent}>
            <Folder size={20} color={
              currentFolder === item.id ? Colors.primary.accent : Colors.primary.textSecondary
            } />
            <Text 
              style={[
                styles.folderName,
                currentFolder === item.id && styles.folderNameActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.builtIn ? t(item.name + "_folder") : item.name}
            </Text>
            <Text style={styles.folderCount}>{bookmarkCount}</Text>
          </View>
        </TouchableOpacity>
        {!item.builtIn && (
          <TouchableOpacity
            style={styles.folderMenu}
            onPress={() => {
              setEditingFolder(item);
              setNewFolderName(item.name);
              setShowEditFolderModal(true);
            }}
            activeOpacity={0.6}
          >
            <MoreVertical size={16} color={Colors.primary.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [currentFolder, folders, bookmarks, categories, t, setCurrentFolder, setEditingFolder, setNewFolderName, setShowEditFolderModal]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Referral Code Modal */}
      <ReferralCodeModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        isFirstTime={true}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.accent}
          />
        }
      >
        {/* Welcome Section with Animation */}
        <View style={styles.welcomeSection}>
          <HomeIcon size={40} color={Colors.primary.accent} />
          <Text style={styles.welcomeTitle}>{t("app_name")}</Text>
          <Text style={styles.welcomeSubtitle}>{t("subtitle")}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.primary.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("search_placeholder")}
            placeholderTextColor={Colors.primary.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
          />
        </View>

        {/* Membership Status Card */}
        <TouchableOpacity 
          style={styles.membershipCard}
          onPress={() => {
            console.log('[Home] Membership card pressed');
            // TODO: Navigate to subscription page
          }}
          activeOpacity={0.7}
        >
          <View style={styles.membershipHeader}>
            <View style={styles.membershipIconContainer}>
              {tier === 'premium' ? (
                <Crown size={24} color={Colors.primary.accent} />
              ) : tier === 'basic' ? (
                <Star size={24} color={Colors.primary.accent} />
              ) : (
                <Sparkles size={24} color={Colors.primary.textSecondary} />
              )}
            </View>
            <View style={styles.membershipInfo}>
              <Text style={styles.membershipTier}>
                {tier === 'free_trial' ? t('free_trial') : 
                 tier === 'free' ? t('free_member') :
                 tier === 'basic' ? t('basic_member') : t('premium_member')}
              </Text>
              <Text style={styles.membershipUsage}>
                {remainingUsage === -1 ? t('unlimited_uses') : 
                 `${remainingUsage} ${t('uses_remaining')}`}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.primary.textSecondary} />
          </View>
          {(tier === 'free' || tier === 'free_trial') && (
            <View style={styles.upgradeHint}>
              <TrendingUp size={16} color={Colors.primary.accent} />
              <Text style={styles.upgradeHintText}>{t('tap_to_upgrade')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Bookmark size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{stats.totalBookmarks}</Text>
            <Text style={styles.statLabel}>{t("total_bookmarks")}</Text>
          </View>
          <View style={styles.statCard}>
            <Folder size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{stats.totalFolders}</Text>
            <Text style={styles.statLabel}>{t("total_folders")}</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{stats.totalFavorites}</Text>
            <Text style={styles.statLabel}>{t("favorites")}</Text>
          </View>
          <View style={styles.statCard}>
            <Sparkles size={24} color={Colors.primary.accent} />
            <Text style={styles.statNumber}>{userData.voiceCredits}</Text>
            <Text style={styles.statLabel}>{t("voice_commands")}</Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featureContainer}>
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={handleImportBookmarks}
            activeOpacity={0.7}
          >
            <FileInput size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_import")}</Text>
            <Text style={styles.featureDesc}>{t("feature_import_desc")}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={handleSmartCategorize}
            activeOpacity={0.7}
          >
            <Sparkles size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_smart_category")}</Text>
            <Text style={styles.featureDesc}>{t("feature_smart_category_desc")}</Text>
            {originalBookmarks.length > 0 && (
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={() => {
                  restoreOriginalBookmarks();
                  Alert.alert(t("success"), t("restore_success"));
                }}
              >
                <RefreshCw size={16} color={Colors.primary.accent} />
                <Text style={styles.restoreText}>{t("restore_original")}</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={handleCleanupBookmarks}
            activeOpacity={0.7}
          >
            <Trash size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_cleanup")}</Text>
            <Text style={styles.featureDesc}>{t("feature_cleanup_desc")}</Text>
            {stats.duplicates > 0 && (
              <View style={styles.cleanupSuggestion}>
                <AlertCircle size={16} color={Colors.primary.accent} />
                <Text style={styles.cleanupText}>
                  {t("duplicates_found").replace("{count}", stats.duplicates.toString())}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={handleExportBookmarks}
            activeOpacity={0.7}
          >
            <FileEdit size={24} color={Colors.primary.accent} />
            <Text style={styles.featureTitle}>{t("feature_export")}</Text>
            <Text style={styles.featureDesc}>{t("feature_export_desc")}</Text>
          </TouchableOpacity>
        </View>

        {/* Folders Sidebar */}
        <View style={styles.foldersSection}>
          <Text style={styles.sectionTitle}>{t("total_folders")}</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={folders}
            renderItem={renderFolder}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addFolderButton}
                onPress={() => {
                  console.log('[Home] Add folder button pressed');
                  setShowAddFolderModal(true);
                }}
                activeOpacity={0.7}
              >
                <FolderPlus size={20} color={Colors.primary.accent} />
                <Text style={styles.addFolderText}>{t("add_folder")}</Text>
              </TouchableOpacity>
            }
          />
        </View>

        {/* Bookmarks List */}
        <View style={styles.bookmarksSection}>
          <View style={styles.bookmarksHeader}>
            <Text style={styles.sectionTitle}>
              {currentFolder === "all"
                ? t("all_bookmarks")
                : currentFolder === "favorites"
                ? t("favorites")
                : folders.find((f) => f.id === currentFolder)?.name || t("all_bookmarks")}
            </Text>
            {isSelectionMode && (
              <TouchableOpacity
                style={styles.cancelSelectionButton}
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedBookmarks(new Set());
                }}
              >
                <X size={20} color={Colors.primary.accent} />
                <Text style={styles.cancelSelectionText}>{t("cancel")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredBookmarks.length === 0 ? (
            <View style={styles.emptyState}>
              <Bookmark size={48} color={Colors.primary.textSecondary} />
              <Text style={styles.emptyTitle}>{t("no_bookmarks")}</Text>
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleImportBookmarks}
              >
                <FileInput size={20} color={Colors.primary.accent} />
                <Text style={styles.importButtonText}>{t("import_bookmarks")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredBookmarks}
              renderItem={renderBookmarkCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={5}
              updateCellsBatchingPeriod={50}
              initialNumToRender={8}
              windowSize={3}
              getItemLayout={(data, index) => ({
                length: 90,
                offset: 90 * index,
                index,
              })}
              onEndReachedThreshold={0.5}
            />
          )}
        </View>
      </ScrollView>

      {/* Add Folder Modal */}
      <Modal
        visible={showAddFolderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFolderModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("add_folder")}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("folder_name_placeholder")}
              placeholderTextColor={Colors.primary.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={20}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setNewFolderName("");
                  setShowAddFolderModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddFolder}
              >
                <Text style={styles.modalButtonText}>{t("confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal
        visible={showEditFolderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditFolderModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("edit_folder")}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("folder_name_placeholder")}
              placeholderTextColor={Colors.primary.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              maxLength={20}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={() => {
                  if (editingFolder) {
                    handleDeleteFolder(editingFolder);
                    setShowEditFolderModal(false);
                    setEditingFolder(null);
                    setNewFolderName("");
                  }
                }}
              >
                <Text style={styles.modalButtonText}>{t("delete")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setNewFolderName("");
                  setEditingFolder(null);
                  setShowEditFolderModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleEditFolder}
              >
                <Text style={styles.modalButtonText}>{t("confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.bg,
    alignItems: screenType !== 'mobile' ? 'center' as const : undefined,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary.bg,
  },
  welcomeSection: {
    alignItems: "center",
    padding: getResponsivePadding(DesignTokens.spacing.xl),
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card.border,
    width: '100%',
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: 'center' as const,
  },
  welcomeTitle: {
    ...DesignTokens.typography.display.large,
    fontSize: getResponsiveFontSize(DesignTokens.typography.display.large.fontSize as number),
    color: Colors.primary.text,
    marginTop: DesignTokens.spacing.sm,
    textAlign: "center" as const,
  },
  welcomeSubtitle: {
    ...DesignTokens.typography.body.medium,
    fontSize: getResponsiveFontSize(DesignTokens.typography.body.medium.fontSize as number),
    color: Colors.primary.textSecondary,
    marginTop: DesignTokens.spacing.xs,
    textAlign: "center" as const,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    paddingHorizontal: getResponsivePadding(15),
    marginHorizontal: getResponsivePadding(20),
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.card.border,
    width: screenType !== 'mobile' ? maxWidth - getResponsivePadding(40) : undefined,
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: screenType !== 'mobile' ? 'center' as const : undefined,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    color: Colors.primary.text,
    fontSize: getResponsiveFontSize(16),
  },
  statsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: screenType === 'mobile' ? 'space-between' : 'center',
    paddingHorizontal: getResponsivePadding(20),
    marginTop: 20,
    width: screenType !== 'mobile' ? maxWidth : undefined,
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: screenType !== 'mobile' ? 'center' as const : undefined,
    gap: screenType === 'mobile' ? 8 : responsiveValue(12, 16, 20),
  },
  statCard: {
    flex: screenType === 'mobile' ? 1 : undefined,
    width: screenType !== 'mobile' ? responsiveValue(160, 180, 200) : undefined,
    minWidth: screenType === 'mobile' ? 70 : responsiveValue(140, 160, 180),
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: screenType === 'mobile' ? getResponsivePadding(12) : getResponsivePadding(20),
    alignItems: "center",
    marginHorizontal: screenType === 'mobile' ? 0 : responsiveValue(6, 8, 10),
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  statNumber: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: "700" as const,
    color: Colors.primary.accent,
    marginTop: 8,
  },
  statLabel: {
    fontSize: getResponsiveFontSize(11),
    color: Colors.primary.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  featureContainer: {
    padding: getResponsivePadding(20),
    flexDirection: screenType !== 'mobile' ? 'row' as const : 'column' as const,
    flexWrap: screenType !== 'mobile' ? 'wrap' as const : undefined,
    justifyContent: screenType !== 'mobile' ? 'center' : undefined,
    width: screenType !== 'mobile' ? maxWidth : undefined,
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: screenType !== 'mobile' ? 'center' as const : undefined,
    gap: screenType === 'mobile' ? 0 : responsiveValue(12, 16, 20),
  },
  featureCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: getResponsivePadding(20),
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.card.border,
    width: screenType === 'mobile' ? undefined : '48%',
    minWidth: screenType !== 'mobile' ? responsiveValue(280, 320, 360) : undefined,
    maxWidth: screenType === 'mobile' ? undefined : responsiveValue(450, 480, 520),
    flex: screenType === 'mobile' ? undefined : 0,
  },
  featureTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginTop: 10,
  },
  featureDesc: {
    fontSize: getResponsiveFontSize(14),
    color: Colors.primary.textSecondary,
    marginTop: 5,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: Colors.card.bg,
    borderRadius: 8,
  },
  restoreText: {
    color: Colors.primary.accent,
    marginLeft: 5,
    fontSize: 14,
  },
  cleanupSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: Colors.card.bg,
    borderRadius: 8,
  },
  cleanupText: {
    color: Colors.primary.accent,
    marginLeft: 5,
    fontSize: 14,
  },
  foldersSection: {
    paddingHorizontal: getResponsivePadding(20),
    marginTop: 10,
    width: screenType !== 'mobile' ? maxWidth : undefined,
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: screenType !== 'mobile' ? 'center' as const : undefined,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 15,
  },
  folderItem: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.card.border,
    minWidth: 120,
    position: "relative" as const,
  },
  folderTouchable: {
    padding: 12,
    width: "100%",
  },
  folderItemActive: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.card.bg,
  },
  folderContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingRight: 24,
  },
  folderName: {
    color: Colors.primary.text,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    maxWidth: 80,
  },
  folderNameActive: {
    color: Colors.primary.accent,
  },
  folderCount: {
    color: Colors.primary.textSecondary,
    fontSize: 12,
    marginLeft: 5,
  },
  folderMenu: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  addFolderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.card.border,
    borderStyle: "dashed",
  },
  addFolderText: {
    color: Colors.primary.accent,
    fontSize: 14,
    marginLeft: 8,
  },
  bookmarksSection: {
    padding: getResponsivePadding(20),
    width: screenType !== 'mobile' ? maxWidth : undefined,
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: screenType !== 'mobile' ? 'center' as const : undefined,
  },
  bookmarksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cancelSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: Colors.secondary.bg,
    borderRadius: 8,
  },
  cancelSelectionText: {
    color: Colors.primary.accent,
    marginLeft: 5,
    fontSize: 14,
  },
  bookmarkCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  bookmarkCardSelected: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.card.bg,
  },
  bookmarkContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.card.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  bookmarkInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: Colors.primary.text,
  },
  bookmarkUrl: {
    fontSize: 12,
    color: Colors.primary.textSecondary,
    marginTop: 2,
  },
  bookmarkActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    marginRight: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.primary.textSecondary,
    marginTop: 10,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  importButtonText: {
    color: Colors.primary.text,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: getResponsivePadding(24),
    width: screenType === 'mobile' ? screenWidth - 40 : '90%',
    maxWidth: responsiveValue(450, 550, 650),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "600" as const,
    color: Colors.primary.text,
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: Colors.card.bg,
    borderRadius: 8,
    padding: getResponsivePadding(12),
    color: Colors.primary.text,
    fontSize: getResponsiveFontSize(16),
    borderWidth: 1,
    borderColor: Colors.card.border,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: Colors.card.bg,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary.accent,
  },
  modalButtonDelete: {
    backgroundColor: "#ef4444",
  },
  modalButtonText: {
    color: Colors.primary.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  membershipCard: {
    backgroundColor: Colors.secondary.bg,
    borderRadius: 16,
    padding: getResponsivePadding(16),
    marginHorizontal: getResponsivePadding(20),
    marginTop: 20,
    borderWidth: 2,
    borderColor: Colors.card.border,
    width: screenType !== 'mobile' ? maxWidth - getResponsivePadding(40) : undefined,
    maxWidth: screenType !== 'mobile' ? maxWidth : undefined,
    alignSelf: screenType !== 'mobile' ? 'center' as const : undefined,
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  membershipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card.bg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipTier: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary.text,
    marginBottom: 2,
  },
  membershipUsage: {
    fontSize: 13,
    color: Colors.primary.textSecondary,
  },
  upgradeHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.card.border,
  },
  upgradeHintText: {
    fontSize: 12,
    color: Colors.primary.accent,
    marginLeft: 6,
    fontWeight: "600" as const,
  },
});