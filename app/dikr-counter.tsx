import {
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type DikrItem = {
  id: string;
  name: string;
  count: number;
  notify: number;
};

const DikrCounter = () => {
  const [count, setCount] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const [showDikrList, setShowDikrList] = useState(false);
  const [dikrName, setDikrName] = useState("Dikr");
  const [editCount, setEditCount] = useState("");
  const [editNotify, setEditNotify] = useState("");
  const [dikrList, setDikrList] = useState<DikrItem[]>([]);
  const [currentDikrId, setCurrentDikrId] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { t } = useTranslation();

  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("dikrData");
        const savedDikrList = await AsyncStorage.getItem("dikrList");
        const savedCurrentId = await AsyncStorage.getItem("currentDikrId");

        if (savedDikrList) {
          const list = JSON.parse(savedDikrList);
          setDikrList(list);

          if (savedCurrentId) {
            setCurrentDikrId(savedCurrentId);
            const currentDikr = list.find(d => d.id === savedCurrentId);
            if (currentDikr) {
              setDikrName(currentDikr.name);
              setCount(currentDikr.count);
            }
          } else if (list.length > 0) {
            // If no current ID but have list, select first item
            setCurrentDikrId(list[0].id);
            setDikrName(list[0].name);
            setCount(list[0].count);
          }
        }

        if (savedData && !savedCurrentId) {
          // Legacy support for old data format
          const { name, count } = JSON.parse(savedData);
          setDikrName(name);
          setCount(count);
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
      
      // Update count in dikrList
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

  const openManageModal = () => {
    setShowDikrList(true);
  };

  const selectDikr = (dikr: DikrItem) => {
    setDikrName(dikr.name);
    setCount(dikr.count);
    setCurrentDikrId(dikr.id);
    setShowDikrList(false);
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setDikrName("");
    setEditCount("0");
    setEditNotify("100");
    setShowDikrList(false);
    setShowManage(true);
  };

  const saveNewDikr = () => {
    const newDikr: DikrItem = {
      id: Date.now().toString(),
      name: dikrName,
      count: parseInt(editCount) || 0,
      notify: parseInt(editNotify) || 100,
    };

    const updatedList = [...dikrList, newDikr];
    setDikrList(updatedList);
    selectDikr(newDikr);
    setIsAddingNew(false);
    setShowManage(false);
  };

  const updateCurrentDikr = () => {
    if (!currentDikrId) return;

    const updatedList = dikrList.map(dikr => 
      dikr.id === currentDikrId 
        ? {
            ...dikr,
            name: dikrName,
            count: parseInt(editCount) || dikr.count,
            notify: parseInt(editNotify) || dikr.notify,
          }
        : dikr
    );

    setDikrList(updatedList);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            <Pressable onPress={openManageModal} style={styles.actionButton}>
              <Text style={styles.buttonText}>{t("manage")}</Text>
            </Pressable>

            <Pressable onPress={reset} style={styles.actionButton}>
              <Text style={styles.buttonText}>{t("reset")}</Text>
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Dikr List Modal */}
      <Modal
        visible={showDikrList}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDikrList(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDikrList(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { width: "90%", maxHeight: "70%" }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Dikr</Text>
                  <TouchableOpacity
                    onPress={() => setShowDikrList(false)}
                    style={styles.closeButton}
                  >
                    <AntDesign name="close" size={24} color="black" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.dikrListScroll}>
                  {dikrList.map((dikr) => (
                    <View key={dikr.id} style={styles.dikrItemContainer}>
                      <Pressable 
                        onPress={() => selectDikr(dikr)}
                        style={styles.dikrItem}
                      >
                        <Text style={[
                          styles.dikrItemName,
                          currentDikrId === dikr.id && styles.selectedDikrName
                        ]}>
                          {dikr.name}
                        </Text>
                        <View style={styles.dikrItemDetails}>
                          <Text style={styles.dikrItemCount}>Count</Text>
                          <Text style={styles.dikrItemNotify}>Notify: {dikr.notify}</Text>
                        </View>
                      </Pressable>
                      <TouchableOpacity 
                        onPress={() => deleteDikr(dikr.id)}
                        style={styles.deleteButton}
                      >
                        <Feather name="trash-2" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.dikrListFooter}>
                  <Pressable 
                    onPress={startAddingNew} 
                    style={styles.addButton}
                  >
                    <Feather name="plus" size={20} color="white" />
                    <Text style={styles.addButtonText}>Add New Dikr</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
                  onPress={isAddingNew ? saveNewDikr : updateCurrentDikr} 
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
  },
  actionButton: {
    backgroundColor: "#e0e0e0",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 18,
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
  dikrListScroll: {
    maxHeight: "80%",
  },
  dikrItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  dikrItem: {
    paddingVertical: 15,
    flex: 1,
  },
  dikrItemName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  selectedDikrName: {
    color: "#3b82f6",
  },
  dikrItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dikrItemCount: {
    color: "#666",
  },
  dikrItemNotify: {
    color: "#666",
  },
  deleteButton: {
    padding: 10,
  },
  dikrListFooter: {
    marginTop: 15,
  },
  addButton: {
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default DikrCounter;
