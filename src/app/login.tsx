import { useState } from "react";
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { Image } from "expo-image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await signIn(email, password);
      // Navigation will be handled by the auth provider
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Logo and Branding */}
            <View className="items-center mb-16">
              <View className="">
                <Image
                  source={require("@/assets/logo.png")}
                  style={{
                    width: 120,
                    height: 120,
                  }}
                  contentFit="contain"
                />
              </View>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center font-normal" style={{ lineHeight: 20 }}>
                Your legal counsellor
              </Text>
            </View>

            {/* Login Form */}
            <View className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Email Input */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" style={{ lineHeight: 18 }}>
                  Email
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-1 border border-gray-200 dark:border-gray-600">
                  <Mail size={18} color="#9CA3AF" className="mr-3" />
                  <Input
                    placeholder="  Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    className="flex-1 text-base text-gray-900 dark:text-white bg-transparent border-0 p-0"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-8">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" style={{ lineHeight: 18 }}>
                  Password
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-1 border border-gray-200 dark:border-gray-600">
                  <Lock size={18} color="#9CA3AF" className="mr-3" />
                  <Input
                    placeholder="  Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 text-base text-gray-900 dark:text-white bg-transparent border-0 p-0"
                    editable={!loading}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="ml-2 p-1"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#9CA3AF" />
                    ) : (
                      <Eye size={18} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <Button
                onPress={handleLogin}
                disabled={loading}
                className="bg-gray-900 dark:bg-white rounded-lg py-4 mb-6 shadow-sm"
              >
                <Text className="text-white dark:text-gray-900 font-medium text-base text-center h-6" style={{ lineHeight: 22 }}>
                  {loading ? "Signing in..." : "Sign in"}
                </Text>
              </Button>

              {/* Sign Up Link */}
              <View className="items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <Text className="text-gray-600 dark:text-gray-400 text-sm mb-3" style={{ lineHeight: 18 }}>
                  Don't have an account?
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/signup")}
                  className="py-2"
                >
                  <Text className="text-gray-900 dark:text-white font-medium text-sm" style={{ lineHeight: 18 }}>
                    Create account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
