import { StyleSheet } from "react-native";
import Modal from "react-native-modal";

interface ModalBaseProps {
  modalState: boolean;
  setModalState: React.Dispatch<React.SetStateAction<boolean>>;
  onDismiss?: () => unknown;
  children: React.ReactNode;
}

/**
 * ModalBase component that provides a base structure for modals.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {boolean} props.modalState - The state of the modal, indicating whether it is visible or not.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setModalState - Function to set the state of the modal.
 * @param {function(): unknown} props.onDismiss - Optional callback function to be called when the modal is dismissed.
 * @param {React.ReactNode} props.children - The content to be displayed inside the modal, this should be declared as JSX elements in the parent.
 *
 * @returns {JSX.Element} The rendered ModalBase component.
 *
 * @example
 * ```tsx
 * <ModalBase
 *  modalState={modalState}
 * setModalState={setModalState}
 * onDismiss={() => console.log("Modal dismissed")}
 * >
 *   <View>
 *     <Text>Modal Content</Text>
 *   </View>
 * </ModalBase>
 */
const ModalBase = ({
  modalState,
  setModalState,
  onDismiss,
  children,
}: ModalBaseProps): JSX.Element => {
  /**
   * Handles the dismissal of the modal.
   * If an `onDismiss` callback is provided, it will be called.
   * Then, it sets the modal state to false to close the modal.
   */
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    setModalState(false);
  };

  return (
    <Modal
      isVisible={modalState}
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={100}
      backdropTransitionInTiming={100}
      animationOutTiming={100}
      backdropTransitionOutTiming={100}
      backdropColor="#000000"
      backdropOpacity={0.4}
      onBackdropPress={() => handleDismiss()}
      onBackButtonPress={() => handleDismiss()}
      style={styles.modalBase}
    >
      {children}
    </Modal>
  );
};

export default ModalBase;

const styles = StyleSheet.create({
  modalBase: { alignItems: "center", justifyContent: "center", height: "100%" },
});
