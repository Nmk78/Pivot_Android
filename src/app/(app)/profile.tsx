import { View, Text, Button, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";

export default function Profile() {
  const router = useRouter();
  const { user, signOut, updateUser, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the auth provider
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await updateUser({
        full_name: fullName,
        username: username,
      });
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 20, textAlign: "center" }}>Profile</Text>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Email:</Text>
        <Text style={{ fontSize: 14, color: "gray", marginBottom: 16 }}>{user.email}</Text>
        
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Full Name:</Text>
        {isEditing ? (
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            style={{
              height: 40,
              borderColor: "gray",
              borderWidth: 1,
              marginBottom: 12,
              paddingHorizontal: 8,
            }}
            editable={!loading}
          />
        ) : (
          <Text style={{ fontSize: 14, color: "gray", marginBottom: 16 }}>{user.full_name}</Text>
        )}
        
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Username:</Text>
        {isEditing ? (
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={{
              height: 40,
              borderColor: "gray",
              borderWidth: 1,
              marginBottom: 12,
              paddingHorizontal: 8,
            }}
            editable={!loading}
          />
        ) : (
          <Text style={{ fontSize: 14, color: "gray", marginBottom: 16 }}>{user.username}</Text>
        )}
        
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Role:</Text>
        <Text style={{ fontSize: 14, color: "gray", marginBottom: 16 }}>{user.role}</Text>
        
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Member Since:</Text>
        <Text style={{ fontSize: 14, color: "gray", marginBottom: 16 }}>
          {new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={{ marginTop: 20 }}>
        {isEditing ? (
          <View>
            <Button 
              title={loading ? "Updating..." : "Save Changes"} 
              onPress={handleUpdateProfile}
              disabled={loading}
            />
            <View style={{ marginTop: 10 }}>
              <Button 
                title="Cancel" 
                onPress={() => {
                  setIsEditing(false);
                  setFullName(user.full_name);
                  setUsername(user.username);
                }}
                color="gray"
              />
            </View>
          </View>
        ) : (
          <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
        )}
        
        <View style={{ marginTop: 20 }}>
          <Button title="Sign Out" onPress={handleSignOut} color="red" />
        </View>
      </View>
    </View>
  );
}
