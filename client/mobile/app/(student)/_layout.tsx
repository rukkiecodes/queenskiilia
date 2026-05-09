import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function StudentLayout() {
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
      <NativeTabs.Trigger name="skill-test">
        <NativeTabs.Trigger.Icon sf="star.circle" drawable="ic_menu_compass" />
        <NativeTabs.Trigger.Label>Skill Test</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="portfolio">
        <NativeTabs.Trigger.Icon sf="folder" drawable="ic_menu_gallery" />
        <NativeTabs.Trigger.Label>Portfolio</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Icon sf="message" drawable="ic_dialog_email" />
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
