package ai.eburon.mobile.module

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import ai.eburon.mobile.service.OllamaService

class OllamaServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    private val intent: Intent = Intent(reactContext, OllamaService::class.java)

    override fun getName(): String = "OllamaServiceModule"

    @ReactMethod
    fun startService() {
        reactContext.startForegroundService(intent)
    }

    @ReactMethod
    fun stopService() {
        reactContext.stopService(intent)
    }
}
