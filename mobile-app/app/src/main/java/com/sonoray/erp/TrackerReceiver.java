package com.sonoray.erp;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

public class TrackerReceiver extends BroadcastReceiver {
    private static final String TAG = "TrackerReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "onReceive triggered with action: " + action);

        // Check if employee is currently punched in (checking saved tracking credentials)
        SharedPreferences prefs = context.getSharedPreferences("tracking_prefs", Context.MODE_PRIVATE);
        String employeeId = prefs.getString("employeeId", null);
        String token = prefs.getString("token", null);
        String apiUrl = prefs.getString("apiUrl", null);

        if (employeeId != null && token != null && apiUrl != null) {
            Log.d(TAG, "Punched-in credentials found. Restarting LocationService...");
            Intent serviceIntent = new Intent(context, LocationService.class);
            serviceIntent.putExtra("employeeId", employeeId);
            serviceIntent.putExtra("token", token);
            serviceIntent.putExtra("apiUrl", apiUrl);

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to restart LocationService from broadcast receiver", e);
            }
        } else {
            Log.d(TAG, "No active tracking credentials found. Service will not be started.");
        }
    }
}
