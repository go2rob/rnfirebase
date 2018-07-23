import React from "react";
import { StyleSheet, Text, TextInput, View, Button } from "react-native";

import firebase from "react-native-firebase";
import _ from "lodash";

export default class SignupScreen extends React.Component {
  state = { email: "", password: "", errorMessage: null };

  createNode = user => {
    const userRef = firebase
      .database()
      .ref("/")
      .child("users")
      .child(user.uid);

    userRef.child("uid").set(user.uid);
    userRef.child("Unlisted/name").set("Unlisted");
    // .set({
    //   uid: user.uid,
    //   Unlisted: {
    //     name: "Unlisted"
    //   }
    // });
  };
  // saveToDatabase = user => {
  //   console.log("user");
  //   console.log(user);

  // const name = user.email.split("@")[0];
  // firebase
  //   .database()
  //   .ref("/users")
  //   .push({ email: user.email }, error => {
  //     if (error) {
  //       console.log(error);
  //     }
  //     console.log("pushed.");
  //   });
  // }
  // this.props.navigation.navigate("MainScreen");

  // functions.auth.user().onCreate((user) => {
  //   // ...
  // });

  handleSignUp = () => {
    const { email, password } = this.state;
    if (_.some([email, password], val => val === "")) {
      this.setState({ errorMessage: "Fill all Fields" });
    } else {
      firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then(
          user => this.createNode(user),
          error => this.setState({ errorMessage: error.message })
        );
    }
  };
  // user => this.saveToDatabase(user),
  // .catch(error => console.log(error));
  // .catch(error => this.setState({ errorMessage: error.message }));

  render() {
    return (
      <View style={styles.container}>
        <Text>Sign Up</Text>
        {this.state.errorMessage && (
          <Text style={{ color: "red" }}>{this.state.errorMessage}</Text>
        )}
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={email => this.setState({ email })}
          value={this.state.email}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={password => this.setState({ password })}
          value={this.state.password}
        />
        <Button title="Sign Up" onPress={this.handleSignUp} />
        <Button
          title="Already have an account? Login"
          onPress={() => this.props.navigation.navigate("LoginScreen")}
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  textInput: {
    height: 40,
    width: "90%",
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 8
  }
});
