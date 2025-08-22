import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

export default function BottomSheetCatalog() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    bottomSheetRef.current?.present();
  }, []);

  const handleStart = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['50%']}
      backgroundStyle={{ borderRadius: 26 }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.5}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetView className="flex-1 px-6 pt-6 pb-6">
        <Text>este es el contenido del modal</Text>
      </BottomSheetView>
    </BottomSheetModal>
  );
}