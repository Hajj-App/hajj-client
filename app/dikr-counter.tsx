import { 
  View, 
  Text, 
  Image, 
  Pressable, 
  TextInput, 
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  SafeAreaView,
  Modal,
  TouchableOpacity
} from "react-native";
import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";

interface Dikr {
  name: string;
  count: number;
}

const DikrCounter = () => {
  const [count, setCount] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const [dikrName, setDikrName] = useState("Dikr");
  const [editCount, setEditCount] = useState("");

  // Load saved data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('dikrData');
        if (savedData) {
          const { name, count } = JSON.parse(savedData);
          setDikrName(name);
          setCount(count);
        }
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };
    loadData();
  }, []);

  // Save data when count or name changes
  useEffect(() => {
    const saveData = async () => {
      try {
        const dataToSave = JSON.stringify({ name: dikrName, count });
        await AsyncStorage.setItem('dikrData', dataToSave);
      } catch (error) {
        console.error('Failed to save data', error);
      }
    };
    saveData();
  }, [dikrName, count]);

  const incrementCount = () => {
    if (count < 99999) {
      setCount(prev => prev + 1);
    }
  };

  const reset = () => {
    setCount(0);
  };

  const saveChanges = () => {
    const newCount = Math.min(parseInt(editCount) || count, 99999);
    setCount(newCount);
    setShowManage(false);
    setEditCount("");
    Keyboard.dismiss();
  };

  const openManageModal = () => {
    setEditCount(count.toString());
    setShowManage(true);
  };

  // Ensure edit count never exceeds max value
  const handleEditCountChange = (text: string) => {
    // Only allow numeric input
    if (/^\d*$/.test(text)) {
      const num = parseInt(text) || 0;
      // If number is greater than max, set to max
      if (num > 99999) {
        setEditCount("99999");
      } else {
        setEditCount(text);
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
            <Text style={styles.countText} className="mt-20">{count}</Text>
          </Pressable>

          {/* Divider Line */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable 
              onPress={openManageModal} 
              style={styles.actionButton}
            >
              <Text style={styles.buttonText}>Manage</Text>       
            </Pressable>

            <Pressable onPress={reset} style={styles.actionButton}>
              <Text style={styles.buttonText}>Reset</Text>       
            </Pressable>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Manage Modal */}
      <Modal
        visible={showManage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowManage(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowManage(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Manage Dikr</Text>
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
                  placeholder="Set Count"
                  value={editCount}
                  onChangeText={handleEditCountChange}
                  keyboardType="numeric"
                  style={styles.textInput}
                  maxLength={5}
                />
                
                <Pressable 
                  onPress={saveChanges}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
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
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  counterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterImage: {
    width: 380,
    height: 380,
  },
  countText: {
    position: 'absolute',
    top: 10,
    fontSize: 42,
    fontWeight: 'bold',
    right: 0,
    marginRight: 128,
    marginTop: 60
  },
  divider: {
    width: '75%',
    height: 1,
    borderRadius: 10,
    backgroundColor: 'gray',
    opacity: 0.3,
    marginBottom: 32,
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DikrCounter;