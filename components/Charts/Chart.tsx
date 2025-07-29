import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const BeautifulLineChart: React.FC = () => {
  const data = [
    { value: 100, label: '01 Apr', date: '01 Apr 2022' },
    { value: 120, label: '05 Apr', date: '05 Apr 2022' },
    { value: 280, label: '15 Apr', date: '15 Apr 2022' },
    { value: 200, label: '20 Apr', date: '20 Apr 2022' },
    { value: 350, label: '25 Apr', date: '25 Apr 2022' },
    { value: 230, label: '30 Apr', date: '30 Apr 2022' },
    { value: 100, label: '30 Apr', date: '01 May 2022' },
  ];

  return (
    <View style={{ padding: 20, backgroundColor: '#fff', flex: 1 }}>
      <LineChart
        data={data}
        areaChart
        curved
        hideDataPoints={false}
        color="#00FFAA"
        thickness={2}
        startFillColor="#00FFAA"
        endFillColor="#fff"
        startOpacity={0.4}
        endOpacity={0.1}
        hideRules={false}
        rulesType="dashed"
        rulesColor="#999"
        yAxisColor="#999"
        xAxisColor="#999"
        yAxisTextStyle={{ color: '#aaa' }}
        xAxisLabelTextStyle={{ color: '#aaa' }}
        pointerConfig={{
          pointerColor: '#00FFAA',
          pointerStripUptoDataPoint: true,
          pointerStripColor: '#666',
          pointerLabelComponent: (items) => {
            const item = items[0];
            return (
              <View
                style={{
                  backgroundColor: '#000',
                  padding: 6,
                  borderRadius: 6,
                  alignItems: 'center',
                }}>
                <Text style={{ color: '#fff' }}>{item?.value}</Text>
              </View>
            );
          },
          pointerVLineColor: '#ccc',
          pointerLabelWidth: 100,
          pointerLabelHeight: 40,
          pointerLabelTextStyle: { color: '#000' },
          activatePointersOnLongPress: true,
          pointerComponent: () => (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#00FFAA',
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          ),
        }}
        isAnimated
        animationDuration={1000}
      />
    </View>
  );
};

export default BeautifulLineChart;
