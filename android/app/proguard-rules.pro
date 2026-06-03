# React Native Proguard rules
# Keep the names of React Native native methods
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
