package com.sonoray.erp;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.content.Context;
import android.os.Build;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private String cameraPhotoPath;

    private static final int REQUEST_PERMISSIONS = 100;
    private static final int INPUT_FILE_REQUEST_CODE = 101;
    
    // =========================================================================
    // ⚙️ CONFIGURED WEBSITE URL
    // Loaded dynamically on app launch
    // =========================================================================
    private static final String APP_URL = "https://sonoray.vercel.app/"; // Replace with your Ubuntu Server IP or domain

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);

        // Bind our persistent, foreground tracking native service Javascript bridge
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidTracker");

        // Configure persistent Session cookies so employees stay logged in
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Configure advanced HTML5 web browser settings
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        
        // Prevent system font or zoom scaling from breaking responsive designs
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        // Request runtime hardware permissions on start (GPS location & Camera)
        requestAppPermissions();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Force all page navigations to happen inside the app instead of launching Chrome browser
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            // Native Geolocation Bridge: Feeds HTML5 navigator.geolocation calls into Android permissions
            @Override
            public void onGeolocationPermissionsShowPrompt(
                    final String origin, 
                    final GeolocationPermissions.Callback callback
            ) {
                // Automatically grant geolocation access to our trusted domain URL
                callback.invoke(origin, true, false);
            }

            // Native Camera & File Bridge: Handles file input tags click triggers
            @Override
            public boolean onShowFileChooser(
                    WebView webView, 
                    ValueCallback<Uri[]> filePathCallback, 
                    FileChooserParams fileChooserParams
            ) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }
                MainActivity.this.filePathCallback = filePathCallback;

                Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
                    File photoFile = null;
                    try {
                        photoFile = createImageFile();
                        takePictureIntent.putExtra("PhotoPath", cameraPhotoPath);
                    } catch (IOException ex) {
                        Toast.makeText(MainActivity.this, "Error creating camera file", Toast.LENGTH_SHORT).show();
                    }

                    if (photoFile != null) {
                        Uri photoURI = FileProvider.getUriForFile(MainActivity.this,
                                "com.sonoray.erp.fileprovider",
                                photoFile);
                        takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                    } else {
                        takePictureIntent = null;
                    }
                }

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                
                String acceptType = "image/*";
                if (fileChooserParams != null && fileChooserParams.getAcceptTypes() != null && fileChooserParams.getAcceptTypes().length > 0) {
                    String firstAccept = fileChooserParams.getAcceptTypes()[0];
                    if (firstAccept != null && !firstAccept.trim().isEmpty()) {
                        acceptType = firstAccept;
                    }
                }
                contentSelectionIntent.setType(acceptType);

                Intent[] intentArray;
                if (takePictureIntent != null && acceptType.startsWith("image/")) {
                    intentArray = new Intent[]{takePictureIntent};
                } else {
                    intentArray = new Intent[0];
                }

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                
                String title = "Upload Attachment";
                if (acceptType.startsWith("image/")) {
                    title = "Select or Take Photo";
                } else if (acceptType.startsWith("video/")) {
                    title = "Select Video";
                } else if (acceptType.startsWith("audio/")) {
                    title = "Select Audio";
                }
                chooserIntent.putExtra(Intent.EXTRA_TITLE, title);
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                startActivityForResult(chooserIntent, INPUT_FILE_REQUEST_CODE);
                return true;
            }
        });

        webView.loadUrl(APP_URL);
    }

    private void requestAppPermissions() {
        java.util.List<String> listPermissionsNeeded = new java.util.ArrayList<>();
        listPermissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
        listPermissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        listPermissionsNeeded.add(Manifest.permission.CAMERA);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            listPermissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            listPermissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }

        java.util.List<String> listPermissionsToRequest = new java.util.ArrayList<>();
        for (String perm : listPermissionsNeeded) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsToRequest.add(perm);
            }
        }

        if (!listPermissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(this, 
                    listPermissionsToRequest.toArray(new String[0]), 
                    REQUEST_PERMISSIONS);
        } else {
            requestBackgroundLocationIfNeeded();
            requestIgnoreBatteryOptimizations();
        }
    }

    private void requestBackgroundLocationIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) 
                    != PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, 
                        "Location 'Allow all the time' permission is required for real-time tracking when the app is closed.", 
                        Toast.LENGTH_LONG).show();
                ActivityCompat.requestPermissions(this, 
                        new String[]{Manifest.permission.ACCESS_BACKGROUND_LOCATION}, 
                        102);
            }
        }
    }

    private void requestIgnoreBatteryOptimizations() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String packageName = getPackageName();
            android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                Toast.makeText(this, 
                        "Please select 'Unrestricted' battery usage to keep tracking active in the background.", 
                        Toast.LENGTH_LONG).show();
                try {
                    Intent intent = new Intent();
                    intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    startActivity(intent);
                } catch (Exception e) {
                    try {
                        Intent intent = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                        startActivity(intent);
                    } catch (Exception ex) {
                        Intent intent = new Intent(android.provider.Settings.ACTION_SETTINGS);
                        startActivity(intent);
                    }
                }
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_PERMISSIONS) {
            boolean fineLocationGranted = false;
            for (int i = 0; i < permissions.length; i++) {
                if (permissions[i].equals(Manifest.permission.ACCESS_FINE_LOCATION)) {
                    fineLocationGranted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                }
            }
            if (fineLocationGranted) {
                requestBackgroundLocationIfNeeded();
                requestIgnoreBatteryOptimizations();
            }
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "JPEG_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(imageFileName, ".jpg", storageDir);
        cameraPhotoPath = "file:" + image.getAbsolutePath();
        return image;
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode != INPUT_FILE_REQUEST_CODE || filePathCallback == null) {
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }

        Uri[] results = null;
        if (resultCode == Activity.RESULT_OK) {
            if (data == null || data.getData() == null) {
                if (cameraPhotoPath != null) {
                    results = new Uri[]{Uri.parse(cameraPhotoPath)};
                }
            } else {
                String dataString = data.getDataString();
                if (dataString != null) {
                    results = new Uri[]{Uri.parse(dataString)};
                }
            }
        }

        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
    }

    @Override
    public void onBackPressed() {
        // Native back-button history navigation
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // JavaScript interface to manage native foreground background location service
    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void setPunchState(boolean punchedIn, String employeeId, String token, String apiUrl) {
            Intent serviceIntent = new Intent(mContext, LocationService.class);
            if (punchedIn) {
                serviceIntent.putExtra("employeeId", employeeId);
                serviceIntent.putExtra("token", token);
                serviceIntent.putExtra("apiUrl", apiUrl);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    mContext.startForegroundService(serviceIntent);
                } else {
                    mContext.startService(serviceIntent);
                }
            } else {
                mContext.stopService(serviceIntent);
                mContext.getSharedPreferences("tracking_prefs", MODE_PRIVATE).edit().clear().apply();
            }
        }
    }
}
