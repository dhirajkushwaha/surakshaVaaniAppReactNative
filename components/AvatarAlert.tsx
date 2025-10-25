import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Image,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface AvatarAlertProps {
  onDismiss: () => void;
  duringCallMessage: string; // Pass the duringCall message as a prop
}

const AvatarAlert: React.FC<AvatarAlertProps> = ({
  onDismiss,
  duringCallMessage,
}) => {
  const translateY = useRef(new Animated.Value(200)).current; // For vertical animation
  const translateX = useRef(new Animated.Value(0)).current; // For horizontal swipe
  const [isVisible, setIsVisible] = useState(true);

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Move horizontally and vertically based on swipe
        translateX.setValue(gestureState.dx);
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          Math.abs(gestureState.dx) > 100 ||
          Math.abs(gestureState.dy) > 100
        ) {
          // Swipe left, right, or down to dismiss
          Animated.timing(translateY, {
            toValue: 200, // Move down off-screen
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setIsVisible(false); // Hide the component
            onDismiss(); // Notify parent
          });
        } else {
          // Return to original position if not swiped enough
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    // Animate the avatar in
    Animated.timing(translateY, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Automatically dismiss after 10 seconds
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: 200,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false); // Hide the component
        onDismiss(); // Notify parent
      });
    }, 10000); // 10 seconds

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  if (!isVisible) return null; // Don't render if not visible

  return (
    <>
      {/* Blurred Background Overlay */}
      <View style={styles.blurOverlay} />

      {/* Avatar and Alert Container */}
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY }, { translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Avatar and Alert Container */}
        <View style={styles.contentContainer}>
          {/* Alert Container */}
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>{duringCallMessage}</Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Avatar Image */}
          <Image
            source={require("@/assets/images/avatar.png")}
            style={styles.avatar}
          />
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  // blurOverlay: {
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   width: "100%",
  //   height: "100%",
  //   // backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black overlay
  //   zIndex: 999, // Below the avatar and alert
  // },
  container: {
    position: "absolute", // Position relative to the parent (LiveAudioStream)
    bottom: 0, // Stick to the bottom
    left: 0, // Stick to the left
    zIndex: 1000,
  },
  contentContainer: {
    flexDirection: "column", // Stack avatar and alert vertically
    alignItems: "flex-start", // Align items to the left
    gap: 10, // Gap of 10 between avatar and alert
  },
  avatar: {
    width: 100,
    height: 200,
    borderRadius: 50,
  },
  alertContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertText: {
    color: "white",
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
  },
});

export default AvatarAlert;