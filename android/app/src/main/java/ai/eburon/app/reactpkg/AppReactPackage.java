package ai.eburon.app.reactpkg;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import ai.eburon.app.module.OllamaConfigModule;
import ai.eburon.app.module.OllamaServiceModule;

public class AppReactPackage implements ReactPackage {
    @NonNull
    @Override
    public List<NativeModule> createNativeModules(
            @NonNull ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new OllamaServiceModule(reactContext));
        modules.add(new OllamaConfigModule(reactContext));
        return modules;
    }

    @NonNull
    @Override
    public List<ViewManager> createViewManagers(
            @NonNull ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
