import React from "react";
import {
  StyleSheet,
  Platform,
  Image,
  Button,
  Text,
  View,
  ScrollView
} from "react-native";
// import { SwitchNavigator } from "react-navigation";
import firebase from "react-native-firebase";
// import SignUp from './SignUp'
// import Login from './Login'
// import Main from "./Main";

// const cred = firebase.auth.GoogleAuthProvider.credential(idToken, accessToken);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // firebase things?
      userName: ""
    };
  }

  componentDidMount() {
    // firebase things?
    firebase.database().goOnline();
    this.fetchData();
  }

  fetchData() {
    const names = firebase.database().ref("/data/names");
    console.log(names);

    // this.setState({
    //   name: names.name
    // });
  }
  // this.fetchData().bind(this)
  render() {
    return (
      <ScrollView>
        <View style={styles.container}>
          <Button
            style={styles.welcome}
            onPress={() => console.log(this)}
            title="Fetch"
          />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  logo: {
    height: 80,
    marginBottom: 16,
    marginTop: 32,
    width: 80
  },
  welcome: {
    fontSize: 40,
    textAlign: "center"
    // margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  modules: {
    margin: 20
  },
  modulesHeader: {
    fontSize: 16,
    marginBottom: 8
  },
  module: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center"
  }
});
