import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from './ThemeContext';
import { BackgroundOption, COLORS, getLightBackgrounds } from './theme';
import FeedbackForm from '../../FeedbackForm';
import {
  Newspaper,
  Palette,
  Volume2,
  Mail,
  Info,
  ChevronRight,
} from 'lucide-react-native';

const APP_VERSION = '1.0.0';
const DEVELOPER_EMAIL = 'brandon.bach44@gmail.com';

// What's New data - update this with each release
const WHATS_NEW = [
  {
    version: '1.0.0',
    date: 'December 2024',
    changes: [
      'Initial release of Word Games',
      'Word Builder game with Daily Challenge',
      'Customizable tile designs',
      'Achievement system with 41 badges',
      'Multiple themes and dark mode',
    ],
  },
];

export const SettingsScreen: React.FC = () => {
  const {
    background,
    selectedBackgroundId,
    darkModeEnabled,
    soundEnabled,
    colorBlindMode,
    setBackgroundId,
    setDarkMode,
    setSoundEnabled,
    setColorBlindMode,
  } = useTheme();

  const [showWhatsNew, setShowWhatsNew] = React.useState(false);
  const [showFeedback, setShowFeedback] = React.useState(false);

  // Only show light backgrounds in picker (dark mode is separate toggle)
  const lightBackgrounds = getLightBackgrounds();

  // Update this URL to your backend server address (localhost:3000 for development, your production URL for production)
  const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const renderBackgroundOption = (option: BackgroundOption) => {
    const isSelected = option.id === selectedBackgroundId && !darkModeEnabled;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.backgroundOption,
          isSelected && styles.backgroundOptionSelected,
        ]}
        onPress={() => {
          setBackgroundId(option.id);
          // Turn off dark mode when selecting a light background
          if (darkModeEnabled) {
            setDarkMode(false);
          }
        }}
        activeOpacity={0.7}
        disabled={darkModeEnabled}
      >
        {option.type === 'color' ? (
          <View 
            style={[
              styles.backgroundPreview, 
              { backgroundColor: option.backgroundColor },
              darkModeEnabled && styles.backgroundPreviewDisabled,
            ]} 
          />
        ) : (
          <ImageBackground
            source={option.backgroundImage}
            style={[
              styles.backgroundPreview,
              darkModeEnabled && styles.backgroundPreviewDisabled,
            ]}
            imageStyle={styles.backgroundPreviewImage}
          />
        )}
        <Text 
          style={[
            styles.backgroundName, 
            { color: background.textColor },
            darkModeEnabled && styles.textDisabled,
          ]}
        >
          {option.name}
        </Text>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // What's New Modal/Section
  if (showWhatsNew) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
        <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowWhatsNew(false)} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: background.secondaryText }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: background.textColor }]}>What's New</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {WHATS_NEW.map((release, index) => (
            <View 
              key={release.version} 
              style={[
                styles.releaseCard, 
                { backgroundColor: background.cardColor, borderColor: background.borderColor }
              ]}
            >
              <View style={styles.releaseHeader}>
                <Text style={[styles.releaseVersion, { color: background.textColor }]}>
                  Version {release.version}
                </Text>
                <Text style={[styles.releaseDate, { color: background.secondaryText }]}>
                  {release.date}
                </Text>
              </View>
              <View style={styles.changesList}>
                {release.changes.map((change, changeIndex) => (
                  <View key={changeIndex} style={styles.changeItem}>
                    <Text style={[styles.changeBullet, { color: background.secondaryText }]}>•</Text>
                    <Text style={[styles.changeText, { color: background.textColor }]}>
                      {change}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background.backgroundColor }]}>
      <StatusBar barStyle={background.statusBar === 'light' ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: background.secondaryText }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: background.textColor }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== WHAT'S NEW SECTION ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Newspaper size={20} color={background.secondaryText} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: background.textColor }]}>
              What's New
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.linkRow, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}
            onPress={() => setShowWhatsNew(true)}
            activeOpacity={0.7}
          >
            <View style={styles.linkInfo}>
              <Text style={[styles.linkLabel, { color: background.textColor }]}>
                See Latest Updates
              </Text>
              <Text style={[styles.linkDescription, { color: background.secondaryText }]}>
                New features and improvements
              </Text>
            </View>
            <ChevronRight size={20} color={background.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* ==================== APPEARANCE SECTION ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Palette size={20} color={background.secondaryText} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: background.textColor }]}>
              Appearance
            </Text>
          </View>
          
          {/* Dark Mode Toggle */}
          <View style={[styles.settingRow, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: background.textColor }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: background.secondaryText }]}>
                Use dark theme across all games
              </Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkMode}
              trackColor={{ false: '#d1d5db', true: COLORS.accent }}
              thumbColor={darkModeEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          {/* Color Blind Mode Toggle */}
          <View style={[styles.settingRow, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: background.textColor }]}>
                Color Blind Mode
              </Text>
              <Text style={[styles.settingDescription, { color: background.secondaryText }]}>
                Uses orange & blue instead of green & yellow in all games
              </Text>
            </View>
            <Switch
              value={colorBlindMode}
              onValueChange={setColorBlindMode}
              trackColor={{ false: '#d1d5db', true: COLORS.accent }}
              thumbColor={colorBlindMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          {/* Background Selection */}
          <Text style={[styles.subsectionTitle, { color: background.secondaryText }]}>
            Background {darkModeEnabled ? '(disabled in dark mode)' : ''}
          </Text>
          <View style={[
            styles.backgroundGrid,
            darkModeEnabled && styles.backgroundGridDisabled,
          ]}>
            {lightBackgrounds.map(renderBackgroundOption)}
          </View>
        </View>

        {/* ==================== SOUND SECTION ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Volume2 size={20} color={background.secondaryText} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: background.textColor }]}>
              Sound
            </Text>
          </View>
          
          <View style={[styles.settingRow, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: background.textColor }]}>
                Sound Effects
              </Text>
              <Text style={[styles.settingDescription, { color: background.secondaryText }]}>
                Play sounds for actions and feedback
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#d1d5db', true: COLORS.accent }}
              thumbColor={soundEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* ==================== CONTACT SECTION ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Mail size={20} color={background.secondaryText} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: background.textColor }]}>
              Contact Developer
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}
            onPress={() => setShowFeedback(true)}
            activeOpacity={0.7}
          >
            <View style={styles.linkInfo}>
              <Text style={[styles.linkLabel, { color: background.textColor }]}>
                Send Feedback
              </Text>
              <Text style={[styles.linkDescription, { color: background.secondaryText }]}>
                Suggestions, bugs, or just say hi
              </Text>
            </View>
            <ChevronRight size={20} color={background.secondaryText} />
          </TouchableOpacity>
        </View>

        {/* ==================== ABOUT SECTION ==================== */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Info size={20} color={background.secondaryText} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: background.textColor }]}>
              About
            </Text>
          </View>
          
          <View style={[styles.aboutCard, { backgroundColor: background.cardColor, borderColor: background.borderColor }]}>
            <Text style={[styles.appName, { color: background.textColor }]}>
              Word Games
            </Text>
            <Text style={[styles.versionText, { color: background.secondaryText }]}>
              Version {APP_VERSION}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.aboutDescription, { color: background.secondaryText }]}>
              A collection of fun word games to challenge your vocabulary and keep your mind sharp.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FeedbackForm
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        backendUrl={BACKEND_URL}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Sections
  section: {
    marginBottom: 30,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subsectionTitle: {
    fontSize: 14,
    marginTop: 20,
    marginBottom: 12,
  },
  
  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  
  // Link Row (for What's New and Contact)
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkInfo: {
    flex: 1,
    marginRight: 15,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 13,
  },
  
  // Background Grid
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  backgroundGridDisabled: {
    opacity: 0.5,
  },
  backgroundOption: {
    alignItems: 'center',
    width: '30%',
    position: 'relative',
  },
  backgroundOptionSelected: {
    // Handled by checkmark
  },
  backgroundPreview: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    marginBottom: 6,
  },
  backgroundPreviewDisabled: {
    opacity: 0.5,
  },
  backgroundPreviewImage: {
    borderRadius: 12,
  },
  backgroundName: {
    fontSize: 12,
    textAlign: 'center',
  },
  textDisabled: {
    opacity: 0.5,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // About Card
  aboutCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    marginVertical: 15,
  },
  aboutDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // What's New Screen
  releaseCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
  },
  releaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  releaseVersion: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  releaseDate: {
    fontSize: 14,
  },
  changesList: {
    gap: 8,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  changeBullet: {
    fontSize: 14,
    marginRight: 10,
    marginTop: 1,
  },
  changeText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});

export default SettingsScreen;
