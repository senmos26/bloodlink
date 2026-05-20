import { View, Text, Pressable, Linking, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import {
  getMapCenters,
  getUrgencyColor,
  type MapCenter,
  type UrgencyLevel,
} from "@/services/map";

const DEFAULT_REGION: Region = {
  latitude: 34.035,
  longitude: -6.797,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

// Minimal Leaflet document loaded in the WebView (free, no billing)
const LEAFLET_HTML = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      #map { position: absolute; inset: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  </body>
</html>`;

type UserLocation = {
  latitude: number;
  longitude: number;
};

type MapFilter = "all" | "alert" | "critical";

const FILTER_OPTIONS: Array<{ key: MapFilter; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "alert", label: "En alerte" },
  { key: "critical", label: "Critiques" },
];

function formatDistanceKm(distanceKm: number | null) {
  if (distanceKm === null) {
    return "-";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm)} km`;
}

function formatDeadline(deadline: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(deadline));
}

function formatUrgencyLabel(urgency: UrgencyLevel | null) {
  switch (urgency) {
    case "critical":
      return "Critique";
    case "high":
      return "Élevée";
    case "medium":
      return "Modérée";
    case "low":
      return "Faible";
    default:
      return "Standard";
  }
}

function getDistanceKm(userLocation: UserLocation, center: MapCenter) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDistance = toRadians(center.latitude - userLocation.latitude);
  const lonDistance = toRadians(center.longitude - userLocation.longitude);
  const userLatitude = toRadians(userLocation.latitude);
  const centerLatitude = toRadians(center.latitude);
  const haversine =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2) * Math.cos(userLatitude) * Math.cos(centerLatitude);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

function buildFocusRegion(latitude: number, longitude: number, isCloseZoom = false): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: isCloseZoom ? 0.08 : 0.45,
    longitudeDelta: isCloseZoom ? 0.08 : 0.45,
  };
}

function buildDirectionsUrl(center: MapCenter) {
  const destination = `${center.latitude},${center.longitude}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const hasAutoFocusedRef = useRef(false);
  // Disable native Google Maps on Android to avoid API key requirements. Fallback to a free list UI.
  const MAPS_ENABLED = Platform.OS !== "android";
  const [centers, setCenters] = useState<MapCenter[]>([]);
  const [mapFilter, setMapFilter] = useState<MapFilter>("all");
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const snapPoints = useMemo(() => ["34%", "56%"], []);

  const centersWithDistance = useMemo(() => {
    return centers
      .map((center) => ({
        ...center,
        distanceKm: userLocation ? getDistanceKm(userLocation, center) : null,
      }))
      .sort((left, right) => {
        if (left.distanceKm === null && right.distanceKm === null) {
          return left.name.localeCompare(right.name);
        }

        if (left.distanceKm === null) {
          return 1;
        }

        if (right.distanceKm === null) {
          return -1;
        }

        return left.distanceKm - right.distanceKm;
      });
  }, [centers, userLocation]);

  const selectedCenter = useMemo(() => {
    return centersWithDistance.find((center) => center.id === selectedCenterId) ?? null;
  }, [centersWithDistance, selectedCenterId]);

  const alertingCentersCount = useMemo(() => {
    return centersWithDistance.filter((center) => center.activeAlertCount > 0).length;
  }, [centersWithDistance]);

  const visibleCenters = useMemo(() => {
    switch (mapFilter) {
      case "alert":
        return centersWithDistance.filter((center) => center.activeAlertCount > 0);
      case "critical":
        return centersWithDistance.filter((center) => center.topUrgency === "critical");
      default:
        return centersWithDistance;
    }
  }, [centersWithDistance, mapFilter]);

  // Lightweight dataset for the WebView map (computed after visibleCenters is available)
  const simpleCenters = useMemo(
    () =>
      visibleCenters.map((c) => ({
        id: c.id,
        latitude: c.latitude,
        longitude: c.longitude,
        name: c.name,
        city: c.city,
      })),
    [visibleCenters]
  );

  const leafletInjectedJs = useMemo(() => {
    const payload = {
      centers: simpleCenters,
      userLocation,
      defaultRegion: DEFAULT_REGION,
    };
    return `
      (function(){
        var data = ${JSON.stringify(payload)};
        var map = L.map('map', { zoomControl: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        var bounds = [];
        // Mark user location if available
        if (data.userLocation && isFinite(data.userLocation.latitude) && isFinite(data.userLocation.longitude)) {
          L.marker([data.userLocation.latitude, data.userLocation.longitude]).addTo(map).bindPopup('Vous êtes ici');
        }
        // Filter invalid center coords (exclude 0,0 and non-finite)
        var validCenters = (data.centers || []).filter(function(c){
          if (!isFinite(c.latitude) || !isFinite(c.longitude)) return false;
          if (Math.abs(c.latitude) < 1e-6 && Math.abs(c.longitude) < 1e-6) return false;
          return true;
        });
        validCenters.forEach(function(c){
          var m = L.marker([c.latitude, c.longitude]).addTo(map).bindPopup('<b>' + c.name + '</b><br/>' + c.city);
          m.on('click', function(){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: c.id })); });
          bounds.push([c.latitude, c.longitude]);
        });
        // Choose initial view: prefer user location when available
        if (data.userLocation && isFinite(data.userLocation.latitude) && isFinite(data.userLocation.longitude)) {
          map.setView([data.userLocation.latitude, data.userLocation.longitude], 13);
        } else if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [24,24], maxZoom: 14 });
        } else if (bounds.length === 1) {
          map.setView(bounds[0], 13);
        } else {
          map.setView([data.defaultRegion.latitude, data.defaultRegion.longitude], 12);
        }
        // Ensure correct sizing after render
        setTimeout(function(){ try { map.invalidateSize(); } catch(e){} }, 60);
        true;
      })();
    `;
  }, [simpleCenters, userLocation]);

  const leafletKey = useMemo(() => {
    const u = userLocation ? `${userLocation.latitude.toFixed(3)}-${userLocation.longitude.toFixed(3)}` : "nouser";
    return `leaflet-${simpleCenters.length}-${u}`;
  }, [simpleCenters.length, userLocation]);

  const visibleAlertingCentersCount = useMemo(() => {
    return visibleCenters.filter((center) => center.activeAlertCount > 0).length;
  }, [visibleCenters]);

  const selectedCenterVisible = useMemo(() => {
    return selectedCenter ? visibleCenters.some((center) => center.id === selectedCenter.id) : false;
  }, [selectedCenter, visibleCenters]);

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.24} />;
  }, []);

  const focusMap = useCallback((latitude: number, longitude: number, isCloseZoom = false) => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    mapRef.current.animateToRegion(buildFocusRegion(latitude, longitude, isCloseZoom), 350);
  }, [mapReady]);

  const loadCenters = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextCenters = await getMapCenters();
      setCenters(nextCenters);
      setErrorMessage(null);
      setSelectedCenterId((current) =>
        current && nextCenters.some((center) => center.id === current) ? current : null
      );
    } catch (error) {
      const fallbackMessage = "Impossible de charger les centres pour le moment.";
      setErrorMessage(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      const knownPosition = await Location.getLastKnownPositionAsync();
      const currentPosition =
        knownPosition ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));

      if (currentPosition) {
        setUserLocation({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });
      }
    } catch {
      setPermissionStatus(Location.PermissionStatus.DENIED);
    }
  }, []);

  useEffect(() => {
    loadCenters();
    requestLocation();
  }, [loadCenters, requestLocation]);

  useEffect(() => {
    if (!selectedCenter) {
      bottomSheetRef.current?.close();
      return;
    }

    bottomSheetRef.current?.snapToIndex(0);
  }, [selectedCenter]);

  useEffect(() => {
    if (selectedCenter && !selectedCenterVisible) {
      setSelectedCenterId(null);
    }
  }, [selectedCenter, selectedCenterVisible]);

  useEffect(() => {
    if (!mapReady || hasAutoFocusedRef.current) {
      return;
    }

    if (userLocation) {
      hasAutoFocusedRef.current = true;
      focusMap(userLocation.latitude, userLocation.longitude, true);
      return;
    }

    if (visibleCenters.length > 0) {
      hasAutoFocusedRef.current = true;
      focusMap(visibleCenters[0].latitude, visibleCenters[0].longitude);
    }
  }, [focusMap, mapReady, userLocation, visibleCenters]);

  const handleCenterUserLocation = useCallback(() => {
    if (!userLocation) {
      return;
    }

    focusMap(userLocation.latitude, userLocation.longitude, true);
  }, [focusMap, userLocation]);

  const handleFocusSelectedCenter = useCallback(() => {
    if (!selectedCenter) {
      return;
    }

    focusMap(selectedCenter.latitude, selectedCenter.longitude, true);
  }, [focusMap, selectedCenter]);

  const handleCallSelectedCenter = useCallback(async () => {
    if (!selectedCenter?.phone) {
      return;
    }

    const phoneUrl = `tel:${selectedCenter.phone.replace(/\s+/g, "")}`;
    const supported = await Linking.canOpenURL(phoneUrl);

    if (supported) {
      await Linking.openURL(phoneUrl);
    }
  }, [selectedCenter]);

  const handleOpenDirections = useCallback(async () => {
    if (!selectedCenter) {
      return;
    }

    const directionsUrl = buildDirectionsUrl(selectedCenter);
    const supported = await Linking.canOpenURL(directionsUrl);

    if (supported) {
      await Linking.openURL(directionsUrl);
    }
  }, [selectedCenter]);

  const topUrgencyColor = getUrgencyColor(selectedCenter?.topUrgency ?? null);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <View className="flex-1 bg-surface">
        {MAPS_ENABLED ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={DEFAULT_REGION}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            showsCompass
            showsMyLocationButton={false}
            showsUserLocation={permissionStatus === Location.PermissionStatus.GRANTED}
            toolbarEnabled={false}
            onMapReady={() => setMapReady(true)}
            onPress={() => setSelectedCenterId(null)}
          >
            {visibleCenters.map((center) => {
              const isSelected = center.id === selectedCenterId;
              const markerColor = getUrgencyColor(center.topUrgency);

              return (
                <Marker
                  key={center.id}
                  coordinate={{ latitude: center.latitude, longitude: center.longitude }}
                  title={center.name}
                  description={center.city}
                  onPress={() => setSelectedCenterId(center.id)}
                  pinColor={markerColor}
                  opacity={isSelected ? 1 : 0.9}
                />
              );
            })}
          </MapView>
        ) : (
          <View style={{ flex: 1 }}>
            <WebView
              key={leafletKey}
              originWhitelist={["*"]}
              source={{ html: LEAFLET_HTML }}
              injectedJavaScript={leafletInjectedJs}
              javaScriptEnabled
              domStorageEnabled
              onMessage={(event: WebViewMessageEvent) => {
                try {
                  const msg = JSON.parse(event.nativeEvent.data);
                  if (msg && msg.type === "select" && typeof msg.id === "string") {
                    setSelectedCenterId(msg.id);
                  }
                } catch {}
              }}
            />
          </View>
        )}

        <View className="absolute left-4 right-4" style={{ top: insets.top + 8 }}>
          <View className="rounded-3xl bg-white px-4 py-4 border border-black/5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-2xl font-extrabold text-on-surface">Carte des centres</Text>
                <Text className="mt-1 text-sm text-on-surface-variant">
                  Touchez un marqueur pour afficher les détails d'un centre de don.
                </Text>
              </View>
              <Pressable
                onPress={() => loadCenters(true)}
                disabled={refreshing}
                className="w-11 h-11 rounded-2xl items-center justify-center bg-surface-container-low"
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#006591" />
                ) : (
                  <MaterialIcons name="refresh" size={22} color="#006591" />
                )}
              </Pressable>
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 rounded-2xl bg-primary/10 px-3 py-3">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-primary">Centres visibles</Text>
                <Text className="mt-1 text-xl font-extrabold text-on-surface">{visibleCenters.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-secondary/10 px-3 py-3">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-secondary">Alertes visibles</Text>
                <Text className="mt-1 text-xl font-extrabold text-on-surface">{visibleAlertingCentersCount}</Text>
              </View>
            </View>

            <View className="mt-4 flex-row gap-2">
              {FILTER_OPTIONS.map((option) => {
                const isActive = option.key === mapFilter;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setMapFilter(option.key)}
                    className="flex-1 rounded-2xl px-3 py-3 items-center justify-center"
                    style={{ backgroundColor: isActive ? "#101828" : "#f4f4f5" }}
                  >
                    <Text
                      className="text-xs font-extrabold uppercase tracking-wider"
                      style={{ color: isActive ? "#ffffff" : "#5c3f40" }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {permissionStatus !== null && permissionStatus !== Location.PermissionStatus.GRANTED ? (
              <View className="mt-3 rounded-2xl bg-surface-container-low px-3 py-3 flex-row items-center gap-2">
                <MaterialIcons name="my-location" size={18} color="#906f70" />
                <Text className="flex-1 text-xs text-on-surface-variant">
                  Active la localisation pour trier les centres autour de toi.
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {errorMessage ? (
          <View className="absolute left-4 right-4" style={{ top: insets.top + 160 }}>
            <View className="rounded-2xl bg-white px-4 py-4 border border-primary/20">
              <Text className="text-sm font-bold text-primary">Chargement interrompu</Text>
              <Text className="mt-1 text-sm text-on-surface-variant">{errorMessage}</Text>
              <Pressable
                onPress={() => loadCenters(true)}
                className="mt-3 self-start rounded-xl bg-primary px-4 py-2"
              >
                <Text className="text-sm font-bold text-white">Réessayer</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {loading ? (
          <View className="absolute inset-0 items-center justify-center">
            <View className="rounded-3xl bg-white px-6 py-5 border border-black/5 items-center">
              <ActivityIndicator size="large" color="#b80035" />
              <Text className="mt-3 text-sm font-semibold text-on-surface">
                Chargement des centres…
              </Text>
            </View>
          </View>
        ) : null}

        {!loading && visibleCenters.length === 0 && !errorMessage ? (
          <View className="absolute inset-x-4 items-center" style={{ top: insets.top + 176 }}>
            <View className="w-full rounded-3xl bg-white px-5 py-5 border border-black/5 items-center">
              <View className="w-14 h-14 rounded-2xl bg-secondary/10 items-center justify-center mb-3">
                <MaterialIcons name="location-off" size={26} color="#006591" />
              </View>
              <Text className="text-base font-extrabold text-on-surface">Aucun centre pour ce filtre</Text>
              <Text className="mt-1 text-sm text-center text-on-surface-variant">
                Change le filtre ou recharge les données pour voir d'autres centres à proximité.
              </Text>
            </View>
          </View>
        ) : null}

        {MAPS_ENABLED ? (
          <View className="absolute right-4" style={{ bottom: insets.bottom + 24 }}>
            <Pressable
              onPress={handleCenterUserLocation}
              disabled={!userLocation}
              className="w-14 h-14 rounded-2xl items-center justify-center bg-white border border-black/5"
              style={{ opacity: userLocation ? 1 : 0.55 }}
            >
              <MaterialIcons name="my-location" size={24} color="#006591" />
            </Pressable>
          </View>
        ) : null}

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          onClose={() => setSelectedCenterId(null)}
          backgroundStyle={{ backgroundColor: "#ffffff" }}
          handleIndicatorStyle={{ backgroundColor: "#d6d6d6" }}
        >
          <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 18 }}>
            {selectedCenter ? (
              <View>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View
                      className="self-start rounded-full px-3 py-1 mb-3"
                      style={{ backgroundColor: `${topUrgencyColor}18` }}
                    >
                      <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: topUrgencyColor }}>
                        {formatUrgencyLabel(selectedCenter.topUrgency)}
                      </Text>
                    </View>
                    <Text className="text-2xl font-extrabold text-on-surface">{selectedCenter.name}</Text>
                    <Text className="mt-1 text-sm text-on-surface-variant">
                      {selectedCenter.address}, {selectedCenter.city}
                    </Text>
                  </View>
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: `${topUrgencyColor}16` }}
                  >
                    <MaterialIcons name="local-hospital" size={26} color={topUrgencyColor} />
                  </View>
                </View>

                <View className="mt-5 flex-row gap-3">
                  <View className="flex-1 rounded-2xl bg-surface-container-low px-4 py-4">
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Distance
                    </Text>
                    <Text className="mt-1 text-xl font-extrabold text-on-surface">
                      {formatDistanceKm(selectedCenter.distanceKm)}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-surface-container-low px-4 py-4">
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Alertes
                    </Text>
                    <Text className="mt-1 text-xl font-extrabold text-on-surface">
                      {selectedCenter.activeAlertCount}
                    </Text>
                  </View>
                </View>

                <View className="mt-5 gap-2">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="call" size={18} color="#006591" />
                    <Text className="text-sm font-medium text-on-surface">{selectedCenter.phone}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="bloodtype" size={18} color="#b80035" />
                    <Text className="text-sm text-on-surface-variant">
                      {selectedCenter.urgentBloodTypes.length > 0
                        ? selectedCenter.urgentBloodTypes.join(", ")
                        : "Aucune pénurie active signalée"}
                    </Text>
                  </View>
                </View>

                <View className="mt-5">
                  <Text className="text-sm font-bold text-on-surface mb-3">Alertes actives</Text>
                  {selectedCenter.alerts.length > 0 ? (
                    <View className="gap-3">
                      {selectedCenter.alerts.slice(0, 3).map((alert) => {
                        const urgencyColor = getUrgencyColor(alert.urgencyLevel);

                        return (
                          <View
                            key={alert.id}
                            className="rounded-2xl border border-black/5 px-4 py-4 bg-surface-container-lowest"
                          >
                            <View className="flex-row items-center justify-between gap-3">
                              <View
                                className="rounded-full px-3 py-1"
                                style={{ backgroundColor: `${urgencyColor}18` }}
                              >
                                <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: urgencyColor }}>
                                  {alert.bloodTypeRequired}
                                </Text>
                              </View>
                              <Text className="text-xs font-semibold" style={{ color: urgencyColor }}>
                                {formatUrgencyLabel(alert.urgencyLevel)}
                              </Text>
                            </View>
                            <Text className="mt-3 text-sm text-on-surface-variant">
                              {alert.message ?? "Aucune précision supplémentaire fournie par le centre."}
                            </Text>
                            <Text className="mt-2 text-xs font-medium text-on-surface-variant">
                              Jusqu'au {formatDeadline(alert.deadline)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View className="rounded-2xl bg-surface-container-low px-4 py-4">
                      <Text className="text-sm text-on-surface-variant">
                        Ce centre n'a pas d'alerte active pour le moment.
                      </Text>
                    </View>
                  )}
                </View>

                <View className="mt-6 flex-row gap-3">
                  <Pressable
                    onPress={handleCallSelectedCenter}
                    disabled={!selectedCenter.phone}
                    className="flex-1 rounded-2xl bg-primary px-4 py-4 items-center justify-center"
                    style={{ opacity: selectedCenter.phone ? 1 : 0.55 }}
                  >
                    <Text className="text-sm font-bold text-white">Appeler</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleFocusSelectedCenter}
                    className="flex-1 rounded-2xl bg-secondary/10 px-4 py-4 items-center justify-center"
                  >
                    <Text className="text-sm font-bold text-secondary">Recentrer</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={handleOpenDirections}
                  className="mt-3 rounded-2xl bg-[#101828] px-4 py-4 items-center justify-center"
                >
                  <Text className="text-sm font-bold text-white">Ouvrir l'itinéraire</Text>
                </Pressable>
              </View>
            ) : (
              <View className="items-center px-4 py-8">
                <Text className="text-base font-bold text-on-surface">Sélectionne un centre</Text>
                <Text className="mt-1 text-sm text-center text-on-surface-variant">
                  Appuie sur un marqueur pour afficher ses détails et les alertes actives.
                </Text>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}
