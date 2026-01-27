import { useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

type DikrItem = {
  id: string;
  name: string;
  count: number;
  notify: number;
};

const DikrCounter = () => {
  const router = useRouter(); // Standard naming
  const [count, setCount] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const [showDikrDropdown, setShowDikrDropdown] = useState(false);
  const [dikrName, setDikrName] = useState("Dikr");
  const [editCount, setEditCount] = useState("");
  const [editNotify, setEditNotify] = useState("");
  const [dikrList, setDikrList] = useState<DikrItem[]>([]);
  const [currentDikrId, setCurrentDikrId] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingDikrId, setEditingDikrId] = useState("");
  const [buttonText, setButtonText] = useState("Manage Dikr");
  
  const { t } = useTranslation();

  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedDikrList = await AsyncStorage.getItem("dikrList");
        const savedCurrentId = await AsyncStorage.getItem("currentDikrId");

        if (savedDikrList) {
          const list = JSON.parse(savedDikrList);
          setDikrList(list);

          if (savedCurrentId) {
            setCurrentDikrId(savedCurrentId);
            const currentDikr = list.find((d:DikrItem) => d.id === savedCurrentId);
            if (currentDikr) {
              setDikrName(currentDikr.name);
              setCount(currentDikr.count);
            }
          } else if (list.length > 0) {
            setCurrentDikrId(list[0].id);
            setDikrName(list[0].name);
            setCount(list[0].count);
          }
        }
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  // Save data when relevant states change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("dikrList", JSON.stringify(dikrList));
        await AsyncStorage.setItem("currentDikrId", currentDikrId);
      } catch (error) {
        console.error("Failed to save data", error);
      }
    };
    saveData();
  }, [dikrList, currentDikrId]);

  const incrementCount = () => {
    if (count < 99999) {
      const newCount = count + 1;
      setCount(newCount);
      
      if (currentDikrId) {
        const updatedList = dikrList.map(dikr => 
          dikr.id === currentDikrId ? {...dikr, count: newCount} : dikr
        );
        setDikrList(updatedList);
      }
    }
  };

  const reset = () => {
    const newCount = 0;
    setCount(newCount);
    
    if (currentDikrId) {
      const updatedList = dikrList.map(dikr => 
        dikr.id === currentDikrId ? {...dikr, count: newCount} : dikr
      );
      setDikrList(updatedList);
    }
  };


  // Vibration 

    useEffect(() => {
    if (currentDikrId) {
      const currentDikr = dikrList.find(d => d.id === currentDikrId);
      if (currentDikr && count > 0 && count === currentDikr.notify) {
        // Vibrate for 500ms
        Vibration.vibrate(500);
        
        // Optional: You can add a longer pattern if desired
        // Vibration.vibrate([0, 500, 200, 500]);
      }
    }
  }, [count, currentDikrId, dikrList]);

  const toggleDikrDropdown = () => {
    setShowDikrDropdown(!showDikrDropdown);
  };

  const selectDikr = (dikr: DikrItem) => {
    setDikrName(dikr.name);
     setButtonText(dikr.name);
    setCount(dikr.count);
    setCurrentDikrId(dikr.id);
    setShowDikrDropdown(false);
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setDikrName("");
    setEditCount("0");
    setEditNotify("100");
    setEditingDikrId("");
    setShowDikrDropdown(false);
    setShowManage(true);
  };

  const startEditingDikr = (dikr: DikrItem) => {
    setIsAddingNew(false);
    setDikrName(dikr.name);
    setEditCount(dikr.count.toString());
    setEditNotify(dikr.notify.toString());
    setEditingDikrId(dikr.id);
    setShowDikrDropdown(false);
    setShowManage(true);
  };

  const saveDikr = () => {
    if (isAddingNew) {
      const newDikr: DikrItem = {
        id: Date.now().toString(),
        name: dikrName,
        count: parseInt(editCount) || 0,
        notify: parseInt(editNotify) || 100,
      };
      const updatedList = [...dikrList, newDikr];
      setDikrList(updatedList);
      selectDikr(newDikr);
    } else {
      const updatedList = dikrList.map(dikr => 
        dikr.id === editingDikrId
          ? {
              ...dikr,
              name: dikrName,
              count: parseInt(editCount) || dikr.count,
              notify: parseInt(editNotify) || dikr.notify,
            }
          : dikr
      );
      setDikrList(updatedList);
      
      if (editingDikrId === currentDikrId) {
        setCount(parseInt(editCount) || count);
      }
    }
    setShowManage(false);
  };

  const deleteDikr = (id: string) => {
    const updatedList = dikrList.filter(dikr => dikr.id !== id);
    setDikrList(updatedList);
    
    if (currentDikrId === id) {
      if (updatedList.length > 0) {
        selectDikr(updatedList[0]);
      } else {
        setDikrName("Dikr");
        setCount(0);
        setCurrentDikrId("");
      }
    }
  };

  const handleEditCountChange = (text: string) => {
    if (/^\d*$/.test(text)) {
      const num = parseInt(text) || 0;
      if (num > 99999) {
        setEditCount("99999");
      } else {
        setEditCount(text);
      }
    }
  };

  const handleEditNotifyChange = (text: string) => {
    if (/^\d*$/.test(text)) {
      const num = parseInt(text) || 0;
      if (num > 99999) {
        setEditNotify("99999");
      } else {
        setEditNotify(text);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <AntDesign name="left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("dikr")}</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <TouchableWithoutFeedback onPress={() => setShowDikrDropdown(false)}>
        <View style={styles.content}>
          {/* Counter Display */}
          <Pressable onPress={incrementCount} style={styles.counterButton}>
            <Image
              source={require("@/assets/images/tally-counter.png")}
              style={styles.counterImage}
              resizeMode="contain"
            />
            <Text style={styles.countText}>{count}</Text>
          </Pressable>

          {/* Divider Line */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable 
              onPress={toggleDikrDropdown} 
              style={styles.manageButton}
            >
             <Text style={styles.buttonText}>{buttonText}</Text>
              <Ionicons 
                name={showDikrDropdown ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="black" 
                style={styles.dropdownIcon}
              />
            </Pressable>

            <Pressable onPress={reset} style={styles.resetButton}>
              <Text style={styles.buttonText}>{t("reset")}</Text>
            </Pressable>
          </View>

          {/* Dikr Dropdown */}
          {showDikrDropdown && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownScroll}>
                {dikrList.map((dikr) => (
                  <View key={dikr.id} style={styles.dropdownItemContainer}>
                    <Pressable
                      onPress={() => selectDikr(dikr)}
                      style={styles.dropdownItem}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        currentDikrId === dikr.id && styles.selectedDikrText
                      ]}>
                        {dikr.name}
                      </Text>
                      <Text style={styles.dropdownItemCount}>{dikr.count}</Text>
                    </Pressable>
                    <View style={styles.dropdownItemActions}>
                      <TouchableOpacity 
                        onPress={() => startEditingDikr(dikr)}
                        style={styles.editButton}
                      >
                        <Feather name="edit" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => deleteDikr(dikr.id)}
                        style={styles.deleteButton}
                      >
                        <Feather name="trash-2" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
              <Pressable 
                onPress={startAddingNew} 
                style={styles.addNewButton}
              >
                <Feather name="plus" size={16} color="#3b82f6" />
                <Text style={styles.addNewButtonText}>Add New Dikr</Text>
              </Pressable>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Edit/Add Dikr Modal */}
      <Modal
        visible={showManage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManage(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowManage(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isAddingNew ? "Add New Dikr" : "Edit Dikr"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowManage(false)}
                    style={styles.closeButton}
                  >
                    <AntDesign name="close" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Dikr Name"
                  value={dikrName}
                  onChangeText={setDikrName}
                  style={styles.textInput}
                />

                <TextInput
                  placeholder="Count"
                  value={editCount}
                  onChangeText={handleEditCountChange}
                  keyboardType="numeric"
                  style={styles.textInput}
                  maxLength={5}
                />

                <TextInput
                  placeholder="Notify At"
                  value={editNotify}
                  onChangeText={handleEditNotifyChange}
                  keyboardType="numeric"
                  style={styles.textInput}
                  maxLength={5}
                />

                <Pressable 
                  onPress={saveDikr} 
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>
                    {isAddingNew ? "Add Dikr" : "Save Changes"}
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  counterButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  counterImage: {
    width: 380,
    height: 380,
  },
  countText: {
    position: "absolute",
    top: 10,
    fontSize: 42,
    fontWeight: "bold",
    right: 0,
    marginRight: 128,
    marginTop: 60,
  },
  dikrNameText: {
    position: "absolute",
    top: 10,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 120,
    marginRight: 128,
    right: 0,
    color: "#3b82f6",
  },
  divider: {
    width: "75%",
    height: 1,
    borderRadius: 10,
    backgroundColor: "gray",
    opacity: 0.3,
    marginBottom: 32,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    width: "75%",
    justifyContent: "space-between",
  },
  manageButton: {
    flex: 1,
    backgroundColor: "#e0e0e0",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownContainer: {
    width: "75%",
    maxHeight: 200,
    backgroundColor: "white",
    borderRadius: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 10,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 10,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  selectedDikrText: {
    color: "#3b82f6",
    fontWeight: "bold",
  },
  dropdownItemCount: {
    fontSize: 14,
    color: "#666",
  },
  dropdownItemActions: {
    flexDirection: "row",
    gap: 10,
  },
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 5,
  },
  addNewButtonText: {
    marginLeft: 5,
    color: "#3b82f6",
    fontWeight: "bold",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  textInput: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default DikrCounter;
