import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import scamLessonsData from "@/assets/lessons.json";

const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  error: '#CF6679',
};

const Checkbox = ({ checked }) => (
  <View style={[styles.checkbox, checked && styles.checked]}>
    {checked && <Text style={styles.checkmark}>✓</Text>}
  </View>
);

const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={styles.contentText}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const stripped = part.slice(2, -2);
          return (
            <Text key={index} style={[styles.boldText, { color: colors.primary }]}>
              {stripped}
            </Text>
          );
        }
        return <Text key={index} style={{ color: colors.textSecondary }}>{part}</Text>;
      })}
    </Text>
  );
};

export default function App() {
  const [completedLessons, setCompletedLessons] = useState([]);
  const [expandedLessons, setExpandedLessons] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const loadCompletedLessons = useCallback(async () => {
    try {
      const storedLessons = await AsyncStorage.getItem('completedLessons');
      setCompletedLessons(storedLessons ? JSON.parse(storedLessons) : []);
    } catch (error) {
      console.error('Failed to load completed lessons:', error);
      setLoadError('Failed to load lesson progress.');
    }
  }, []);

  useEffect(() => {
    const saveCompletedLessons = async () => {
      try {
        await AsyncStorage.setItem('completedLessons', JSON.stringify(completedLessons));
      } catch (error) {
        console.error('Failed to save completed lessons:', error);
      }
    };
    saveCompletedLessons();
  }, [completedLessons]);

  useEffect(() => { loadCompletedLessons(); }, [loadCompletedLessons]);

  const toggleLessonComplete = (lessonNumber) => {
    setCompletedLessons(prev => prev.includes(lessonNumber)
      ? prev.filter(num => num !== lessonNumber)
      : [...prev, lessonNumber]
    );
  };

  const toggleLesson = (lessonNumber) => {
    setExpandedLessons(prev => prev.includes(lessonNumber)
      ? prev.filter(num => num !== lessonNumber)
      : [...prev, lessonNumber]
    );
  };

  const resetProgress = async () => {
    try {
      await AsyncStorage.removeItem('completedLessons');
      setCompletedLessons([]);
      setExpandedLessons([]);
    } catch (error) {
      console.error('Failed to reset progress:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCompletedLessons().finally(() => setRefreshing(false));
  }, [loadCompletedLessons]);

  const renderLesson = ({ item }) => {
    const completed = completedLessons.includes(item.lesson_number);
    const expanded = expandedLessons.includes(item.lesson_number);

    return (
      <View style={styles.lessonContainer}>
        <View style={styles.lessonHeader}>
          <TouchableOpacity
            onPress={() => toggleLessonComplete(item.lesson_number)}
            style={styles.checkboxContainer}
          >
            <Checkbox checked={completed} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={() => toggleLesson(item.lesson_number)}
            activeOpacity={0.8}
          >
            <Text style={styles.lessonNumber}>
              Lesson {item.lesson_number}
            </Text>
            <Text style={styles.lessonTitle}>{item.title}</Text>
          </TouchableOpacity>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <Text style={styles.objective}>{item.objective}</Text>
            {renderFormattedText(item.content)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{scamLessonsData.title}</Text>
        <Text style={styles.headerSubtitle}>{scamLessonsData.description}</Text>
        <TouchableOpacity 
          onPress={resetProgress} 
          style={styles.resetButton}
        >
          <Text style={styles.resetText}>Reset Progress</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={scamLessonsData.lessons}
        renderItem={renderLesson}
        keyExtractor={item => item.lesson_number.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  lessonContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  lessonNumber: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  objective: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  boldText: {
    fontWeight: '600',
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  resetText: {
    color: colors.secondary,
    fontWeight: '500',
  },
});