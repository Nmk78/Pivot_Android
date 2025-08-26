import "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import Sidebar from "@/components/sidebar";
import { Menu } from "lucide-react-native";
import { DrawerActions } from "@react-navigation/native";
import { Pressable } from "react-native";

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={() => <Sidebar />}
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: "#007AFF", // Example blue background
        },
        headerTintColor: "white",
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginLeft: 15 }}
          >
            <Menu size={26} color="white" />
          </Pressable>
        ),
      })}
    >
      <Drawer.Screen
        name="index" // This is the screen name
        options={{
          drawerLabel: "Home",
          title: "Chat",
        }}
      />
      <Drawer.Screen
        name="profile" // This is the screen name
        options={{
          drawerLabel: "Profile",
          title: "Profile",
        }}
      />
    </Drawer>
  );
}
