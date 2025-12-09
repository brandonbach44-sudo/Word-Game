import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { InkCoinIcon } from './InkDisplay';

interface PurchaseModalProps {
  visible: boolean;
  itemName: string;
  itemType: 'tile' | 'background';
  cost: number;
  currentBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode; // Preview of the item
}

export const PurchaseModal = ({
  visible,
  itemName,
  itemType,
  cost,
  currentBalance,
  onConfirm,
  onCancel,
  children,
}: PurchaseModalProps) => {
  const canAfford = currentBalance >= cost;
  const newBalance = currentBalance - cost;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              {/* Header */}
              <Text style={styles.title}>Purchase {itemType === 'tile' ? 'Tile' : 'Background'}</Text>
              
              {/* Preview */}
              <View style={styles.previewContainer}>
                {children}
              </View>
              
              {/* Item Name */}
              <Text style={styles.itemName}>{itemName}</Text>
              
              {/* Cost Display */}
              <View style={styles.costContainer}>
                <Text style={styles.costLabel}>Cost:</Text>
                <View style={styles.costValue}>
                  <InkCoinIcon size={24} />
                  <Text style={styles.costAmount}>{cost}</Text>
                </View>
              </View>
              
              {/* Balance Info */}
              <View style={styles.balanceContainer}>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Current Balance:</Text>
                  <View style={styles.balanceValue}>
                    <InkCoinIcon size={18} />
                    <Text style={styles.balanceAmount}>{currentBalance.toLocaleString()}</Text>
                  </View>
                </View>
                
                {canAfford && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>After Purchase:</Text>
                    <View style={styles.balanceValue}>
                      <InkCoinIcon size={18} />
                      <Text style={[styles.balanceAmount, styles.newBalance]}>
                        {newBalance.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
                
                {!canAfford && (
                  <Text style={styles.insufficientText}>
                    Insufficient Ink! Need {(cost - currentBalance).toLocaleString()} more.
                  </Text>
                )}
              </View>
              
              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={onCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.confirmButton,
                    !canAfford && styles.confirmButtonDisabled
                  ]} 
                  onPress={onConfirm}
                  disabled={!canAfford}
                >
                  <Text style={[
                    styles.confirmButtonText,
                    !canAfford && styles.confirmButtonTextDisabled
                  ]}>
                    {canAfford ? 'Purchase' : 'Cannot Afford'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: '#4ecca3',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(15, 26, 46, 0.5)',
    borderRadius: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ecca3',
    textAlign: 'center',
    marginBottom: 20,
  },
  costContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
  },
  costLabel: {
    fontSize: 16,
    color: '#ccc',
    marginRight: 10,
  },
  costValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700',
    marginLeft: 8,
  },
  balanceContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: 'rgba(22, 33, 62, 0.8)',
    borderRadius: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888',
  },
  balanceValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  newBalance: {
    color: '#4ecca3',
  },
  insufficientText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ecca3',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4ecca3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4ecca3',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#333',
  },
  confirmButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: '#666',
  },
});
