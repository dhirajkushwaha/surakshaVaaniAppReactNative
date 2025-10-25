import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator, 
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  error: '#CF6679',
};

const LANGUAGE_OPTIONS = [
  { code: 'en-US', name: 'English', englishName: 'English' }, 
  { code: 'hi-IN', name: 'हिंदी', englishName: 'Hindi' }, 
  { code: 'ta-IN', name: 'தமிழ்', englishName: 'Tamil' },
  { code: 'te-IN', name: 'తెలుగు', englishName: 'Telugu' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml-IN', name: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'mr-IN', name: 'मराठी', englishName: 'Marathi' },
  { code: 'gu-IN', name: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
];

export default function SettingsScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [strictMode, setStrictMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false); // State for the success modal

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setSelectedLanguage(parsedSettings.language || '');
        setStrictMode(parsedSettings.strictMode || false);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        language: selectedLanguage,
        strictMode,
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
      // Alert.alert('Settings saved successfully'); // Replaced with modal
      setSuccessModalVisible(true); // Show the success modal
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    }
  };

  const LanguageItem = ({ code, name, englishName }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        selectedLanguage === code && styles.selectedLanguage,
      ]}
      onPress={() => setSelectedLanguage(code)}
    >
      <Text style={styles.languageNameNative}>{name}</Text>
      <Text style={styles.languageNameEnglish}>{englishName}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>App Settings</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Language Preferences</Text>
        <Text style={styles.sectionSubtitle}>
          Select your preferred app language
        </Text>

        <View style={styles.languageList}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <LanguageItem
              key={lang.code}
              code={lang.code}
              name={lang.name}
              englishName={lang.englishName}
            />
          ))}
        </View>
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Strict Mode</Text>
            <Text style={styles.settingDescription}>
              Enable additional security checks and validations
            </Text>
          </View>
          <Switch
            value={strictMode}
            onValueChange={setStrictMode}
            trackColor={{ false: colors.surface, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Text style={styles.saveButtonText}>Apply Changes</Text>
      </TouchableOpacity>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {
          setSuccessModalVisible(!successModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Settings saved successfully!
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={[styles.textStyle, { color: colors.text }]}>
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 30,
  },
  settingsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  languageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageItem: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  selectedLanguage: {
    borderColor: colors.primary,
    backgroundColor: '#1E1E1E55',
  },
  languageNameNative: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  languageNameEnglish: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    maxWidth: '80%',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.error + '20',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },

  // Styles for the modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // Adjust width as needed
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    marginTop: 16,
    width: '50%', // Adjust width as needed
    alignItems: 'center',
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
  },
});
