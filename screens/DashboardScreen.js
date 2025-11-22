import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { getCurrentLocation } from '../utils/LocationUtils';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function DashboardScreen() {
    const { records, refreshRecords } = useData();
    const [mapReady, setMapReady] = useState(false);
    const [region, setRegion] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [mapError, setMapError] = useState(false);
    const [mapKey, setMapKey] = useState(0);

    const defaultRegion = {
        latitude: 14.6760,
        longitude: 121.0437,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
    };

    useEffect(() => {
        console.log('🔵 [1] DashboardScreen mounted - starting map setup');
        console.log('🔵 [2] Setting default region:', defaultRegion);
        setRegion(defaultRegion);

        console.log('🔵 [3] Starting location request...');
        getCurrentLocation()
            .then(location => {
                console.log('✅ [4] Location received:', location);
                setCurrentLocation(location);
                const newRegion = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                };
                console.log('🔵 [5] Setting new region with location:', newRegion);
                setRegion(newRegion);
            })
            .catch(error => {
                console.log('❌ [6] Location error:', error);
                console.log('🔵 [7] Using default region due to location error');
                setRegion(defaultRegion);
            });
    }, []);

    const onRefresh = async () => {
        console.log('🔄 Refreshing records...');
        setRefreshing(true);
        await refreshRecords();
        setRefreshing(false);
        console.log('✅ Refresh complete');
    };

    const onMapReady = () => {
        console.log('✅ [8] MAP READY CALLBACK FIRED - Map is fully loaded and ready!');
        setMapReady(true);
        setMapError(false);
    };

    const onMapError = (error) => {
        console.log('❌ [9] MAP ERROR CALLBACK FIRED:', error);
        console.log('❌ Error details:', JSON.stringify(error, null, 2));
        setMapError(true);
        setMapReady(true);
    };

    const onMapLayout = () => {
        console.log('🔵 [10] MAP LAYOUT CALLBACK FIRED - Map container is laid out');
    };

    const retryMap = () => {
        console.log('🔄 [11] Retrying map... Resetting state');
        setMapReady(false);
        setMapError(false);
        setMapKey(prev => prev + 1);
        console.log('🔵 [12] New map key:', mapKey + 1);
    };

    const calculateEJScore = () => {
        console.log('🔵 Calculating EJ Score...');
        if (!currentLocation) {
            console.log('🔵 No current location, using default score 0.14');
            return 0.14;
        }

        const recordsInArea = records.filter(record =>
            record.location &&
            Math.abs(record.location.latitude - currentLocation.latitude) < 0.1 &&
            Math.abs(record.location.longitude - currentLocation.longitude) < 0.1
        ).length;

        const baseScore = 0.14;
        const densityFactor = Math.min(recordsInArea * 0.02, 0.3);
        const finalScore = Math.min(baseScore + densityFactor, 1.0).toFixed(2);

        console.log('🔵 EJ Score calculation complete:', {
            recordsInArea,
            baseScore,
            densityFactor,
            finalScore
        });

        return finalScore;
    };

    const ejScore = calculateEJScore();
    const getEJSeverity = (score) => {
        if (score >= 0.7) return { level: 'CRITICAL', color: '#d32f2f' };
        if (score >= 0.4) return { level: 'HIGH', color: '#f57c00' };
        if (score >= 0.2) return { level: 'MODERATE', color: '#fbc02d' };
        return { level: 'LOW', color: '#388e3c' };
    };

    const ejStatus = getEJSeverity(parseFloat(ejScore));

    const evidenceRecords = records.filter(record => record.type === 'photo' || record.type === 'video');
    const fpicRecords = records.filter(record => record.type === 'fpic_record');
    const syncedRecords = records.filter(record => record.syncStatus === 'COMPLETE');
    const localRecords = records.filter(record => record.syncStatus === 'LOCAL_ONLY' || record.syncStatus === 'PENDING');

    const validEvidenceRecords = evidenceRecords.filter(record =>
        record.location &&
        typeof record.location.latitude === 'number' &&
        typeof record.location.longitude === 'number' &&
        record.location.latitude !== 0 &&
        record.location.longitude !== 0
    );

    const validFpicRecords = fpicRecords.filter(record =>
        record.location &&
        typeof record.location.latitude === 'number' &&
        typeof record.location.longitude === 'number' &&
        record.location.latitude !== 0 &&
        record.location.longitude !== 0
    );

    console.log('🔵 [13] Current Map State:', {
        mapReady,
        mapError,
        mapKey,
        region,
        hasRecords: records.length,
        validEvidenceRecords: validEvidenceRecords.length,
        validFpicRecords: validFpicRecords.length
    });

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>EcoRisk Mapper</Text>
                    <Text style={styles.subtitle}>
                        Environmental Justice Intelligence System
                    </Text>
                </View>

                <View style={[styles.ejisCard, { backgroundColor: ejStatus.color }]}>
                    <Text style={styles.ejisTitle}>CURRENT EJ SCORE</Text>
                    <Text style={styles.ejisValue}>{ejScore}</Text>
                    <Text style={styles.ejisSubtitle}>{ejStatus.level} INJUSTICE LEVEL</Text>
                    <View style={styles.ejisIndicator}>
                        <Ionicons name="warning" size={20} color="white" />
                        <Text style={styles.ejisIndicatorText}>
                            {ejStatus.level === 'CRITICAL' ? 'IMMEDIATE ACTION REQUIRED' :
                                ejStatus.level === 'HIGH' ? 'HEIGHTENED VIGILANCE NEEDED' :
                                    'MONITOR SITUATION'}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="camera" size={24} color="#2E7D32" />
                        <Text style={styles.statNumber}>{evidenceRecords.length}</Text>
                        <Text style={styles.statLabel}>Evidence</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="document-text" size={24} color="#ff9800" />
                        <Text style={styles.statNumber}>{fpicRecords.length}</Text>
                        <Text style={styles.statLabel}>FPIC Records</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="cloud-done" size={24} color="#4caf50" />
                        <Text style={styles.statNumber}>{syncedRecords.length}</Text>
                        <Text style={styles.statLabel}>Secured</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Ionicons name="time" size={24} color="#ff5722" />
                        <Text style={styles.statNumber}>{localRecords.length}</Text>
                        <Text style={styles.statLabel}>Pending Sync</Text>
                    </View>
                </View>

                <View style={styles.mapContainer}>
                    <Text style={styles.sectionTitle}>Evidence & FPIC Locations</Text>
                    <View style={styles.mapWrapper}>
                        {(!mapReady || mapError) && (
                            <View style={styles.mapLoading}>
                                <ActivityIndicator size="large" color="#2E7D32" />
                                <Text style={styles.loadingText}>
                                    {mapError ? 'Map loading failed - Check console' : 'Loading Map...'}
                                </Text>
                                <Text style={styles.debugText}>
                                    State: {mapReady ? 'Ready' : 'Not Ready'} |
                                    Error: {mapError ? 'Yes' : 'No'} |
                                    Key: {mapKey}
                                </Text>
                                {mapError && (
                                    <TouchableOpacity style={styles.retryButton} onPress={retryMap}>
                                        <Text style={styles.retryButtonText}>Retry Map</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <MapView
                            key={mapKey}
                            style={[
                                styles.map,
                                (!mapReady || mapError) && styles.mapHidden
                            ]}
                            provider={PROVIDER_GOOGLE}
                            region={region}
                            initialRegion={defaultRegion}
                            showsUserLocation={true}
                            showsMyLocationButton={true}
                            showsCompass={true}
                            loadingEnabled={true}
                            loadingIndicatorColor="#2E7D32"
                            loadingBackgroundColor="#f5f5f5"
                            onMapReady={onMapReady}
                            onLayout={onMapLayout}
                            onError={onMapError}
                            onPress={() => console.log('🔵 [14] Map pressed')}
                            onPanDrag={() => console.log('🔵 [15] Map dragged')}
                            onRegionChange={(region) => console.log('🔵 [16] Region changed:', region)}
                            onRegionChangeComplete={(region) => console.log('🔵 [17] Region change complete:', region)}
                        >
                            {console.log('🔵 [18] Rendering markers:', {
                                evidence: validEvidenceRecords.length,
                                fpic: validFpicRecords.length
                            })}

                            {validEvidenceRecords.map((record, index) => {
                                console.log('🔵 [19] Rendering evidence marker:', index, record.location);
                                return (
                                    <Marker
                                        key={`evidence-${record.id}-${index}`}
                                        coordinate={{
                                            latitude: record.location.latitude,
                                            longitude: record.location.longitude
                                        }}
                                        title={`Evidence ${index + 1}`}
                                        description={`Type: ${record.type}`}
                                        pinColor="#2E7D32"
                                        onPress={() => console.log('🔵 [20] Evidence marker pressed:', record.id)}
                                    />
                                );
                            })}

                            {validFpicRecords.map((record, index) => {
                                console.log('🔵 [21] Rendering FPIC marker:', index, record.location);
                                return (
                                    <Marker
                                        key={`fpic-${record.id}-${index}`}
                                        coordinate={{
                                            latitude: record.location.latitude,
                                            longitude: record.location.longitude
                                        }}
                                        title={`FPIC: ${record.projectName || 'FPIC Record'}`}
                                        description={`Consensus: ${record.communityConsensus || 'Unknown'}`}
                                        pinColor="#ff9800"
                                        onPress={() => console.log('🔵 [22] FPIC marker pressed:', record.id)}
                                    />
                                );
                            })}
                        </MapView>
                    </View>

                    <View style={styles.locationStatus}>
                        <Ionicons name="location" size={16} color="#666" />
                        <Text style={styles.locationStatusText}>
                            {currentLocation
                                ? `Current Area: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                                : 'Acquiring location...'
                            }
                        </Text>
                        <Text style={styles.recordsCount}>
                            {validEvidenceRecords.length + validFpicRecords.length} locations mapped
                        </Text>
                    </View>
                </View>

                <View style={styles.activityContainer}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    {records.slice(0, 5).map((record) => (
                        <View key={record.id} style={styles.activityItem}>
                            <Ionicons
                                name={record.type === 'fpic_record' ? 'document-text' :
                                    record.type === 'photo' ? 'image' : 'videocam'}
                                size={16}
                                color="#666"
                            />
                            <View style={styles.activityDetails}>
                                <Text style={styles.activityText}>
                                    {record.type === 'fpic_record'
                                        ? `FPIC: ${record.projectName || 'FPIC Record'} - ${record.communityConsensus || 'Unknown'}`
                                        : `${record.type.toUpperCase()} evidence captured`
                                    }
                                </Text>
                                <Text style={styles.activityTime}>
                                    {new Date(record.timestamp).toLocaleDateString()} •
                                    Status: {record.syncStatus === 'COMPLETE' ? 'Secured' : 'Local'}
                                </Text>
                            </View>
                            <Ionicons
                                name={record.syncStatus === 'COMPLETE' ? "checkmark-circle" : "time"}
                                size={16}
                                color={record.syncStatus === 'COMPLETE' ? "#4caf50" : "#ff9800"}
                            />
                        </View>
                    ))}

                    {records.length === 0 && (
                        <View style={styles.emptyActivity}>
                            <Ionicons name="document" size={32} color="#ccc" />
                            <Text style={styles.emptyActivityText}>No records yet</Text>
                            <Text style={styles.emptyActivitySubtext}>
                                Capture evidence or create FPIC records to see them here
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: 'white',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    ejisCard: {
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    ejisTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    ejisValue: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    ejisSubtitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    ejisIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    ejisIndicatorText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        justifyContent: 'space-between',
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        marginHorizontal: 4,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        minHeight: 80,
        justifyContent: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 6,
    },
    statLabel: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
    },
    mapContainer: {
        margin: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        padding: 16,
        paddingBottom: 8,
    },
    mapWrapper: {
        height: 300,
        position: 'relative',
        minHeight: 300,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapHidden: {
        opacity: 0,
    },
    mapLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    debugText: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    retryButton: {
        marginTop: 12,
        backgroundColor: '#2E7D32',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    locationStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        backgroundColor: '#f8f9fa',
        justifyContent: 'space-between',
    },
    locationStatusText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    recordsCount: {
        fontSize: 12,
        color: '#2E7D32',
        fontWeight: '600',
    },
    activityContainer: {
        margin: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 20,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityDetails: {
        flex: 1,
        marginLeft: 12,
    },
    activityText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: '#666',
    },
    emptyActivity: {
        alignItems: 'center',
        padding: 40,
    },
    emptyActivityText: {
        fontSize: 14,
        color: '#999',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyActivitySubtext: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 4,
        textAlign: 'center',
    },
});