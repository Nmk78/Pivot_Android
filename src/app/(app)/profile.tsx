import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Profile() {
  const router = useRouter();

  const handleSignOut = () => {
    // Implement sign out logic here
    console.log("Signing out...");
    router.replace("/"); // Redirect to home or login screen
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile</Text>
      {/* Add user profile information here */}
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
}
