import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const kpiData = [
  { label: 'Faturamento', value: 'R$ 12.500', icon: 'cash' },
  { label: 'Reservas (mês)', value: '87', icon: 'calendar-check' },
];

const barData = {
  labels: ['Quadra 1', 'Quadra 2', 'Quadra 3', 'Quadra 4'],
  datasets: [
    {
      data: [20, 45, 28, 35],
    },
  ],
};

const pieData = [
  { name: 'Quadra 1', value: 5000, color: '#FF7014', legendFontColor: '#333', legendFontSize: 14 },
  { name: 'Quadra 2', value: 3500, color: '#FDBA74', legendFontColor: '#333', legendFontSize: 14 },
  { name: 'Quadra 3', value: 2500, color: '#FDE68A', legendFontColor: '#333', legendFontSize: 14 },
  { name: 'Quadra 4', value: 1500, color: '#A7F3D0', legendFontColor: '#333', legendFontSize: 14 },
];

export default function DashboardGestorScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>Dashboard de Métricas</Text>
      <View style={styles.kpiRow}>
        {kpiData.map((kpi, idx) => (
          <View key={kpi.label} style={styles.kpiCard}>
            <MaterialCommunityIcons name={kpi.icon} size={28} color="#FF7014" style={{ marginBottom: 6 }} />
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reservas por Quadra</Text>
        <BarChart
          data={barData}
          width={screenWidth - 48}
          height={220}
          yAxisLabel=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          style={{ borderRadius: 16 }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Faturamento por Quadra</Text>
        <PieChart
          data={pieData}
          width={screenWidth - 48}
          height={180}
          chartConfig={chartConfig}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft={10}
          absolute
        />
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(255, 112, 20, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  barPercentage: 0.6,
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    marginTop: 8,
    alignSelf: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 6,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF7014',
  },
  kpiLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
}); 