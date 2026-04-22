import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await supabase.from('users').update({ push_token: token }).eq('id', userId);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'ふぁみりんく',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8FA3',
    });
  }

  return token;
}

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: Date
) {
  const threeDays = new Date(dueDate);
  threeDays.setDate(threeDays.getDate() - 3);
  threeDays.setHours(8, 0, 0, 0);

  const oneDayBefore = new Date(dueDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  oneDayBefore.setHours(8, 0, 0, 0);

  const dueDay = new Date(dueDate);
  dueDay.setHours(8, 0, 0, 0);

  const now = new Date();

  const schedules = [
    { date: threeDays, label: '3日後が期限です' },
    { date: oneDayBefore, label: '明日が期限です' },
    { date: dueDay, label: '今日が期限です' },
  ].filter(s => s.date > now);

  for (const s of schedules) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📋 ${title}`,
        body: s.label,
        data: { taskId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: s.date },
    });
  }
}

export async function scheduleDailyPreparationReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎒 明日の準備を確認しよう！',
      body: '明日の持ち物チェックリストを確認してください',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 30,
    },
  });
}
