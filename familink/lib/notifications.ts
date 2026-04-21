import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Note: expo-device check removed for compatibility; handle in calling code

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ふぁみりんく',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B9D',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// Schedule a local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, unknown>
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: { date: triggerDate },
  });
}

// Schedule event reminders (3 days before, 1 day before, day of at 7am)
export async function scheduleEventReminders(
  eventTitle: string,
  eventDate: Date,
  reminderDays: number[] = [3, 1, 0]
): Promise<void> {
  for (const days of reminderDays) {
    const triggerDate = new Date(eventDate);
    triggerDate.setDate(triggerDate.getDate() - days);

    if (days === 0) {
      triggerDate.setHours(7, 0, 0, 0);
    } else {
      triggerDate.setHours(20, 0, 0, 0);
    }

    if (triggerDate > new Date()) {
      const title = days === 0
        ? `📅 今日は「${eventTitle}」です`
        : days === 1
        ? `⏰ 明日は「${eventTitle}」です`
        : `🔔 ${days}日後に「${eventTitle}」があります`;

      await scheduleLocalNotification(title, '持ち物の確認を忘れずに！', triggerDate);
    }
  }
}

// Schedule tomorrow's preparation reminder (every night at 21:00)
export async function scheduleTomorrowReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate());
  tomorrow.setHours(21, 0, 0, 0);

  if (tomorrow < new Date()) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  await scheduleLocalNotification(
    '🌙 明日の準備チェック',
    '明日の準備はできていますか？持ち物を確認しましょう',
    tomorrow
  );
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
