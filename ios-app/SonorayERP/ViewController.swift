import UIKit
import WebKit

class ViewController: UIViewController, WKScriptMessageHandler {
    var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        let contentController = WKUserContentController()
        contentController.add(self, name: "iOSTracker")
        
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true
        
        webView = WKWebView(frame: self.view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        self.view.addSubview(webView)
        
        // Configure cookies & storage
        if #available(iOS 11.0, *) {
            webView.configuration.websiteDataStore = .default()
        }
        
        // Load the web app URL
        if let url = URL(string: "https://sonoray.vercel.app/") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    // WKScriptMessageHandler protocol requirement
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "iOSTracker",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            return
        }
        
        if action == "start" {
            let employeeId = body["employeeId"] as? String
            let token = body["token"] as? String
            let apiUrl = body["apiUrl"] as? String
            
            UserDefaults.standard.set(employeeId, forKey: "employeeId")
            UserDefaults.standard.set(token, forKey: "token")
            UserDefaults.standard.set(apiUrl, forKey: "apiUrl")
            UserDefaults.standard.synchronize()
            
            LocationManager.shared.startTracking()
            print("iOS Geolocation Bridge: Started tracking")
        } else if action == "stop" {
            UserDefaults.standard.removeObject(forKey: "employeeId")
            UserDefaults.standard.removeObject(forKey: "token")
            UserDefaults.standard.removeObject(forKey: "apiUrl")
            UserDefaults.standard.synchronize()
            
            LocationManager.shared.stopTracking()
            print("iOS Geolocation Bridge: Stopped tracking")
        }
    }
}
