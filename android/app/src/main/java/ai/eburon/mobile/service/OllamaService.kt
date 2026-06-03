package ai.eburon.mobile.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import ai.eburon.mobile.MainActivity
import ai.eburon.mobile.R
import ai.eburon.mobile.utils.OllamaExecutor

class OllamaService : Service() {
    private lateinit var ollamaExecutor: OllamaExecutor
    private var process: Process? = null

    companion object {
        var instance: OllamaService? = null
            private set
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ollamaExecutor = OllamaExecutor(this)
        ollamaExecutor.setupEnvironment()
        process = ollamaExecutor.startOllamaService()
        startForegroundService()
        return START_STICKY
    }

    private fun startForegroundService() {
        val channelId = "EburonAIServiceChannel"
        createNotificationChannel(channelId)

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_msg))
            .setAutoCancel(false)
            .setSmallIcon(R.drawable.eburon_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
    }

    fun updateNotification(title: String, text: String, progress: Int = 0, progressMax: Int = 0) {
        val channelId = "EburonAIServiceChannel"
        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(false)
            .setSmallIcon(R.drawable.eburon_notification)
            .setOngoing(true)

        if (progressMax > 0) {
            builder.setProgress(progressMax, progress, false)
        }

        val notification = builder.build()
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(1, notification)
    }

    private fun createNotificationChannel(channelId: String) {
        val channel = NotificationChannel(
            channelId,
            getString(R.string.notification_channel),
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    override fun onDestroy() {
        ollamaExecutor.stopOllamaService(process)
        instance = null
        super.onDestroy()
    }
}
