import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useUnreadCount } from '@/hooks/use-unread-count';

export default function BusinessLayout() {
  useUnreadCount();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Icon sf="house" drawable="ic_menu_home" />
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="projects">
        <NativeTabs.Trigger.Icon sf="briefcase" drawable="ic_menu_agenda" />
        <NativeTabs.Trigger.Label>Projects</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="talent">
        <NativeTabs.Trigger.Icon sf="person.2" drawable="ic_menu_myplaces" />
        <NativeTabs.Trigger.Label>Talent</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="payments">
        <NativeTabs.Trigger.Icon sf="creditcard" drawable="ic_menu_manage" />
        <NativeTabs.Trigger.Label>Payments</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Icon sf="message" drawable="ic_dialog_email" />
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
