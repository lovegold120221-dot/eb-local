package ai.eburon.app.module

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import androidx.core.content.edit

class OllamaConfigModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val PREFS_NAME = "eburon_ollama_prefs"
        const val LAN_LISTENING = "LAN_LISTENING"
    }

    @ReactMethod
    fun setLanListeningEnabled(enabled: Boolean) {
        val prefs: SharedPreferences = getReactApplicationContext()
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit { putBoolean(LAN_LISTENING, enabled) }
    }

    @ReactMethod
    fun getLanListeningEnabled(promise: Promise) {
        val prefs: SharedPreferences = getReactApplicationContext()
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        promise.resolve(prefs.getBoolean(LAN_LISTENING, false))
    }

    override fun getName(): String = "OllamaConfigModule"
}
