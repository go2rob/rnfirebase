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
    Unlisted: {},
    lists: {},
    sharedLists: {},
    isDateTimePickerVisible: false,
    listName: "Unlisted",
    title: helpers.randomTitle(),
    amount: helpers.randomAmount(),
    date: moment(),
    addListModalVisible: false,
    newListName: "",
    shareMenuVisible: false,
    selectedUser: {},
    selectedList: ""
  };

  otherUsers = () => {
    const allUsers = [
      { email: "user1@mail.com", uid: "Wm0dauw16dWZnZgDSyIITx6YOyi2" },
      { email: "user2@mail.com", uid: "ZP6nqYjfbBWx0s1zqa1AkFkQvLt1" },
      { email: "user3@mail.com", uid: "WoMrT7D0viPalWN9H7SKu44L93y1" }
    ];

    return _.values(
      _.omitBy(allUsers, user => user.uid === this.state.currentUser.uid)
    );
  };

  invitesRef = firebase.database().ref("invites");

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
        listName === "Unlisted" ? "Unlisted" : `lists/${listName}`;
      this.userRef
        .child(listPath)
        .child("items")
        .push(expData, error => {
          if (error) {
            console.log(error);
            alert(error.message);
          }
        });
    } else {
      alert("Fill All fields");
    }
  };

  addListeners = () => {
    // listenHere = snap => {
    //   console.log(snap.key);
    // };

    const uid = this.state.currentUser.uid;

    this.userRef.child("Unlisted").on("value", this.updateUnlisted);
    this.userRef.child("lists").on("child_added", this.handleListAdded);
    this.userRef.child("lists").on("child_changed", this.handleListChanged);
    this.invitesRef.child(`${uid}/`).on("value", this.fetchSharedLists);
  };

  removeListeners = () => {
    this.userRef.child("Unlisted").off("value", this.updateUnlisted);
    this.userRef.child("lists").off("child_added", this.handleListAdded);
    this.userRef.child("lists").off("child_changed", this.handleListChanged);
    this.invitesRef.child(`${uid}/`).off("value", this.fetchSharedLists);
  };

  updateUnlisted = snapshot => {
    this.setState(prevState => ({
      Unlisted: {
        ...prevState.Unlisted,
        ...snapshot.val()
      }
    }));
  };

  handleListAdded = (childSnapshot, prevChildKey) => {
    console.log("here");

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

  fetchSharedLists = snapshot => {
    const snap = {
      cll0m8HQ8jgeiYa0kbvAz58BLqG3: { "List 3": { read: true } },
      "5ybEuoGSj8d9Vb56Nfo5wuqohsH2": { "My List": { read: true } }
    };
    // "cll0m8HQ8jgeiYa0kbvAz58BLqG3": { "List 3": { read: true }, "List 2": {read: true} }
    const listPaths = _.reduce(
      snapshot.val(),
      (obj, lists, uid) => {
        const group = _.reduce(
          lists,
          (grp, permission, listName) => {
            if (permission.read) {
              const listPath = `/users/${uid}/lists/${listName}/items`;
              grp[`${uid}-${listName}`] = firebase
                .database()
                .ref(listPath).path;
            }
            return grp;
          },
          {}
        );
        obj = { ...obj, ...group };
        return obj;
      },
      {}
    );
    _.forEach(listPaths, (path, listKey) => {
      firebase
        .database()
        .ref(path)
        .once("value", snapshot => this.setSharedlist(listKey, snapshot));
    });
  };
  setSharedlist = (listKey, snapshot) => {
    this.setState(prevState => ({
      sharedLists: {
        ...prevState.sharedLists,
        ...{
          [listKey]: {
            name: listKey,
            items: snapshot.val()
          }
        }
      }
    }));
  };
  componentDidMount() {
    this.userRef = firebase
      .database()
      .ref(`users/${this.state.currentUser.uid}`);

    // const { currentUser } = firebase.auth();
    // if (currentUser !== this.state.currentUser) {
    //   this.setState({ currentUser });
    // }
    this.addListeners();
  }

  componentWillUnMount() {
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

  handleUserSelect = (itemValue, itemIndex) => {
    this.setState({
      selectedUser: itemValue
    });
  };

  addNewList = () => {
    this.setState(prevState => ({
      listName: prevState.newListName,
      addListModalVisible: !prevState.addListModalVisible
    }));
  };

  openShareMenu = list => {
    this.setState(prevState => ({
      shareMenuVisible: !prevState.shareMenuVisible,
      selectedList: list
    }));
  };

  shareList = () => {
    const visitor = this.state.selectedUser;
    const selectedList = this.state.selectedList;
    const invitee = this.state.currentUser.uid;
    const callback = error => {
      if (error) {
        alert(error.message);
      } else {
        const listRef = this.userRef.child(`/lists/${selectedList}`);
        listRef.child(`sharedWith/${visitor}`).set("true");
        alert("Invited");
      }
    };
    this.invitesRef
      .child(visitor)
      .child(`${invitee}/${selectedList}/read`)
      .set(true, callback);
  };

  render() {
    const {
      currentUser,
      newListName,
      Unlisted,
      selectedUser,
      sharedLists
    } = this.state;
    const tempList =
      newListName !== "" ? { [newListName]: { name: newListName } } : {};
    // console.log(sharedLists);

    const allLists = _.assign(this.state.lists, sharedLists, { Unlisted });

    return (
      <View style={styles.container}>
        <Text>Hi {currentUser && currentUser.email}!</Text>
        {_.map(allLists, (group, key) => (
          <View key={key} style={{ alignSelf: "flex-start" }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {group.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  this.openShareMenu(group.name);
                }}
              >
                <Text style={{ color: "blue", fontSize: 12 }}>
                  {group.name === "Unlisted" ? "" : "share"}
                </Text>
              </TouchableOpacity>
            </View>
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
              <Picker.Item key={key} label={key} value={key} />
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
          <Modal
            animationType="slide"
            visible={this.state.shareMenuVisible}
            onRequestClose={() => {
              this.setState(prevState => ({
                shareMenuVisible: !prevState.shareMenuVisible
              }));
            }}
          >
            <View style={styles.addListNameModal}>
              <Picker
                selectedValue={this.state.selectedUser}
                style={[styles.textInput]}
                onValueChange={this.handleUserSelect}
              >
                <Picker.Item label="select" value={{}} />
                {_.map(this.otherUsers(), (user, index) => (
                  <Picker.Item
                    key={index}
                    label={user.email}
                    value={user.uid}
                  />
                ))}
              </Picker>
              <Button
                title="share"
                onPress={() => {
                  this.shareList();
                }}
                disabled={selectedUser === {}}
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
