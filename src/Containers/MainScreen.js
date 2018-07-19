import React from "react";
import {
  FlatList,
  Button,
  StyleSheet,
  Platform,
  Image,
  Text,
  TextInput,
  Picker,
  TouchableOpacity,
  View,
  Modal
} from "react-native";
import _ from "lodash";
import moment from "moment";
import firebase from "react-native-firebase";
import DateTimePicker from "react-native-modal-datetime-picker";

const helpers = {
  randomAmount: () => {
    const arr = ["100", "200", "300"];
    return arr[Math.floor(Math.random() * arr.length)];
  },
  randomTitle: () => {
    const arr = ["Grocery", "Electronics", "Maintenance", "Picnic"];
    return arr[Math.floor(Math.random() * arr.length)];
  }
};

export default class MainScreen extends React.Component {
  state = {
    currentUser: firebase.auth().currentUser,
    mainList: {},
    lists: {},
    isDateTimePickerVisible: false,
    listName: "Default",
    title: helpers.randomTitle(),
    amount: helpers.randomAmount(),
    date: moment(),
    addListModalVisible: false,
    newListName: ""
  };

  userRef = firebase.database().ref(`/${this.state.currentUser.uid}`);

  showDateTimePicker = () =>
    this.setState(prevState => ({
      ...prevState,
      isDateTimePickerVisible: true
    }));

  hideDateTimePicker = () =>
    this.setState(prevState => ({
      ...prevState,
      isDateTimePickerVisible: false
    }));

  addExpense = () => {
    const { title, amount, listName, date, currentUser } = this.state;
    const expData = { title, amount, date };
    const valid = _.every([title, amount], val => val !== "");
    if (valid) {
      const listPath =
        listName === "mainList" ? "mainList" : `lists/${listName}`;
      this.userRef
        .child(listPath)
        .child("items")
        .push(expData, error => {
          if (error) {
            console.log(error);
            alert(error.message);
          } else {
            alert("Success");
          }
        });
    } else {
      alert("Fill All fields");
    }
  };

  addListeners = () => {
    this.userRef.child("mainList").on("value", this.updateMainList);
    this.userRef.child("lists").on("child_added", this.handleListAdded);
    this.userRef.child("lists").on("child_changed", this.handleListChanged);
  };

  removeListeners = () => {
    this.userRef.child("mainList").off("value", this.updateMainList);
    this.userRef.child("lists").off("child_added", this.handleListAdded);
    this.userRef.child("lists").off("child_changed", this.handleListChanged);
  };

  updateMainList = snapshot => {
    this.setState(prevState => ({
      mainList: {
        ...prevState.mainList,
        ...snapshot.val()
      }
    }));
  };

  handleListAdded = (childSnapshot, prevChildKey) => {
    this.userRef
      .child(`lists/${childSnapshot.ref.key}`)
      .child("name")
      .set(childSnapshot.ref.key);

    this.setState(prevState => ({
      lists: {
        ...prevState.lists,
        [childSnapshot.ref.key]: {
          ...prevState.lists[childSnapshot.ref.key],
          ...childSnapshot.val()
        }
      },
      newListName: ""
    }));
  };

  handleListChanged = (childSnapshot, prevChildKey) => {
    this.setState(prevState => ({
      lists: {
        ...prevState.lists,
        [childSnapshot.ref.key]: {
          ...prevState.lists[childSnapshot.ref.key],
          ...childSnapshot.val()
        }
      },
      newListName: ""
    }));
  };

  componentDidMount() {
    const { currentUser } = firebase.auth();
    if (currentUser !== this.state.currentUser) {
      this.setState({ currentUser });
    }
    this.addListeners();
  }

  componentWillUnNount() {
    this.removeListeners();
  }

  signOut = () => {
    firebase.auth().signOut();
    this.props.navigation.navigate("LoadingScreen");
  };

  handleListSelect = (itemValue, itemIndex) => {
    if (itemValue === "create list") {
      this.setState(prevState => ({
        addListModalVisible: !prevState.addListModalVisible
      }));
    } else {
      this.setState({ listName: itemValue });
    }
  };

  addNewList = () => {
    this.setState(prevState => ({
      listName: prevState.newListName,
      addListModalVisible: !prevState.addListModalVisible
    }));
  };

  render() {
    const { currentUser, newListName, mainList } = this.state;
    const tempList =
      newListName !== "" ? { [newListName]: { name: newListName } } : {};
    const allLists = _.assign(this.state.lists, { mainList });
    // console.log(allLists);
    // alert(this.state.amount);

    return (
      <View style={styles.container}>
        <Text>Hi {currentUser && currentUser.email}!</Text>
        {_.map(allLists, (group, key) => (
          <View key={key} style={{ alignSelf: "flex-start" }}>
            <Text style={{ fontWeight: "bold" }}>{group.name}</Text>
            {_.map(group.items, (exp, key) => (
              <Text key={key}>
                {moment(exp.date).format("DD MMM")} | {exp.title} | {exp.amount}
              </Text>
            ))}
          </View>
        ))}
        {this.state.errorMessage && (
          <Text style={{ color: "red" }}>{this.state.errorMessage}</Text>
        )}
        <View style={styles.formSegment}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={this.showDateTimePicker}
          >
            <Text>{this.state.date.format("D")}</Text>
            <Text>{this.state.date.format("MMM")}</Text>
          </TouchableOpacity>
          <TextInput
            placeholder="Expense"
            autoCapitalize="none"
            style={styles.textInput}
            onChangeText={title => this.setState({ title })}
            value={this.state.title}
          />
          <TextInput
            keyboardType="numeric"
            placeholder="Amount"
            autoCapitalize="none"
            style={styles.numInput}
            onChangeText={amount => this.setState({ amount })}
            value={`${this.state.amount}`}
          />
          <Picker
            selectedValue={this.state.listName}
            style={[
              styles.textInput,
              { backgroundColor: "transparent", width: "28%" }
            ]}
            onValueChange={this.handleListSelect}
          >
            {_.map({ ...allLists, ...tempList }, (list, key) => (
              <Picker.Item
                key={key}
                label={list.name === "mainList" ? "Default" : list.name || key}
                value={key}
              />
            ))}
            <Picker.Item label="+" value="create list" />
          </Picker>
          <Modal
            animationType="slide"
            visible={this.state.addListModalVisible}
            onRequestClose={() => {
              this.setState(prevState => ({
                addListModalVisible: !prevState.addListModalVisible
              }));
            }}
          >
            <View style={styles.addListNameModal}>
              <TextInput
                placeholder="ListName"
                autoCapitalize="none"
                style={styles.textInput}
                onChangeText={newListName => this.setState({ newListName })}
                value={`${this.state.newListName}`}
              />
              <Button
                title={newListName === "" ? "Add" : `Add to ${newListName}`}
                onPress={this.addNewList}
                disabled={newListName === ""}
              />
            </View>
          </Modal>
          <Button title="Add" onPress={this.addExpense} />
          <DateTimePicker
            isVisible={this.state.isDateTimePickerVisible}
            onConfirm={date =>
              this.setState({
                date: moment(date),
                isDateTimePickerVisible: false
              })
            }
            onCancel={this.hideDateTimePicker}
          />
        </View>
        <Button title="Signout" onPress={this.signOut} />
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
    width: "33%"
    // marginTop: 8
  },
  numInput: {
    height: 40,
    width: "15%"
    // marginTop: 8
  },
  formSegment: {
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    width: "98%"
  },
  dateButton: {
    elevation: 2,
    width: "8%",
    borderWidth: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  addListNameModal: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    width: 500
  }
});
