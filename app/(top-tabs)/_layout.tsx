import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text } from 'react-native';

const Tab = createMaterialTopTabNavigator();

function UnoScreen (){
  return ( 
    <View>
      <Text>este es el top tap 1</Text>
    </View>
  );
}

function DosScreen (){
  return ( 
    <View>
      <Text>este es el top tap 2</Text>
    </View>
  );
}

export default function MyTopTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Uno" component={UnoScreen} />
      <Tab.Screen name="Dos" component={DosScreen} />
    </Tab.Navigator>
  );
}