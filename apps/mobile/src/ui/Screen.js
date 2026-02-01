import React from "react";
import { Platform, ScrollView, View } from "react-native";

export default function Screen({ children }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 24,
        alignItems: "center",
        flexGrow: 2,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          width: "100%",
          maxWidth: Platform.OS === "web" ? 560 : undefined,
          flex: 1,
          minHeight: "110%",
          backgroundColor: "rgb(255, 255, 255)",
          borderRadius: 16,
          padding: 14,
          gap: 12,
          borderWidth: 1,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
