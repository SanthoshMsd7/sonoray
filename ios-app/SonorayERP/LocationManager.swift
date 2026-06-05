import Foundation
import CoreLocation
import UIKit

class LocationManager: NSObject, CLLocationManagerDelegate {
    static let shared = LocationManager()
    
    private let locationManager = CLLocationManager()
    private var isTracking = false
    
    private override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 5 // 5 meters (same as Android)
        
        // Configure background updates
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        
        if #available(iOS 14.0, *) {
            // Request accuracy validation automatically
        }
    }
    
    func startTracking() {
        isTracking = true
        locationManager.requestAlwaysAuthorization()
        locationManager.startUpdatingLocation()
        // Register for significant location changes as backup for app kills
        locationManager.startMonitoringSignificantLocationChanges()
    }
    
    func stopTracking() {
        isTracking = false
        locationManager.stopUpdatingLocation()
        locationManager.stopMonitoringSignificantLocationChanges()
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status: CLAuthorizationStatus
        if #available(iOS 14.0, *) {
            status = manager.authorizationStatus
        } else {
            status = CLLocationManager.authorizationStatus()
        }
        
        if status == .authorizedAlways || status == .authorizedWhenInUse {
            if isTracking {
                locationManager.startUpdatingLocation()
            }
        } else {
            print("Location access denied/restricted: \(status)")
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        let lat = location.coordinate.latitude
        let lng = location.coordinate.longitude
        
        print("iOS GPS Update: \(lat), \(lng)")
        
        // Stream coordinate update to server
        sendLocationToServer(latitude: lat, longitude: lng)
    }
    
    private func sendLocationToServer(latitude: Double, longitude: Double) {
        guard let employeeId = UserDefaults.standard.string(forKey: "employeeId"),
              let token = UserDefaults.standard.string(forKey: "token"),
              var apiUrl = UserDefaults.standard.string(forKey: "apiUrl") else {
            print("iOS GPS Send: Missing credentials/config")
            return
        }
        
        if apiUrl.hasSuffix("/") {
            apiUrl = String(apiUrl.dropLast())
        }
        
        guard let url = URL(string: "\(apiUrl)/api/tracking/update") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        // Get battery level
        UIDevice.current.isBatteryMonitoringEnabled = true
        let batteryLevel = Int(UIDevice.current.batteryLevel * 100)
        let battery = batteryLevel < 0 ? 100 : batteryLevel
        
        // ISO8601 UTC timestamp formatter
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let timestamp = formatter.string(from: Date())
        
        let payload: [String: Any] = [
            "employeeId": employeeId,
            "latitude": latitude,
            "longitude": longitude,
            "batteryLevel": battery,
            "timestamp": timestamp
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
        } catch {
            print("iOS GPS Send Error: failed serializing JSON")
            return
        }
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("iOS GPS Send Error: \(error.localizedDescription)")
                return
            }
            if let httpResponse = response as? HTTPURLResponse {
                print("iOS GPS Server responded with: \(httpResponse.statusCode)")
            }
        }
        task.resume()
    }
}
