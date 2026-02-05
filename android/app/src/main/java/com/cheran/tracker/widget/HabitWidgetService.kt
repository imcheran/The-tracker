
package com.cheran.tracker.widget

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.cheran.tracker.R
import org.json.JSONArray
import org.json.JSONObject

class HabitWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return HabitListRemoteViewsFactory(this.applicationContext)
    }
}

class HabitListRemoteViewsFactory(private val context: Context) : RemoteViewsService.RemoteViewsFactory {
    private var habits: JSONArray = JSONArray()

    override fun onCreate() {
        loadData()
    }

    override fun onDataSetChanged() {
        loadData()
    }

    private fun loadData() {
        // Read from Capacitor Preferences (SharedPreferences name is 'CapacitorStorage')
        val prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE)
        val dataStr = prefs.getString("habits_widget_data", "[]")
        try {
            habits = JSONArray(dataStr)
        } catch (e: Exception) {
            habits = JSONArray()
        }
    }

    override fun onDestroy() {}

    override fun getCount(): Int = habits.length()

    override fun getViewAt(position: Int): RemoteViews {
        val views = RemoteViews(context.packageName, R.layout.habit_widget_item)
        
        try {
            val habit = habits.getJSONObject(position)
            val name = habit.getString("name")
            val icon = habit.optString("icon", "📝")
            val colorStr = habit.optString("color", "#3b82f6")
            val isCompleted = habit.optBoolean("isCompleted", false)

            views.setTextViewText(R.id.habit_name, name)
            views.setTextViewText(R.id.habit_icon, icon)

            // Styling based on completion
            if (isCompleted) {
                views.setInt(R.id.habit_check, "setColorFilter", Color.parseColor(colorStr))
                views.setImageViewResource(R.id.habit_check, android.R.drawable.checkbox_on_background)
                views.setInt(R.id.habit_name, "setTextColor", Color.GRAY)
            } else {
                views.setInt(R.id.habit_check, "setColorFilter", Color.LTGRAY)
                views.setImageViewResource(R.id.habit_check, android.R.drawable.checkbox_off_background)
                views.setInt(R.id.habit_name, "setTextColor", Color.BLACK)
            }

            // Fill intent for click (opens app)
            val fillInIntent = Intent()
            views.setOnClickFillInIntent(R.id.habit_item_root, fillInIntent)

        } catch (e: Exception) {
            e.printStackTrace()
        }

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
