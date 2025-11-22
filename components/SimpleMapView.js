import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SimpleMapView = ({ records, currentLocation, onRetry }) => {
    const evidenceRecords = records.filter(record => record.type === 'photo' || record.type === 'video');
    const fpicRecords = records.filter(record => record.type === 'fpic_record');

    const validRecords = [...evidenceRecords, ...fpicRecords].filter(record =>
        record.location &&
        typeof record.location.latitude === 'number' &&
        typeof record.location.longitude === 'number'
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="map" size={24} color="#2E7D32" />
                <Text style={styles.title}>Location Overview</Text>
                <TouchableOpacity onPress={onRetry}>
                    <Ionicons name="refresh" size={20} color="#2E7D32" />
                </TouchableOpacity>
            </View>

            <View style={styles.stats}>
                <Text style={styles.stat}>
                    📍 {validRecords.length} Location Markers
                </Text>
                <Text style={styles.stat}>
                    📸 {evidenceRecords.length} Evidence Records
                </Text>
                <Text style={styles.stat}>
                    📄 {fpicRecords.length} FPIC Records
                </Text>
            </View>

            {currentLocation && (
                <View style={styles.currentLocation}>
                    <Text style={styles.locationText}>
                        Your Location: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                    </Text>
                </View>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Try Google Maps Again</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e8f5e8',
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#2E7D32',
        borderStyle: 'dashed',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
        flex: 1,
        marginLeft: 8,
    },
    stats: {
        marginBottom: 16,
    },
    stat: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 6,
    },
    currentLocation: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 6,
        marginBottom: 16,
    },
    locationText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#2E7D32',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default SimpleMapView;