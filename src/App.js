import React from "react";
import { StyleSheet, Platform, Image, Text, View } from "react-native";
import { createSwitchNavigator } from "react-navigation";
// import the different screens
import LoadingScreen from "./Containers/LoadingScreen";
import SignupScreen from "./Containers/SignupScreen";
import LoginScreen from "./Containers/LoginScreen";
import MainScreen from "./Containers/MainScreen";
// create our app's navigation stack
const App = createSwitchNavigator(
  {
    LoadingScreen,
    SignupScreen,
    LoginScreen,
    MainScreen
  },
  {
    initialRouteName: "LoadingScreen"
  }
);
export default App;
