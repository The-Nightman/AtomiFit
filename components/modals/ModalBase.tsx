import { ModalAnimationProps } from "@/types/modal";
import { ColorValue, StyleSheet } from "react-native";
import Modal from "react-native-modal";

interface BackdropStyle {
  color: ColorValue;
  opacity: number;
}

interface ModalBaseProps {
  modalState: boolean;
  setModalState: React.Dispatch<React.SetStateAction<boolean>>;
  onDismiss?: () => unknown;
  animationProps?: ModalAnimationProps;
  backdropStyle?: BackdropStyle;
  children: React.ReactNode;
}

/**
 * ModalBase component that provides a base structure for modals.
 * 
 * @remarks
 * On iOS devices the modal backdrop must be set with an opacity of 0.011 or higher for onBackdropPress to work.
 * However, an alternative is setting the backdropOpacity to 1 and setting backdropColor to a HexCode color value
 * with alpha values as this works even with a backdropColor of "#ffffff00" (white-transparent), for hex alpha values
 * refer to https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4#all-hex-value-from-100-to-0-alpha or https://www.hexcolortool.com/
 * and set the backdropOpacity to 1. This was tested on iOS 17.4.1 on an iPhone 11.
 *
 * @component
 * @param {Object} props - The properties object.
 * @param {boolean} props.modalState - The state of the modal, indicating whether it is visible or not.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setModalState - Function to set the state of the modal.
 * @param {function(): unknown} props.onDismiss - Optional callback function to be called when the modal is dismissed.
 * @param {ModalAnimationProps} props.animationProps - Optional object containing animation properties for the modal.
 * @param {BackdropStyle} props.backdropStyle - Optional object containing style properties for the modal backdrop.
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
  animationProps,
  backdropStyle,
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
      animationIn={animationProps?.animationIn ?? "zoomIn"}
      animationOut={animationProps?.animationOut ?? "zoomOut"}
      animationInTiming={animationProps?.animationInTiming ?? 100}
      animationOutTiming={animationProps?.animationOutTiming ?? 100}
      backdropTransitionInTiming={
        animationProps?.backdropTransitionInTiming ?? 100
      }
      backdropTransitionOutTiming={
        animationProps?.backdropTransitionOutTiming ?? 100
      }
      // Package modal API uses string type, we can cast as ColorValue in props to enforce a valid color but cast as string here.
      //! See docs above for useage on iOS devices
      backdropColor={(backdropStyle?.color as string) ?? "#000000"}
      backdropOpacity={backdropStyle?.opacity ?? 0.4}
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
