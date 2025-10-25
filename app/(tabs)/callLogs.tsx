import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const colors = {
  background: "#121212",
  surface: "#1E1E1E",
  primary: "#BB86FC",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  error: "#CF6679",
};

// Define types for call log and dropdown content
interface Message {
  afterCall: string;
  duringCall: string;
}

interface DropdownContent {
  scamCategory: string;
  probability: string;
  suggestionMessage: Message;
}

interface CallLog {
  id: string;
  phoneNumber: string;
  startTime: Date;
  endTime: Date;
  dropdownContent: DropdownContent;
}

const CallLogs: React.FC = () => {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  // Track which dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  // Store animation values in a ref so they persist across renders.
  const animations = useRef<{ [key: string]: Animated.Value }>({});

  // loadData is now defined as a function that can be called both on mount and on focus.
  const loadData = async () => {
    try {
      const storedCallLogs = await AsyncStorage.getItem("callLogs");
      if (storedCallLogs) {
        const parsedLogs = JSON.parse(storedCallLogs).map((log: any) => {
          // Convert timestamps to Date objects.
          const startTime = new Date(log.startTime);
          const endTime = new Date(log.endTime);
          // Normalize dropdownContent: if suggestionMessage is missing, try using messages from older data.
          let dropdownContent = log.dropdownContent;
          if (dropdownContent) {
            dropdownContent = {
              ...dropdownContent,
              suggestionMessage:
                dropdownContent.suggestionMessage ??
                dropdownContent.messages ?? {
                  afterCall: "No suggestion available",
                  duringCall: "No suggestion available",
                },
            };
          }
          return {
            ...log,
            startTime,
            endTime,
            dropdownContent,
          };
        });
        setCallLogs(parsedLogs);
      } else {
        // Fallback mock data if no logs are stored
        const mockCallLogs: CallLog[] = [
          {
            id: "1",
            phoneNumber: "+1234567890",
            startTime: new Date("2023-10-01T12:00:00Z"),
            endTime: new Date("2023-10-01T12:02:00Z"), // 2 minutes call
            dropdownContent: {
              scamCategory: "Fake Prize Scam",
              probability: "95%",
              suggestionMessage: {
                afterCall: "Call your provider's official number to confirm the call.",
                duringCall: "Tech support scam detected. Do not allow remote access.",
              },
            },
          },
          {
            id: "2",
            phoneNumber: "+0987654321",
            startTime: new Date("2023-10-02T14:30:00Z"),
            endTime: new Date("2023-10-02T14:31:30Z"), // 1.5 minutes call
            dropdownContent: {
              scamCategory: "Fake Prize Scam",
              probability: "95%",
              suggestionMessage: {
                afterCall: "Call your provider's official number to confirm the call.",
                duringCall: "Tech support scam detected. Do not allow remote access.",
              },
            },
          },
        ];
        setCallLogs(mockCallLogs);
        await AsyncStorage.setItem("callLogs", JSON.stringify(mockCallLogs));
      }
    } catch (error) {
      console.error("Failed to load call logs:", error);
    }
  };

  // Initial load on mount.
  useEffect(() => {
    loadData();
  }, []);

  // Reload call logs when the screen gains focus.
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  // Toggle dropdown animation so only one is open at a time.
  const handleDropdownToggle = (id: string) => {
    if (!animations.current[id]) {
      animations.current[id] = new Animated.Value(0);
    }
    if (openDropdownId === id) {
      // Close the dropdown if it's already open.
      Animated.timing(animations.current[id], {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setOpenDropdownId(null));
    } else {
      // Close any open dropdown.
      if (openDropdownId && animations.current[openDropdownId]) {
        Animated.timing(animations.current[openDropdownId], {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
      // Open the selected dropdown.
      Animated.timing(animations.current[id], {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      setOpenDropdownId(id);
    }
  };

  // Helper to compute the duration of the call.
  const getDuration = (start: Date, end: Date) => {
    const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  // Render each call log item.
  const renderCallLog = ({ item }: { item: CallLog }) => {
    const dropdownHeight = animations.current[item.id]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 250], // Adjust height as necessary.
    });
    const dropdownOpacity = animations.current[item.id]?.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <View style={styles.callLogItemContainer}>
        <TouchableOpacity onPress={() => handleDropdownToggle(item.id)}>
          <View style={styles.callLogItem}>
            <MaterialIcons name="call" size={24} color={colors.primary} />
            <View style={styles.callLogDetails}>
              <View style={styles.phoneNumberContainer}>
                <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
              </View>
              <View style={styles.callTimeContainer}>
                <Text style={styles.timestamp}>
                  {`Start: ${item.startTime.toLocaleTimeString()}`}
                </Text>
                <Text style={styles.timestamp}>
                  {`End: ${item.endTime.toLocaleTimeString()}`}
                </Text>
                <Text style={styles.duration}>
                  {`Duration: ${getDuration(item.startTime, item.endTime)}`}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name={openDropdownId === item.id ? "arrow-drop-up" : "arrow-drop-down"}
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
        {openDropdownId === item.id && (
          <Animated.View
            style={[
              styles.dropdownContentContainer,
              { height: dropdownHeight, opacity: dropdownOpacity },
            ]}
          >
            <Text style={styles.dropdownContentText}>
              <Text style={styles.boldText}>Category: </Text>
              {item.dropdownContent?.scamCategory || "N/A"}
            </Text>
            <Text style={styles.dropdownContentText}>
              <Text style={styles.boldText}>Probability: </Text>
              {item.dropdownContent?.probability || "N/A"}
            </Text>
            <Text style={styles.dropdownContentText}>
              <Text style={styles.boldText}>After Call Suggestion: </Text>
              {item.dropdownContent?.suggestionMessage?.afterCall || "No suggestion available"}
            </Text>
            <Text style={styles.dropdownContentText}>
              <Text style={styles.boldText}>During Call Suggestion: </Text>
              {item.dropdownContent?.suggestionMessage?.duringCall || "No suggestion available"}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {callLogs.length === 0 ? (
        <Text style={styles.emptyText}>No call logs available.</Text>
      ) : (
        <FlatList
          data={callLogs}
          renderItem={renderCallLog}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  callLogItemContainer: {
    marginBottom: 12,
  },
  callLogItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  callLogDetails: {
    marginLeft: 16,
    flex: 1,
  },
  phoneNumberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  callTimeContainer: {
    marginTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  duration: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    marginTop: 4,
  },
  dropdownContentContainer: {
    marginTop: 8,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.background,
  },
  dropdownContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "600",
    color: colors.text,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});

export default CallLogs;
